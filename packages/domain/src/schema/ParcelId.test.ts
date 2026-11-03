import { Schema } from "effect";
import { describe, expect, it } from "vitest";
import { ParcelId } from "./ParcelId.ts";

describe("ParcelId", () => {
  const decode = Schema.decodeUnknownSync(ParcelId);

  it("accepts a non-empty string", () => {
    expect(decode("NE-1234")).toBe("NE-1234");
  });

  it("rejects an empty string", () => {
    expect(() => decode("")).toThrow();
  });
});
