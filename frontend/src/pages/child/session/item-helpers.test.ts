import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPronunciationAnswer,
  getLearningItemTypeLabel,
  readPromptExampleSentence
} from "./item-helpers.ts";

test("getLearningItemTypeLabel returns pronunciation label", () => {
  assert.equal(getLearningItemTypeLabel("WORD_PRONUNCIATION"), "朗读题");
});

test("getLearningItemTypeLabel falls back to raw item type", () => {
  assert.equal(getLearningItemTypeLabel("UNKNOWN_TYPE"), "UNKNOWN_TYPE");
});

test("buildPronunciationAnswer returns completed payload with self rating", () => {
  assert.deepEqual(buildPronunciationAnswer("GOOD"), {
    completed: true,
    selfRating: "GOOD"
  });
});

test("buildPronunciationAnswer defaults to ok self rating", () => {
  assert.deepEqual(buildPronunciationAnswer(), {
    completed: true,
    selfRating: "OK"
  });
});

test("readPromptExampleSentence returns trimmed example sentence", () => {
  assert.equal(
    readPromptExampleSentence({ exampleSentence: "  I read in the library.  " }),
    "I read in the library."
  );
});

test("readPromptExampleSentence returns empty string when example sentence is missing", () => {
  assert.equal(readPromptExampleSentence({}), "");
});
