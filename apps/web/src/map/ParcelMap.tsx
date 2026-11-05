import "maplibre-gl/dist/maplibre-gl.css";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import type { Bbox } from "@vinomatrix/domain/schema";
import { setWorkerUrl } from "maplibre-gl";
import { useState } from "react";
import { Layer, Map, Source } from "react-map-gl/maplibre";
import { useParcels } from "../api/useParcels.ts";
import { fr } from "../i18n/fr.ts";
import { toBbox } from "./bbox.ts";
import styles from "./ParcelMap.module.css";

// MapLibre 6 needs the worker URL set once under a bundler (official Vite setup, see maplibre.org Installation).
setWorkerUrl(workerUrl);

// swisstopo light basemap (vector tiles). Its tiles carry the "© swisstopo" attribution.
const BASEMAP = "https://vectortiles.geo.admin.ch/styles/ch.swisstopo.lightbasemap.vt/style.json";

// Vineyards along Lake Neuchâtel, from Vaumarcus to Le Landeron. Also the first bbox requested,
// so parcels load alongside the basemap tiles instead of waiting for the map's load event.
const NE_VINEYARDS: [number, number, number, number] = [6.76, 46.86, 7.08, 47.07];

// MapLibre paint cannot read CSS variables; these mirror --color-accent.
const PARCEL_COLOR = "#7b1e3a";

export function ParcelMap() {
  const [bbox, setBbox] = useState<Bbox>(NE_VINEYARDS);
  const { data, isError } = useParcels(bbox);

  return (
    <div className={styles.map}>
      <Map
        initialViewState={{ bounds: NE_VINEYARDS }}
        mapStyle={BASEMAP}
        attributionControl={{ customAttribution: fr.map.attributionParcels }}
        onMoveEnd={(event) => {
          setBbox(toBbox(event.target.getBounds()));
        }}
      >
        {data && (
          <Source id="parcels" type="geojson" data={data}>
            <Layer
              id="parcels-fill"
              type="fill"
              paint={{ "fill-color": PARCEL_COLOR, "fill-opacity": 0.25 }}
            />
            <Layer
              id="parcels-line"
              type="line"
              paint={{ "line-color": PARCEL_COLOR, "line-width": 1 }}
            />
          </Source>
        )}
      </Map>
      {isError && (
        <p role="alert" className={styles.error}>
          {fr.map.loadError}
        </p>
      )}
    </div>
  );
}
