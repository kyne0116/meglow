interface PendingPushLike {
  id: string;
  childId: string;
  scheduledAt: string;
  summary: string;
  content: Record<string, unknown>;
}

interface PickFollowupPendingPushOptions {
  childId: string;
  needsReviewWordCount: number;
}

export function pickFollowupPendingPush<T extends PendingPushLike>(
  pendingPushes: T[],
  options: PickFollowupPendingPushOptions
): T | undefined {
  const childPendingPushes = pendingPushes
    .filter((item) => item.childId === options.childId)
    .sort((left, right) => toTimestamp(right.scheduledAt) - toTimestamp(left.scheduledAt));

  if (childPendingPushes.length === 0) {
    return undefined;
  }

  if (options.needsReviewWordCount > 0) {
    const reviewPush = childPendingPushes.find(
      (item) => Array.isArray(item.content.focusReviewWords) && item.content.focusReviewWords.length > 0
    );
    if (reviewPush) {
      return reviewPush;
    }
  }

  return childPendingPushes[0];
}

function toTimestamp(value: string): number {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}
