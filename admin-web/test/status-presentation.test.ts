import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CONTENT_ITEM_FILTER_STATUS_OPTIONS,
  DASHBOARD_STATUS_META,
  DASHBOARD_STATUS_ORDER,
} from '../src/pages/content-items/status-presentation.ts';

test('content item filter only exposes statuses supported by current publish flow', () => {
  assert.deepEqual(CONTENT_ITEM_FILTER_STATUS_OPTIONS, [
    { label: '已发布', value: 'PUBLISHED' },
    { label: '草稿', value: 'DRAFT' },
    { label: '已下线', value: 'OFFLINE' },
  ]);
});

test('dashboard keeps unsupported workflow statuses visible only as reserved labels', () => {
  assert.deepEqual(DASHBOARD_STATUS_ORDER, [
    'DRAFT',
    'REVIEWING',
    'APPROVED',
    'REJECTED',
    'PUBLISHED',
    'OFFLINE',
  ]);
  assert.equal(DASHBOARD_STATUS_META.REVIEWING.label, '审核中（预留）');
  assert.equal(DASHBOARD_STATUS_META.APPROVED.label, '已通过（预留）');
  assert.equal(DASHBOARD_STATUS_META.REJECTED.label, '已拒绝（预留）');
});
