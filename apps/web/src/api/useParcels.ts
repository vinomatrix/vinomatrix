import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { Bbox } from "@vinomatrix/domain/schema";
import { fetchParcels } from "./client.ts";

// Parcels for the visible bbox. The previous result stays on the map while the next one loads.
// Parcels only change when the pipeline runs, so a fetched bbox stays fresh for the session.
export const useParcels = (bbox: Bbox) =>
  useQuery({
    queryKey: ["parcels", bbox],
    queryFn: ({ signal }) => fetchParcels(bbox, signal),
    placeholderData: keepPreviousData,
    staleTime: Infinity,
  });
