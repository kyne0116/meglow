import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAssetSummarySections } from '../src/pages/dashboard/asset-summary.ts';

test('buildAssetSummarySections keeps subject rows and limits item type rows to top five', () => {
  const sections = buildAssetSummarySections({
    bySubject: [
      { subjectCode: 'ENGLISH', subjectName: '英语', contentItemCount: 5, publishedVersionCount: 2 },
      { subjectCode: 'CHINESE', subjectName: '语文', contentItemCount: 3, publishedVersionCount: 1 },
    ],
    byItemType: [
      { itemType: 'EXERCISE', contentItemCount: 8 },
      { itemType: 'TEXT', contentItemCount: 7 },
      { itemType: 'WORD', contentItemCount: 6 },
      { itemType: 'CONCEPT', contentItemCount: 5 },
      { itemType: 'EXAMPLE', contentItemCount: 4 },
      { itemType: 'AUDIO_MATERIAL', contentItemCount: 3 },
    ],
  });

  assert.deepEqual(sections.subjectRows, [
    { label: '英语', value: '5 项 / 2 已发布', meta: 'ENGLISH' },
    { label: '语文', value: '3 项 / 1 已发布', meta: 'CHINESE' },
  ]);
  assert.deepEqual(sections.itemTypeRows, [
    { label: 'EXERCISE', value: '8 项' },
    { label: 'TEXT', value: '7 项' },
    { label: 'WORD', value: '6 项' },
    { label: 'CONCEPT', value: '5 项' },
    { label: 'EXAMPLE', value: '4 项' },
  ]);
});
