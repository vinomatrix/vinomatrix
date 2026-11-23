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
from pipeline.load import load_into
from pipeline.planted_share import compute_into, load_planted_share

DATABASE_URL = os.environ.get("DATABASE_URL")
pytestmark = pytest.mark.skipif(not DATABASE_URL, reason="needs DATABASE_URL and a migrated DB")

Y = 1203000.0


def rect(x0: float, x1: float, y0: float = Y, y1: float = Y + 10) -> list[list[float]]:
    return [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]


def parcel(source_id: str, x: float) -> dict[str, Any]:
    """A 10 x 10 m parcel starting at `x`."""
    return {
        "type": "Feature",
        "properties": {"identificateur": source_id, "surface_m2": 100},
        "geometry": {"type": "Polygon", "coordinates": [rect(x, x + 10)]},
    }


def vine(*rings: list[list[float]]) -> dict[str, Any]:
    return {
        "type": "Feature",
        "properties": {"code_utilisation": 701},
        "geometry": {"type": "MultiPolygon", "coordinates": [[r] for r in rings]},
    }


@pytest.fixture
def conn() -> Iterator[psycopg.Connection[Any]]:
    assert DATABASE_URL
    with psycopg.connect(DATABASE_URL) as connection:
        connection.execute("DELETE FROM parcel")
        yield connection
        connection.rollback()


def shares(conn: psycopg.Connection[Any]) -> dict[str, float]:
    rows = conn.execute("SELECT source_id, planted_share FROM parcel").fetchall()
    return {source_id: round(share, 4) for source_id, share in rows}


def test_share_is_the_planted_fraction_of_each_parcel(conn: psycopg.Connection[Any]) -> None:
    load_into(conn, [parcel("half", 0), parcel("none", 100), parcel("edge", 200)])

    compute_into(
        conn,
        [
            vine(rect(0, 5)),  # left half of "half"
            vine(rect(210, 220)),  # shares only an edge with "edge"
        ],
    )

    assert shares(conn) == {"half": 0.5, "none": 0, "edge": 0}


def test_overlapping_vines_are_not_counted_twice(conn: psycopg.Connection[Any]) -> None:
    load_into(conn, [parcel("A", 0)])

    compute_into(conn, [vine(rect(0, 5)), vine(rect(0, 5)), vine(rect(2, 5))])

    assert shares(conn) == {"A": 0.5}


def test_a_vine_larger_than_the_parcel_gives_one(conn: psycopg.Connection[Any]) -> None:
    load_into(conn, [parcel("A", 0), parcel("B", 10)])

    result = compute_into(conn, [vine(rect(-5, 15, Y - 5, Y + 15))])

    assert shares(conn) == {"A": 1, "B": 0.5}
    assert (result.zero, result.up_to_half, result.full, result.missing) == (0, 1, 1, 0)


def test_missing_cache_is_reported(tmp_path: Path) -> None:
    assert DATABASE_URL
    ctx = Context(cache_dir=tmp_path, env={"DATABASE_URL": DATABASE_URL})

    with pytest.raises(FileNotFoundError, match="run fetch_land_use first"):
        load_planted_share(ctx)
