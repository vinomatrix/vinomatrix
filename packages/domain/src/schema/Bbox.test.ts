import { Schema } from "effect";
import { describe, expect, it } from "vitest";
import { Bbox } from "./Bbox.ts";

describe("Bbox", () => {
  const decode = Schema.decodeUnknownSync(Bbox);

  it("decodes minLon,minLat,maxLon,maxLat into numbers", () => {
    expect(decode("6.8,46.9,7.0,47.05")).toEqual([6.8, 46.9, 7.0, 47.05]);
  });

  it("encodes back to the query-string form", () => {
    expect(Schema.encodeSync(Bbox)([6.8, 46.9, 7, 47.05])).toBe("6.8,46.9,7,47.05");
  });

  it.each([
    ["three parts", "6.8,46.9,7.0"],
    ["five parts", "6.8,46.9,7.0,47.0,1"],
    ["not a number", "6.8,abc,7.0,47.0"],
    ["longitude out of range", "6.8,46.9,190,47.0"],
    ["latitude out of range", "6.8,-91,7.0,47.0"],
    ["min not below max", "7.0,46.9,6.8,47.0"],
    ["empty", ""],
  ])("rejects %s", (_label, input) => {
    expect(() => decode(input)).toThrow();
  });
});
