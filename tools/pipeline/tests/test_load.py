"""Integration tests against a migrated PostGIS. Each test rolls back, so local data is untouched.

Run with `DATABASE_URL` set after `pnpm db:up && pnpm db:migrate`; skipped otherwise (CI for now).
"""

import os
from collections.abc import Iterator
from pathlib import Path
from typing import Any

import psycopg
import pytest

from pipeline.context import Context
from pipeline.load import load_into, load_parcels

DATABASE_URL = os.environ.get("DATABASE_URL")
pytestmark = pytest.mark.skipif(not DATABASE_URL, reason="needs DATABASE_URL and a migrated DB")


def square(source_id: str, x: float, surface: int = 100) -> dict[str, Any]:
    y = 1203000.0
    ring = [[x, y], [x + 10, y], [x + 10, y + 10], [x, y + 10], [x, y]]
    return {
        "type": "Feature",
        "properties": {
            "identificateur": source_id,
            "date_de_mise_a_jour": "2026-01-08",
            "surface_m2": surface,
        },
        "geometry": {"type": "Polygon", "coordinates": [ring]},
    }


@pytest.fixture
def conn() -> Iterator[psycopg.Connection[Any]]:
    assert DATABASE_URL
    with psycopg.connect(DATABASE_URL) as connection:
        connection.execute("DELETE FROM parcel")
        yield connection
        connection.rollback()


def rows(conn: psycopg.Connection[Any]) -> list[tuple[Any, ...]]:
    return conn.execute(
        "SELECT source_id, ST_NumGeometries(geom), ST_SRID(geom), surface_m2"
        " FROM parcel ORDER BY source_id"
    ).fetchall()


def test_groups_polygons_by_identifier(conn: psycopg.Connection[Any]) -> None:
    result = load_into(conn, [square("A", 0), square("A", 50, 200), square("B", 100)])

    assert result.total == 2
    assert rows(conn) == [("A", 2, 2056, 300), ("B", 1, 2056, 100)]


def test_reloading_is_idempotent(conn: psycopg.Connection[Any]) -> None:
    features = [square("A", 0), square("B", 100)]
    load_into(conn, features)

    result = load_into(conn, features)

    assert (result.upserted, result.deleted, result.total) == (2, 0, 2)
    assert rows(conn) == [("A", 1, 2056, 100), ("B", 1, 2056, 100)]


def test_parcels_gone_from_the_source_are_removed(conn: psycopg.Connection[Any]) -> None:
    load_into(conn, [square("A", 0), square("B", 100)])

    result = load_into(conn, [square("B", 100)])

    assert result.deleted == 1
    assert [r[0] for r in rows(conn)] == ["B"]


def test_missing_cache_is_reported(tmp_path: Path) -> None:
    assert DATABASE_URL
    ctx = Context(cache_dir=tmp_path, env={"DATABASE_URL": DATABASE_URL})

    with pytest.raises(FileNotFoundError, match="run fetch_parcels first"):
        load_parcels(ctx)
