"""NE vineyard land use from the geodienste.ch agricultural land-use dataset. See docs/DATA.md."""

import json
import logging
import urllib.parse
from pathlib import Path
from typing import Any

from pipeline.context import Context
from pipeline.parcels import MissingCredentialsError, auth_headers

log = logging.getLogger(__name__)

WFS_URL = "https://geodienste.ch/db/lwb_nutzungsflaechen_v2_0_0/fra"
TYPENAME = "ms:surfaces_d_utilisation"
PAGE_SIZE = 1000
CACHE_FILE = "vine_land_use_ne.geojson"
# 701 "Vignes" and 717 "Surfaces viticoles présentant une biodiversité naturelle": both are
# planted vineyards, a surface is declared under one of them only. 722 (vine nurseries) is left out.
VINE_CODES = (701, 717)
# The farm identifier and the other declaration details are not needed, so they are not fetched.
PROPERTIES = "identificateur_utilisation,code_utilisation,annee_de_reference,wkb_geometry"


def equals(field: str, value: str) -> str:
    return (
        f"<PropertyIsEqualTo><ValueReference>{field}</ValueReference>"
        f"<Literal>{value}</Literal></PropertyIsEqualTo>"
    )


VINE_FILTER = (
    '<Filter xmlns="http://www.opengis.net/fes/2.0"><And>'
    + equals("canton", "NE")
    + "<Or>"
    + "".join(equals("code_utilisation", str(code)) for code in VINE_CODES)
    + "</Or></And></Filter>"
)


def page_url(start: int) -> str:
    query = {
        "SERVICE": "WFS",
        "VERSION": "2.0.0",
        "REQUEST": "GetFeature",
        "TYPENAMES": TYPENAME,
        "SRSNAME": "urn:ogc:def:crs:EPSG::2056",
        "OUTPUTFORMAT": "application/json; subtype=geojson",
        "FILTER": VINE_FILTER,
        "PROPERTYNAME": PROPERTIES,
        # A stable order keeps STARTINDEX paging from skipping or repeating features.
        "SORTBY": "identificateur_utilisation",
        "COUNT": str(PAGE_SIZE),
        "STARTINDEX": str(start),
    }
    return f"{WFS_URL}?{urllib.parse.urlencode(query)}"


def fetch_land_use(ctx: Context) -> Path:
    target = ctx.cache_dir / CACHE_FILE
    if target.exists() and not ctx.refresh:
        count = len(json.loads(target.read_text("utf-8"))["features"])
        log.info("cached: %d vine surfaces in %s (use --refresh to download again)", count, target)
        return target

    headers = auth_headers(ctx.env)
    features: list[Any] = []
    while True:
        batch = json.loads(ctx.http_get(page_url(len(features)), headers))["features"]
        features.extend(batch)
        if len(batch) < PAGE_SIZE:
            break
    # Same as the cadastre: without NE access geodienste answers 200 with no features.
    if not features:
        raise MissingCredentialsError(
            "geodienste returned 0 NE vine surfaces; check access to canton NE land use"
        )

    collection = {
        "type": "FeatureCollection",
        "name": "vine_land_use_ne",
        "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:EPSG::2056"}},
        "features": features,
    }
    ctx.cache_dir.mkdir(parents=True, exist_ok=True)
    partial = target.with_suffix(".partial")
    partial.write_text(json.dumps(collection), "utf-8")
    partial.replace(target)
    years = sorted({f["properties"].get("annee_de_reference") for f in features}, key=str)
    log.info("downloaded %d vine surfaces (reference year %s) to %s", len(features), years, target)
    return target
