import { describe, it, expect } from "vitest";
import { route } from "../src/agent/graph.js";

describe("Routers", () => {
  it("Test route", async () => {
    const res = route();
    expect(res).toEqual("ingest_node");
  }, 100_000);
});
