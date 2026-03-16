export function resolveSelectedChildIndex(
  children: Array<{ id: string }>,
  childId: string
): number {
  if (!childId) {
    return 0;
  }

  const selectedIndex = children.findIndex((item) => item.id === childId);
  return selectedIndex >= 0 ? selectedIndex : 0;
}
