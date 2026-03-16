export type AssetSummary = {
  bySubject: Array<{
    subjectCode: string;
    subjectName: string;
    contentItemCount: number;
    publishedVersionCount: number;
  }>;
  byItemType: Array<{
    itemType: string;
    contentItemCount: number;
  }>;
};

export function buildAssetSummarySections(summary: AssetSummary | null | undefined) {
  return {
    subjectRows:
      summary?.bySubject.map((item) => ({
        label: item.subjectName,
        value: `${item.contentItemCount} 项 / ${item.publishedVersionCount} 已发布`,
        meta: item.subjectCode,
      })) ?? [],
    itemTypeRows:
      summary?.byItemType.slice(0, 5).map((item) => ({
        label: item.itemType,
        value: `${item.contentItemCount} 项`,
      })) ?? [],
  };
}
