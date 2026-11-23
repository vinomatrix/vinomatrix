import "maplibre-gl/dist/maplibre-gl.css";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import { Alert } from "@mantine/core";
import type { Bbox } from "@vinomatrix/domain/schema";
import { setWorkerUrl } from "maplibre-gl";
import { useState } from "react";
import { Layer, Map, Source } from "react-map-gl/maplibre";
import { useParcels } from "../api/useParcels.ts";
import { fr } from "../i18n/fr.ts";
import { toBbox } from "./bbox.ts";
import { MapLegend } from "./MapLegend.tsx";
import styles from "./ParcelMap.module.css";
import { FILL_PAINT, LINE_PAINT, WITH_VINES } from "./parcelStyle.ts";

// MapLibre 6 needs the worker URL set once under a bundler (official Vite setup, see maplibre.org Installation).
setWorkerUrl(workerUrl);

// swisstopo light basemap (vector tiles). Its tiles carry the "© swisstopo" attribution.
const BASEMAP = "https://vectortiles.geo.admin.ch/styles/ch.swisstopo.lightbasemap.vt/style.json";

// Vineyards along Lake Neuchâtel, from Vaumarcus to Le Landeron. Also the first bbox requested,
// so parcels load alongside the basemap tiles instead of waiting for the map's load event.
const NE_VINEYARDS: [number, number, number, number] = [6.76, 46.86, 7.08, 47.07];

export function ParcelMap() {
  const [bbox, setBbox] = useState<Bbox>(NE_VINEYARDS);
  const { data, isError } = useParcels(bbox);
  const [hideUndeclared, setHideUndeclared] = useState(false);
  // Filtering happens in MapLibre on the loaded features: toggling sends no request.
  const filter = hideUndeclared ? WITH_VINES : true;

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
            <Layer id="parcels-fill" type="fill" paint={FILL_PAINT} filter={filter} />
            <Layer id="parcels-line" type="line" paint={LINE_PAINT} filter={filter} />
          </Source>
        )}
      </Map>
      <MapLegend hideUndeclared={hideUndeclared} onHideUndeclaredChange={setHideUndeclared} />
      {isError && (
        <Alert color="red" className={styles.error}>
          {fr.map.loadError}
        </Alert>
      )}
    </div>
  );
}
