"""Pipeline steps. Each step is `step_x(ctx) -> None` and safe to re-run."""

from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path

CACHE_DIR = Path(__file__).resolve().parents[2] / ".cache"


@dataclass(frozen=True)
class Context:
    cache_dir: Path = CACHE_DIR


@dataclass(frozen=True)
class Step:
    name: str
    description: str
    run: Callable[[Context], None]


def step_fetch_parcels(ctx: Context) -> None:
    raise NotImplementedError("fetch_parcels lands in #8")


def step_load_parcels(ctx: Context) -> None:
    raise NotImplementedError("load_parcels lands in #9")


STEPS: list[Step] = [
    Step(
        "fetch_parcels",
        "Fetch Neuchâtel vineyard parcels from SITN WFS → GeoJSON (EPSG:2056)",
        step_fetch_parcels,
    ),
    Step(
        "load_parcels",
        "Upsert parcels into PostGIS table `parcel`",
        step_load_parcels,
    ),
]
