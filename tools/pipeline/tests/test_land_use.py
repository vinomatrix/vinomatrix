import json
import urllib.parse
from collections.abc import Mapping
from pathlib import Path
from typing import Any

import pytest

from pipeline import land_use
from pipeline.context import Context
from pipeline.parcels import MissingCredentialsError

CREDENTIALS = {"GEODIENSTE_USER": "user", "GEODIENSTE_PASSWORD": "secret"}


def feature(identifier: int) -> dict[str, Any]:
    return {
        "type": "Feature",
        "properties": {
            "identificateur_utilisation": f"NE_2025_{identifier}",
            "code_utilisation": 701,
            "annee_de_reference": 2025,
        },
        "geometry": {"type": "Point", "coordinates": [2556000, 1203000]},
    }


class FakeWfs:
    """Serves `total` features in pages, recording every request."""

    def __init__(self, total: int) -> None:
        self.total = total
        self.requests: list[dict[str, str]] = []

    def __call__(self, url: str, headers: Mapping[str, str]) -> bytes:
        query = dict(urllib.parse.parse_qsl(urllib.parse.urlsplit(url).query))
        self.requests.append(query)
        start, count = int(query["STARTINDEX"]), int(query["COUNT"])
        page = [feature(i) for i in range(start, min(start + count, self.total))]
        return json.dumps({"type": "FeatureCollection", "features": page}).encode()


def make_ctx(tmp_path: Path, wfs: FakeWfs, refresh: bool = False) -> Context:
    return Context(cache_dir=tmp_path, env=CREDENTIALS, http_get=wfs, refresh=refresh)


def test_downloads_every_page_into_the_cache(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(land_use, "PAGE_SIZE", 2)
    wfs = FakeWfs(total=3)

    target = land_use.fetch_land_use(make_ctx(tmp_path, wfs))

    collection = json.loads(target.read_text("utf-8"))
    assert len(collection["features"]) == 3
    assert [query["STARTINDEX"] for query in wfs.requests] == ["0", "2"]


def test_requests_ne_vines_only_without_farm_details(tmp_path: Path) -> None:
    wfs = FakeWfs(total=1)

    land_use.fetch_land_use(make_ctx(tmp_path, wfs))

    query = wfs.requests[0]
    assert "<Literal>NE</Literal>" in query["FILTER"]
    assert "<Literal>701</Literal>" in query["FILTER"]
    assert "<Literal>717</Literal>" in query["FILTER"]
    assert "<Literal>722</Literal>" not in query["FILTER"]
    assert "identificateur_unite_exploitation" not in query["PROPERTYNAME"]


def test_reuses_the_cache_without_network(tmp_path: Path) -> None:
    land_use.fetch_land_use(make_ctx(tmp_path, FakeWfs(total=2)))
    offline = FakeWfs(total=0)

    land_use.fetch_land_use(make_ctx(tmp_path, offline))

    assert offline.requests == []


def test_zero_features_means_no_ne_access(tmp_path: Path) -> None:
    with pytest.raises(MissingCredentialsError):
        land_use.fetch_land_use(make_ctx(tmp_path, FakeWfs(total=0)))
    assert not (tmp_path / land_use.CACHE_FILE).exists()
