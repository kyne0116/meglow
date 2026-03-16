import assert from "node:assert/strict";
import test from "node:test";
import { resolveSelectedChildIndex } from "./selection.ts";

test("resolveSelectedChildIndex returns 0 when no childId is provided", () => {
  const result = resolveSelectedChildIndex(
    [
      { id: "child-1" },
      { id: "child-2" }
    ],
    ""
  );

  assert.equal(result, 0);
});

test("resolveSelectedChildIndex returns the matching child index", () => {
  const result = resolveSelectedChildIndex(
    [
      { id: "child-1" },
      { id: "child-2" },
      { id: "child-3" }
    ],
    "child-3"
  );

  assert.equal(result, 2);
});

test("resolveSelectedChildIndex falls back to 0 when childId is missing", () => {
  const result = resolveSelectedChildIndex(
    [
      { id: "child-1" },
      { id: "child-2" }
    ],
    "child-9"
  );

  assert.equal(result, 0);
});
