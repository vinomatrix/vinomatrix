"""NE vineyard parcels from the geodienste.ch vineyard cadastre (MGDM 151.1). See docs/DATA.md."""

import base64
import json
import logging
import urllib.parse
from collections.abc import Mapping
from pathlib import Path
from typing import Any

from pipeline.context import Context

log = logging.getLogger(__name__)

WFS_URL = "https://geodienste.ch/db/lwb_rebbaukataster_v2_0_0/fra"
TYPENAME = "ms:cadastre_viticole"
PAGE_SIZE = 1000
CACHE_FILE = "parcels_ne.geojson"
CANTON_FILTER = (
    '<Filter xmlns="http://www.opengis.net/fes/2.0"><PropertyIsEqualTo>'
    "<ValueReference>canton</ValueReference><Literal>NE</Literal>"
    "</PropertyIsEqualTo></Filter>"
)


class MissingCredentialsError(RuntimeError):
    pass


def page_url(start: int) -> str:
    query = {
        "SERVICE": "WFS",
        "VERSION": "2.0.0",
        "REQUEST": "GetFeature",
        "TYPENAMES": TYPENAME,
        "SRSNAME": "urn:ogc:def:crs:EPSG::2056",
        "OUTPUTFORMAT": "application/json; subtype=geojson",
        "FILTER": CANTON_FILTER,
        # A stable order keeps STARTINDEX paging from skipping or repeating features.
        "SORTBY": "identificateur",
        "COUNT": str(PAGE_SIZE),
        "STARTINDEX": str(start),
    }
    return f"{WFS_URL}?{urllib.parse.urlencode(query)}"


def auth_headers(env: Mapping[str, str]) -> dict[str, str]:
    user = env.get("GEODIENSTE_USER")
    password = env.get("GEODIENSTE_PASSWORD")
    if not user or not password:
        raise MissingCredentialsError(
            "Set GEODIENSTE_USER and GEODIENSTE_PASSWORD in .env (see docs/DATA.md)"
        )
    token = base64.b64encode(f"{user}:{password}".encode()).decode()
    return {"Authorization": f"Basic {token}"}


def fetch_parcels(ctx: Context) -> Path:
    target = ctx.cache_dir / CACHE_FILE
    if target.exists() and not ctx.refresh:
        count = len(json.loads(target.read_text("utf-8"))["features"])
        log.info("cached: %d parcels in %s (use --refresh to download again)", count, target)
        return target

    headers = auth_headers(ctx.env)
    features: list[Any] = []
    while True:
        batch = json.loads(ctx.http_get(page_url(len(features)), headers))["features"]
        features.extend(batch)
        if len(batch) < PAGE_SIZE:
            break
    # Without NE access geodienste answers 200 with no features rather than 401.
    if not features:
        raise MissingCredentialsError("geodienste returned 0 NE parcels; check access to canton NE")

    collection = {
        "type": "FeatureCollection",
        "name": "cadastre_viticole_ne",
        "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:EPSG::2056"}},
        "features": features,
    }
    ctx.cache_dir.mkdir(parents=True, exist_ok=True)
    partial = target.with_suffix(".partial")
    partial.write_text(json.dumps(collection), "utf-8")
    partial.replace(target)
    log.info("downloaded %d parcels to %s", len(features), target)
    return target
