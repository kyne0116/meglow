import assert from "node:assert/strict";
import test from "node:test";
import { prioritizeTasks } from "./task-list-order.ts";

test("prioritizeTasks moves recommended task to the front", () => {
  const result = prioritizeTasks(
    [
      { id: "task-1", status: "APPROVED" },
      { id: "task-2", status: "DELIVERED" },
      { id: "task-3", status: "COMPLETED" }
    ],
    "task-2"
  );

  assert.deepEqual(result.map((item) => item.id), ["task-2", "task-1", "task-3"]);
});

test("prioritizeTasks keeps original order when recommendation is missing", () => {
  const result = prioritizeTasks(
    [
      { id: "task-1", status: "APPROVED" },
      { id: "task-2", status: "DELIVERED" }
    ],
    "task-9"
  );

  assert.deepEqual(result.map((item) => item.id), ["task-1", "task-2"]);
});
