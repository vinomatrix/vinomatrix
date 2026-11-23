"""Compute `parcel.planted_share` from the cached vine land use (column: apps/api migrations)."""

import json
import logging
from dataclasses import dataclass
from typing import Any

import psycopg

from pipeline.context import Context
from pipeline.land_use import CACHE_FILE

log = logging.getLogger(__name__)

# Vine surfaces are unioned per parcel first, so overlapping surfaces are not counted twice.
# A parcel touched by no surface gets 0: the union of zero rows is NULL, and coalesce must run
# before least(), which ignores NULLs (least(1, NULL) = 1). One that only shares an edge gets 0
# too (the intersection is a line). Rounding in the source geometries can push the ratio a hair
# above 1, hence least().
UPDATE = """
    UPDATE parcel p SET planted_share = least(1, coalesce((
        SELECT ST_Area(ST_Intersection(ST_MakeValid(p.geom), ST_Union(v.geom)))
        FROM vine_staging v
        WHERE ST_Intersects(p.geom, v.geom)
    ), 0) / ST_Area(p.geom))
"""

DISTRIBUTION = """
    SELECT count(*) FILTER (WHERE planted_share = 0),
           count(*) FILTER (WHERE planted_share > 0 AND planted_share <= 0.5),
           count(*) FILTER (WHERE planted_share > 0.5 AND planted_share < 1),
           count(*) FILTER (WHERE planted_share = 1),
           count(*) FILTER (WHERE planted_share IS NULL)
    FROM parcel
"""


@dataclass(frozen=True)
class ShareResult:
    zero: int
    up_to_half: int
    above_half: int
    full: int
    missing: int


def compute_into(conn: psycopg.Connection[Any], features: list[dict[str, Any]]) -> ShareResult:
    """Set `planted_share` on every parcel inside the caller's transaction."""
    rows = [(json.dumps(f["geometry"]),) for f in features]
    with conn.cursor() as cur:
        cur.execute(
            "CREATE TEMP TABLE vine_staging (geom geometry(MultiPolygon, 2056) NOT NULL)"
            " ON COMMIT DROP"
        )
        # ST_MakeValid can return a collection with lines or points; keep the polygons only.
        cur.executemany(
            "INSERT INTO vine_staging VALUES (ST_CollectionExtract("
            "ST_MakeValid(ST_SetSRID(ST_GeomFromGeoJSON(%s), 2056)), 3))",
            rows,
        )
        cur.execute("CREATE INDEX ON vine_staging USING GIST (geom)")
        cur.execute("ANALYZE vine_staging")
        cur.execute(UPDATE)
        cur.execute("DROP TABLE vine_staging")
        cur.execute(DISTRIBUTION)
        row = cur.fetchone()
    assert row is not None
    return ShareResult(*row)


def load_planted_share(ctx: Context) -> ShareResult:
    source = ctx.cache_dir / CACHE_FILE
    if not source.exists():
        raise FileNotFoundError(f"{source} is missing; run fetch_land_use first")
    url = ctx.env.get("DATABASE_URL")
    if not url:
        raise RuntimeError("Set DATABASE_URL in .env (see .env.example)")

    features = json.loads(source.read_text("utf-8"))["features"]
    try:
        with psycopg.connect(url) as conn:
            result = compute_into(conn, features)
    except psycopg.errors.UndefinedColumn as error:
        raise RuntimeError("Column `planted_share` is missing; run `pnpm db:migrate`") from error

    log.info(
        "planted_share: %d at 0, %d in (0, 0.5], %d in (0.5, 1), %d at 1, %d missing",
        result.zero,
        result.up_to_half,
        result.above_half,
        result.full,
        result.missing,
    )
    return result
