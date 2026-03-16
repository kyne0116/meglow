import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPronunciationAnswer,
  getLearningItemTypeLabel
} from "./item-helpers.ts";

test("getLearningItemTypeLabel returns pronunciation label", () => {
  assert.equal(getLearningItemTypeLabel("WORD_PRONUNCIATION"), "朗读题");
});

test("getLearningItemTypeLabel falls back to raw item type", () => {
  assert.equal(getLearningItemTypeLabel("UNKNOWN_TYPE"), "UNKNOWN_TYPE");
});

test("buildPronunciationAnswer returns completed payload", () => {
  assert.deepEqual(buildPronunciationAnswer(), { completed: true });
});
