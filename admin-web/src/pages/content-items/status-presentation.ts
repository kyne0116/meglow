export const CONTENT_ITEM_FILTER_STATUS_OPTIONS = [
  { label: '已发布', value: 'PUBLISHED' },
  { label: '草稿', value: 'DRAFT' },
  { label: '已下线', value: 'OFFLINE' },
] as const;

export const DASHBOARD_STATUS_META = {
  DRAFT: { label: '草稿', tagType: 'info', tone: 'draft' },
  REVIEWING: { label: '审核中（预留）', tagType: 'warning', tone: 'reviewing' },
  APPROVED: { label: '已通过（预留）', tagType: 'success', tone: 'approved' },
  REJECTED: { label: '已拒绝（预留）', tagType: 'danger', tone: 'rejected' },
  PUBLISHED: { label: '已发布', tagType: 'success', tone: 'published' },
  OFFLINE: { label: '已下线', tagType: 'info', tone: 'offline' },
} as const;

export const DASHBOARD_STATUS_ORDER = [
  'DRAFT',
  'REVIEWING',
  'APPROVED',
  'REJECTED',
  'PUBLISHED',
  'OFFLINE',
] as const;
