import json
import urllib.parse
from collections.abc import Mapping
from pathlib import Path
from typing import Any

import pytest

from pipeline import parcels
from pipeline.context import Context

CREDENTIALS = {"GEODIENSTE_USER": "user", "GEODIENSTE_PASSWORD": "secret"}


def feature(identifier: int) -> dict[str, Any]:
    return {
        "type": "Feature",
        "properties": {"identificateur": str(identifier), "canton": "NE"},
        "geometry": {"type": "Point", "coordinates": [2556000, 1203000]},
    }


class FakeWfs:
    """Serves `total` features in pages, recording every request."""

    def __init__(self, total: int) -> None:
        self.total = total
        self.requests: list[tuple[dict[str, str], Mapping[str, str]]] = []

    def __call__(self, url: str, headers: Mapping[str, str]) -> bytes:
        query = dict(urllib.parse.parse_qsl(urllib.parse.urlsplit(url).query))
        self.requests.append((query, headers))
        start, count = int(query["STARTINDEX"]), int(query["COUNT"])
        page = [feature(i) for i in range(start, min(start + count, self.total))]
        return json.dumps({"type": "FeatureCollection", "features": page}).encode()


def make_ctx(
    tmp_path: Path, wfs: FakeWfs, env: Mapping[str, str] = CREDENTIALS, refresh: bool = False
) -> Context:
    return Context(cache_dir=tmp_path, env=env, http_get=wfs, refresh=refresh)


def test_downloads_every_page_into_the_cache(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(parcels, "PAGE_SIZE", 2)
    wfs = FakeWfs(total=5)

    target = parcels.fetch_parcels(make_ctx(tmp_path, wfs))

    collection = json.loads(target.read_text("utf-8"))
    ids = [f["properties"]["identificateur"] for f in collection["features"]]
    assert ids == ["0", "1", "2", "3", "4"]
    assert collection["crs"]["properties"]["name"] == "urn:ogc:def:crs:EPSG::2056"
    assert [query["STARTINDEX"] for query, _ in wfs.requests] == ["0", "2", "4"]


def test_requests_ne_only_with_basic_auth(tmp_path: Path) -> None:
    wfs = FakeWfs(total=1)

    parcels.fetch_parcels(make_ctx(tmp_path, wfs))

    query, headers = wfs.requests[0]
    assert "<Literal>NE</Literal>" in query["FILTER"]
    assert query["SRSNAME"] == "urn:ogc:def:crs:EPSG::2056"
    assert headers["Authorization"] == "Basic dXNlcjpzZWNyZXQ="


def test_reuses_the_cache_without_network(tmp_path: Path) -> None:
    parcels.fetch_parcels(make_ctx(tmp_path, FakeWfs(total=3)))
    offline = FakeWfs(total=0)

    parcels.fetch_parcels(make_ctx(tmp_path, offline))

    assert offline.requests == []


def test_refresh_downloads_again(tmp_path: Path) -> None:
    parcels.fetch_parcels(make_ctx(tmp_path, FakeWfs(total=3)))

    target = parcels.fetch_parcels(make_ctx(tmp_path, FakeWfs(total=4), refresh=True))

    assert len(json.loads(target.read_text("utf-8"))["features"]) == 4


def test_missing_credentials_fail_before_any_request(tmp_path: Path) -> None:
    wfs = FakeWfs(total=1)

    with pytest.raises(parcels.MissingCredentialsError):
        parcels.fetch_parcels(make_ctx(tmp_path, wfs, env={}))
    assert wfs.requests == []


def test_zero_features_means_no_ne_access(tmp_path: Path) -> None:
    with pytest.raises(parcels.MissingCredentialsError):
        parcels.fetch_parcels(make_ctx(tmp_path, FakeWfs(total=0)))
    assert not (tmp_path / parcels.CACHE_FILE).exists()
