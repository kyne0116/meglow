interface TaskLike {
  id: string;
}

export function prioritizeTasks<T extends TaskLike>(tasks: T[], recommendedTaskId?: string): T[] {
  if (!recommendedTaskId) {
    return tasks;
  }

  const targetIndex = tasks.findIndex((item) => item.id === recommendedTaskId);
  if (targetIndex <= 0) {
    return tasks;
  }

  const next = [...tasks];
  const [target] = next.splice(targetIndex, 1);
  next.unshift(target);
  return next;
}
