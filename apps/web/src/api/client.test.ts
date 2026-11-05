import type { Bbox } from "@vinomatrix/domain/schema";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchParcels } from "./client.ts";

const bbox: Bbox = [6.8, 46.9, 7, 47.05];

// FetchHttpClient reads globalThis.fetch once, on first use: stub it once, vary the response per test.
const fetchMock = vi.fn<typeof fetch>();
vi.stubGlobal("fetch", fetchMock);

const respondWith = (body: unknown) => {
  fetchMock.mockResolvedValueOnce(
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  );
};

describe("fetchParcels", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("calls GET /api/parcels with the encoded bbox and decodes the collection", async () => {
    respondWith({ type: "FeatureCollection", features: [], truncated: false });

    const collection = await fetchParcels(bbox);

    expect(collection).toEqual({ type: "FeatureCollection", features: [], truncated: false });
    const [input] = fetchMock.mock.calls[0] ?? [];
    const url = new URL(input instanceof Request ? input.url : String(input));
    expect(url.pathname).toBe("/api/parcels");
    expect(url.searchParams.get("bbox")).toBe("6.8,46.9,7,47.05");
  });

  it("rejects when the response does not match the contract", async () => {
    respondWith({ type: "FeatureCollection" });
    await expect(fetchParcels(bbox)).rejects.toBeDefined();
  });
});
