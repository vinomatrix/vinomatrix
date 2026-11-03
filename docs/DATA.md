# Data sources

Every dataset the pipeline loads, where it comes from, and the terms we use it under. Update this file in the same PR that adds or changes a source.

## Vineyard parcels (NE)

|                       |                                                                                                                                                                                               |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dataset               | Cadastre viticole, canton NE — minimal geodata model MGDM 151.1 v2.0                                                                                                                          |
| Producer              | SITN / Service de l'agriculture, station viticole (contact: sitn@ne.ch)                                                                                                                       |
| Distributor           | [geodienste.ch — lwb_rebbaukataster](https://www.geodienste.ch/services/lwb_rebbaukataster/info)                                                                                              |
| Service               | WFS 2.0 `https://geodienste.ch/db/lwb_rebbaukataster_v2_0_0/fra`, type `ms:cadastre_viticole`, filtered on `canton = NE`                                                                      |
| CRS                   | EPSG:2056 (LV95)                                                                                                                                                                              |
| Access                | **Registration required** for NE ("Enregistrement requis"); HTTP basic auth. No contract required.                                                                                            |
| Terms                 | "Utilisation libre. Obligation d'indiquer la source." — [SITN contract](https://sitn.ne.ch/geoshop2_media/documents/contrat_sitn.pdf), [geodienste terms](https://geodienste.ch/terms-of-use) |
| Attribution           | **Source : SITN, Service de l'agriculture du canton de Neuchâtel (via geodienste.ch)** — must appear on the map and in the README                                                             |
| Last update at source | 2026-01-08 (update cycle: as needed)                                                                                                                                                          |
| Pipeline step         | `fetch_parcels` → `tools/pipeline/.cache/parcels_ne.geojson`                                                                                                                                  |

Credentials: set `GEODIENSTE_USER` and `GEODIENSTE_PASSWORD` in the repo-root `.env` (gitignored, see `.env.example`). Without NE access the WFS answers 200 with zero features; the step treats that as an error.

### What the data is

- 2835 polygons, about 603 ha, attributes `identificateur`, `date_de_mise_a_jour`, `surface_m2`, `canton` (as of 2026-11-03).
- The cadastre covers parcels **planted with vines or where vines may be planted**, without distinguishing the two. It is not a map of what is actually planted today.
- `identificateur` is **not unique per polygon**: 183 identifiers have several polygons (one parcel in several pieces). The load step (#9) must group by identifier (e.g. into a MultiPolygon) rather than upsert one row per polygon.

### Sources that did not work (2026-11-03)

- SITN's own WFS (`https://sitn.ne.ch/services/wms?SERVICE=WFS`) lists the official-survey land-cover layers, but `GetFeature` and `DescribeFeatureType` answer **451 Unavailable For Legal Reasons**. Not to be worked around.
- SITN dataset VT02 "Surfaces vignes" (land cover from the official survey) is not in SITN's open WMS/WFS; the official survey on geodienste.ch is "Autorisation requise" for NE.
- opendata.swiss / ASIT have open vineyard cadastres for GE, FR, BE and JU, not NE.
- The federal open dataset `ch.blw.steil_terrassenlagen_rebbau` (OFAG, "Vignobles en pente") covers NE but only steep and terraced vineyards, last updated 2013. Fallback only.
