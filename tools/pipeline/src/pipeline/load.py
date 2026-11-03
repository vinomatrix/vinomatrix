"""Load cached parcels into PostGIS table `parcel` (created by apps/api migrations)."""

import json
import logging
from dataclasses import dataclass
from typing import Any

import psycopg

from pipeline.context import Context
from pipeline.parcels import CACHE_FILE

log = logging.getLogger(__name__)

# One row per cadastre identifier: some identifiers have several polygons (docs/DATA.md).
UPSERT = """
    INSERT INTO parcel (source_id, geom, surface_m2, source_updated_on)
    SELECT source_id, ST_Multi(ST_Collect(geom)), sum(surface_m2), max(source_updated_on)
    FROM parcel_staging
    GROUP BY source_id
    ON CONFLICT (source_id) DO UPDATE SET
        geom = EXCLUDED.geom,
        surface_m2 = EXCLUDED.surface_m2,
        source_updated_on = EXCLUDED.source_updated_on,
        loaded_at = now()
"""


@dataclass(frozen=True)
class LoadResult:
    upserted: int
    deleted: int
    total: int


def load_into(conn: psycopg.Connection[Any], features: list[dict[str, Any]]) -> LoadResult:
    """Make `parcel` match `features` inside the caller's transaction."""
    rows = [
        (
            f["properties"]["identificateur"],
            f["properties"].get("date_de_mise_a_jour"),
            f["properties"].get("surface_m2"),
            json.dumps(f["geometry"]),
        )
        for f in features
    ]
    with conn.cursor() as cur:
        cur.execute(
            """
            CREATE TEMP TABLE parcel_staging (
                source_id text NOT NULL,
                source_updated_on date,
                surface_m2 integer,
                geom geometry(Polygon, 2056) NOT NULL
            ) ON COMMIT DROP
            """
        )
        cur.executemany(
            "INSERT INTO parcel_staging"
            " VALUES (%s, %s, %s, ST_SetSRID(ST_GeomFromGeoJSON(%s), 2056))",
            rows,
        )
        cur.execute(UPSERT)
        upserted = cur.rowcount
        # Parcels removed from the source disappear here too, so the table mirrors the cache.
        cur.execute(
            "DELETE FROM parcel p"
            " WHERE NOT EXISTS (SELECT 1 FROM parcel_staging s WHERE s.source_id = p.source_id)"
        )
        deleted = cur.rowcount
        cur.execute("DROP TABLE parcel_staging")
        cur.execute("SELECT count(*) FROM parcel")
        row = cur.fetchone()
    return LoadResult(upserted=upserted, deleted=deleted, total=row[0] if row else 0)


def load_parcels(ctx: Context) -> LoadResult:
    source = ctx.cache_dir / CACHE_FILE
    if not source.exists():
        raise FileNotFoundError(f"{source} is missing; run fetch_parcels first")
    url = ctx.env.get("DATABASE_URL")
    if not url:
        raise RuntimeError("Set DATABASE_URL in .env (see .env.example)")

    features = json.loads(source.read_text("utf-8"))["features"]
    try:
        with psycopg.connect(url) as conn:
            result = load_into(conn, features)
    except psycopg.errors.UndefinedTable as error:
        raise RuntimeError("Table `parcel` does not exist; run `pnpm db:migrate`") from error

    log.info(
        "%d parcels upserted, %d removed, %d in table `parcel`",
        result.upserted,
        result.deleted,
        result.total,
    )
    return result
