"""Pipeline steps. Each step is `step_x(ctx) -> None` and safe to re-run."""

from collections.abc import Callable
from dataclasses import dataclass

from pipeline.context import Context
from pipeline.load import load_parcels
from pipeline.parcels import fetch_parcels


@dataclass(frozen=True)
class Step:
    name: str
    description: str
    run: Callable[[Context], None]


def step_fetch_parcels(ctx: Context) -> None:
    fetch_parcels(ctx)


def step_load_parcels(ctx: Context) -> None:
    load_parcels(ctx)


STEPS: list[Step] = [
    Step(
        "fetch_parcels",
        "Fetch NE vineyard parcels from geodienste.ch WFS → GeoJSON (EPSG:2056)",
        step_fetch_parcels,
    ),
    Step(
        "load_parcels",
        "Upsert parcels into PostGIS table `parcel`",
        step_load_parcels,
    ),
]
