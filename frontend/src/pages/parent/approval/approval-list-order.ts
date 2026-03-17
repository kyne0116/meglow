interface PendingLike {
  id: string;
}

export function prioritizePendingPushes<T extends PendingLike>(pending: T[], recommendedPushId?: string): T[] {
  if (!recommendedPushId) {
    return pending;
  }

  const targetIndex = pending.findIndex((item) => item.id === recommendedPushId);
  if (targetIndex <= 0) {
    return pending;
  }

  const next = [...pending];
  const [target] = next.splice(targetIndex, 1);
  next.unshift(target);
  return next;
}
