import assert from "node:assert/strict";
import test from "node:test";
import { prioritizePendingPushes } from "./approval-list-order.ts";

test("prioritizePendingPushes moves recommended push to the front", () => {
  const result = prioritizePendingPushes(
    [
      { id: "push-1" },
      { id: "push-2" },
      { id: "push-3" }
    ],
    "push-2"
  );

  assert.deepEqual(result.map((item) => item.id), ["push-2", "push-1", "push-3"]);
});

test("prioritizePendingPushes keeps order when recommendation is missing", () => {
  const result = prioritizePendingPushes([{ id: "push-1" }, { id: "push-2" }], "push-9");

  assert.deepEqual(result.map((item) => item.id), ["push-1", "push-2"]);
});
