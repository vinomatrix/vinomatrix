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
- The cadastre covers parcels **planted with vines or where vines may be planted**, without distinguishing the two. It is not a map of what is actually planted today; see [Vine land use (NE)](#vine-land-use-ne) for `planted_share`.
- `identificateur` is **not unique per polygon**: 183 identifiers have several polygons (one parcel in several pieces). The load step (#9) must group by identifier (e.g. into a MultiPolygon) rather than upsert one row per polygon.

### Sources that did not work (2026-11-03)

- SITN's own WFS (`https://sitn.ne.ch/services/wms?SERVICE=WFS`) lists the official-survey land-cover layers, but `GetFeature` and `DescribeFeatureType` answer **451 Unavailable For Legal Reasons**. Not to be worked around.
- SITN dataset VT02 "Surfaces vignes" (land cover from the official survey) is not in SITN's open WMS/WFS; the official survey on geodienste.ch is "Autorisation requise" for NE.
- opendata.swiss / ASIT have open vineyard cadastres for GE, FR, BE and JU, not NE.
- The federal open dataset `ch.blw.steil_terrassenlagen_rebbau` (OFAG, "Vignobles en pente") covers NE but only steep and terraced vineyards, last updated 2013. Fallback only.

## Vine land use (NE)

|                |                                                                                                                                                                                               |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dataset        | Surfaces d'utilisation agricoles, canton NE — federal model (OFAG), declarations for direct payments                                                                                          |
| Producer       | Service de l'agriculture, Office des paiements directs, canton NE (contact: sitn@ne.ch)                                                                                                       |
| Distributor    | [geodienste.ch — lwb_nutzungsflaechen](https://www.geodienste.ch/services/lwb_nutzungsflaechen/info)                                                                                          |
| Service        | WFS 2.0 `https://geodienste.ch/db/lwb_nutzungsflaechen_v2_0_0/fra`, type `ms:surfaces_d_utilisation`, filtered on `canton = NE` and `code_utilisation IN (701, 717)`                          |
| CRS            | EPSG:2056 (LV95)                                                                                                                                                                              |
| Access         | **Registration required** for NE, same geodienste account as the cadastre                                                                                                                     |
| Terms          | "Utilisation libre. Obligation d'indiquer la source." — [SITN contract](https://sitn.ne.ch/geoshop2_media/documents/contrat_sitn.pdf), [geodienste terms](https://geodienste.ch/terms-of-use) |
| Attribution    | **Source : SITN, Service de l'agriculture du canton de Neuchâtel (via geodienste.ch)** — same line as the cadastre                                                                            |
| Reference year | **2025** (`annee_de_reference`); last update at source 2026-01-12                                                                                                                             |
| Pipeline steps | `fetch_land_use` → `tools/pipeline/.cache/vine_land_use_ne.geojson`; `load_planted_share` → `parcel.planted_share`                                                                            |

### Crop codes

| Code | Use                                                      | NE, 2025          | Kept |
| ---- | -------------------------------------------------------- | ----------------- | ---- |
| 701  | Vignes                                                   | 454 surf., 203 ha | yes  |
| 717  | Surfaces viticoles présentant une biodiversité naturelle | 520 surf., 349 ha | yes  |
| 722  | Pépinières viticoles                                     | 2 surf., 5 ha     | no   |

Each surface is declared under **one** code (`est_superpose` is false for all of them), so a vineyard managed for biodiversity is 717 instead of 701, not both. Both are planted, producing vineyards; 701 alone would miss more than half of them. Vine nurseries grow plants, not wine.

Only the geometry, the code, the declaration id and the year are fetched (`PROPERTYNAME`). The farm identifier and the other declaration details are not.

### planted_share

`parcel.planted_share = area(parcel ∩ union of the vine surfaces touching it) / area(parcel)`, between 0 and 1, computed in PostGIS (LV95, so areas are in m²). Result on 2026-11-23: 2611 parcels, 289 at 0, 193 in (0, 0.5], 1788 in (0.5, 1), 341 at 1; **2129 above 0.5**. That is about 530 ha planted out of the 603 ha of the cadastre.

Limits: the declarations cover farms that claim direct payments. Very small or hobby vineyards may be missing, so a parcel at 0 is "not declared as vineyard in 2025", not proof that it has no vines.
