import assert from "node:assert/strict";
import test from "node:test";
import { buildTaskCardAction } from "./task-card-actions.ts";

test("buildTaskCardAction returns deliver-and-start for approved task", () => {
  assert.deepEqual(buildTaskCardAction("APPROVED"), {
    label: "投递并开始",
    actionType: "DELIVER_AND_START"
  });
});

test("buildTaskCardAction returns start-learning for delivered task", () => {
  assert.deepEqual(buildTaskCardAction("DELIVERED"), {
    label: "开始学习",
    actionType: "START_LEARNING"
  });
});

test("buildTaskCardAction returns null for completed task", () => {
  assert.equal(buildTaskCardAction("COMPLETED"), null);
});
