import assert from "node:assert/strict";
import test from "node:test";
import { pickFollowupPendingPush } from "./pending-push-match.ts";

test("pickFollowupPendingPush prefers push with focus review words for the current child", () => {
  const result = pickFollowupPendingPush(
    [
      {
        id: "push-general",
        childId: "child-1",
        scheduledAt: "2026-03-17T08:00:00.000Z",
        summary: "常规英语任务",
        content: {}
      },
      {
        id: "push-review",
        childId: "child-1",
        scheduledAt: "2026-03-17T09:00:00.000Z",
        summary: "发音复习任务",
        content: {
          focusReviewWords: [{ word: "apple", incorrectItems: ["WORD_PRONUNCIATION"] }]
        }
      },
      {
        id: "push-other-child",
        childId: "child-2",
        scheduledAt: "2026-03-17T10:00:00.000Z",
        summary: "其他孩子任务",
        content: {
          focusReviewWords: [{ word: "banana", incorrectItems: ["WORD_SPELLING"] }]
        }
      }
    ],
    {
      childId: "child-1",
      needsReviewWordCount: 1
    }
  );

  assert.equal(result?.id, "push-review");
});

test("pickFollowupPendingPush falls back to latest child pending push without review words", () => {
  const result = pickFollowupPendingPush(
    [
      {
        id: "push-old",
        childId: "child-1",
        scheduledAt: "2026-03-17T08:00:00.000Z",
        summary: "旧任务",
        content: {}
      },
      {
        id: "push-new",
        childId: "child-1",
        scheduledAt: "2026-03-17T10:00:00.000Z",
        summary: "新任务",
        content: {}
      }
    ],
    {
      childId: "child-1",
      needsReviewWordCount: 0
    }
  );

  assert.equal(result?.id, "push-new");
});

test("pickFollowupPendingPush returns undefined when child has no pending push", () => {
  const result = pickFollowupPendingPush(
    [
      {
        id: "push-other",
        childId: "child-2",
        scheduledAt: "2026-03-17T10:00:00.000Z",
        summary: "其他孩子任务",
        content: {}
      }
    ],
    {
      childId: "child-1",
      needsReviewWordCount: 2
    }
  );

  assert.equal(result, undefined);
});
