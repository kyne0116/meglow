interface PendingPushLike {
  id: string;
  content: Record<string, unknown>;
}

export interface ApprovalRecommendation {
  pushId: string;
  title: string;
  description: string;
  actionLabel: string;
  actionType: "OPEN_MODIFY" | "APPROVE";
}

export function buildApprovalRecommendation(pending: PendingPushLike[]): ApprovalRecommendation | null {
  const focusReviewPush = pending.find(
    (item) => Array.isArray(item.content.focusReviewWords) && item.content.focusReviewWords.length > 0
  );
  if (focusReviewPush) {
    return {
      pushId: focusReviewPush.id,
      title: "推荐处理：先确认重点复习任务",
      description: "这条待审批任务带有重点复习词，建议先检查后再通过或调整。",
      actionLabel: "套用预设修改",
      actionType: "OPEN_MODIFY"
    };
  }

  const highPriorityPush = pending.find((item) => String(item.content.priority ?? "").trim().toLowerCase() === "high");
  if (highPriorityPush) {
    return {
      pushId: highPriorityPush.id,
      title: "推荐处理：优先通过高优先级任务",
      description: "这条任务已标记为高优先级，若无额外调整可直接通过。",
      actionLabel: "直接通过",
      actionType: "APPROVE"
    };
  }

  return null;
}
