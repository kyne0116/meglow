<template>
  <div class="dashboard-grid">
    <el-card shadow="never" class="hero-card">
      <template #header>平台工作台</template>
      <div class="hero-content">
        <div>
          <div class="hero-title">阶段二产品底座总览</div>
          <p class="hero-description">
            当前工作台已接入真实数据，总览覆盖内容资产、审核状态、版本动态与审计操作，不再只是静态后台入口。
          </p>
        </div>
        <el-descriptions :column="1" border class="hero-descriptions">
          <el-descriptions-item label="管理员">
            {{ session.profile?.displayName || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="角色">
            {{ session.profile?.role || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="工作台状态">
            平台级总览已接入
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>

    <div class="metrics-grid" v-loading="loading">
      <el-card shadow="never" class="metric-card">
        <div class="metric-label">教材版本</div>
        <div class="metric-value">{{ overview?.metrics.textbookEditionCount ?? '-' }}</div>
      </el-card>
      <el-card shadow="never" class="metric-card">
        <div class="metric-label">册次</div>
        <div class="metric-value">{{ overview?.metrics.textbookVolumeCount ?? '-' }}</div>
      </el-card>
      <el-card shadow="never" class="metric-card">
        <div class="metric-label">目录节点</div>
        <div class="metric-value">{{ overview?.metrics.textbookNodeCount ?? '-' }}</div>
      </el-card>
      <el-card shadow="never" class="metric-card">
        <div class="metric-label">知识点</div>
        <div class="metric-value">
          {{ overview?.metrics.enabledKnowledgePointCount ?? '-' }}/{{ overview?.metrics.knowledgePointCount ?? '-' }}
        </div>
        <div class="metric-hint">启用 / 总量</div>
      </el-card>
      <el-card shadow="never" class="metric-card">
        <div class="metric-label">内容项</div>
        <div class="metric-value">{{ overview?.metrics.contentItemCount ?? '-' }}</div>
      </el-card>
      <el-card shadow="never" class="metric-card">
        <div class="metric-label">已发布版本</div>
        <div class="metric-value">{{ overview?.metrics.publishedContentVersionCount ?? '-' }}</div>
      </el-card>
      <el-card v-if="session.profile?.role === 'SUPER_ADMIN'" shadow="never" class="metric-card">
        <div class="metric-label">管理员</div>
        <div class="metric-value">{{ overview?.metrics.adminUserCount ?? '-' }}</div>
      </el-card>
    </div>

    <el-card shadow="never" class="governance-card" v-loading="loading">
      <template #header>版本状态概览</template>
      <div class="status-grid">
        <div
          v-for="status in reviewStatusCards"
          :key="status.key"
          class="status-card"
          :class="`status-card--${status.tone}`"
        >
          <div class="status-header">
            <span>{{ status.label }}</span>
            <el-tag size="small" effect="plain" :type="status.tagType">
              {{ status.key }}
            </el-tag>
          </div>
          <div class="status-value">{{ status.value }}</div>
        </div>
      </div>
    </el-card>

    <el-card shadow="never" class="trend-card" v-loading="loading">
      <template #header>最近 7 天版本趋势</template>
      <div class="trend-grid">
        <div v-for="item in trendCards" :key="item.key" class="trend-metric">
          <div class="metric-label">{{ item.label }}</div>
          <div class="trend-primary">{{ item.current }}</div>
          <div class="trend-meta">前 7 天：{{ item.previous }}</div>
          <div class="trend-delta" :class="trendDeltaClass(item.delta)">
            {{ formatTrendDelta(item.delta) }}
          </div>
        </div>
      </div>
    </el-card>

    <el-card shadow="never" class="asset-card" v-loading="loading">
      <template #header>资产分布摘要</template>
      <div class="asset-grid">
        <div class="asset-panel">
          <div class="asset-title">按学科</div>
          <el-empty
            v-if="assetSummarySections.subjectRows.length === 0"
            description="暂无学科资产数据"
          />
          <div v-else class="asset-list">
            <div v-for="item in assetSummarySections.subjectRows" :key="item.meta" class="asset-row">
              <div>
                <div class="asset-label">{{ item.label }}</div>
                <div class="asset-meta">{{ item.meta }}</div>
              </div>
              <div class="asset-value">{{ item.value }}</div>
            </div>
          </div>
        </div>

        <div class="asset-panel">
          <div class="asset-title">按内容类型</div>
          <el-empty
            v-if="assetSummarySections.itemTypeRows.length === 0"
            description="暂无内容类型资产数据"
          />
          <div v-else class="asset-list">
            <div v-for="item in assetSummarySections.itemTypeRows" :key="item.label" class="asset-row">
              <div class="asset-label">{{ item.label }}</div>
              <div class="asset-value">{{ item.value }}</div>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <el-card shadow="never" class="config-card" v-loading="loading">
      <template #header>平台配置摘要</template>
      <div class="config-grid">
        <div v-for="item in configSummaryRows" :key="item.label" class="config-row">
          <div>
            <div class="asset-label">{{ item.label }}</div>
            <div v-if="item.meta" class="asset-meta">{{ item.meta }}</div>
          </div>
          <div class="asset-value">{{ item.value }}</div>
        </div>
      </div>
    </el-card>

    <div class="timeline-grid">
      <el-card shadow="never" class="timeline-card" v-loading="loading">
        <template #header>最近内容版本动态</template>
        <el-empty
          v-if="(overview?.recentContentVersions.length ?? 0) === 0"
          description="暂无内容版本动态"
        />
        <el-timeline v-else>
          <el-timeline-item
            v-for="version in overview?.recentContentVersions"
            :key="version.id"
            :timestamp="formatVersionTimestamp(version)"
          >
            <div class="timeline-heading">
              <strong>{{ version.contentItemTitle }} · v{{ version.version }}</strong>
              <el-tag
                size="small"
                effect="plain"
                :type="reviewStatusMeta[version.reviewStatus as ReviewStatusKey]?.tagType ?? 'info'"
              >
                {{ reviewStatusMeta[version.reviewStatus as ReviewStatusKey]?.label ?? version.reviewStatus }}
              </el-tag>
            </div>
            <div class="timeline-meta">
              {{ version.subjectCode }} · {{ version.title }}
            </div>
            <div class="timeline-meta">
              {{ version.changeSummary || '无变更说明' }}
            </div>
          </el-timeline-item>
        </el-timeline>
      </el-card>

      <el-card shadow="never" class="timeline-card" v-loading="loading">
        <template #header>最近审计操作</template>
        <el-empty
          v-if="(overview?.recentAuditLogs.length ?? 0) === 0"
          description="暂无审计记录"
        />
        <el-timeline v-else>
          <el-timeline-item
            v-for="log in overview?.recentAuditLogs"
            :key="log.id"
            :timestamp="formatDateTime(log.createdAt)"
          >
            <strong>{{ log.summary }}</strong>
            <div class="timeline-meta">
              {{ log.adminDisplayName }} · {{ log.action }} · {{ log.targetType }}
            </div>
          </el-timeline-item>
        </el-timeline>
      </el-card>
    </div>

    <el-card shadow="never" class="timeline-card">
      <template #header>下一步补齐</template>
      <el-timeline>
        <el-timeline-item timestamp="Step 1">补齐更多版本趋势与资产运营视图</el-timeline-item>
        <el-timeline-item timestamp="Step 2">增强教材、内容、审计之间的联动检索</el-timeline-item>
        <el-timeline-item timestamp="Step 3">把后台对象边界继续抽象到跨业务可复用层</el-timeline-item>
      </el-timeline>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus';
import { computed, onMounted, ref } from 'vue';
import {
  DASHBOARD_STATUS_META,
  DASHBOARD_STATUS_ORDER,
} from '../content-items/status-presentation';
import { buildAssetSummarySections } from './asset-summary';
import { adminOverviewApi, type AdminOverviewResponse } from '../../services/admin-overview-api';
import { useAdminSessionStore } from '../../stores/session';

type ReviewStatusKey = keyof AdminOverviewResponse['metrics']['reviewStatusCounts'];
const reviewStatusMeta = DASHBOARD_STATUS_META satisfies Record<
  ReviewStatusKey,
  { label: string; tagType: 'info' | 'warning' | 'success' | 'danger'; tone: string }
>;
const reviewStatusOrder = DASHBOARD_STATUS_ORDER satisfies readonly ReviewStatusKey[];

const session = useAdminSessionStore();
const overview = ref<AdminOverviewResponse | null>(null);
const loading = ref(false);

const reviewStatusCards = computed(() =>
  reviewStatusOrder.map((key) => ({
    key,
    label: reviewStatusMeta[key].label,
    value: overview.value?.metrics.reviewStatusCounts[key] ?? 0,
    tagType: reviewStatusMeta[key].tagType,
    tone: reviewStatusMeta[key].tone,
  })),
);

const trendCards = computed(() => {
  const summary = overview.value?.versionTrendSummary;
  return [
    {
      key: 'totalChanges',
      label: '版本变更次数',
      current: summary?.last7Days.totalChanges ?? 0,
      previous: summary?.previous7Days.totalChanges ?? 0,
      delta: summary?.delta.totalChanges ?? 0,
    },
    {
      key: 'publishes',
      label: '发布次数',
      current: summary?.last7Days.publishes ?? 0,
      previous: summary?.previous7Days.publishes ?? 0,
      delta: summary?.delta.publishes ?? 0,
    },
  ];
});

const assetSummarySections = computed(() =>
  buildAssetSummarySections(overview.value?.assetSummary),
);

const configSummaryRows = computed(() => {
  const summary = overview.value?.platformConfigSummary;
  return [
    {
      label: '学习默认值',
      value: summary
        ? `${summary.learningDefaults.wordsPerSession} 词/次 · ${summary.learningDefaults.dailyDurationMin} 分钟/天`
        : '-',
      meta: summary
        ? `自动审批：${summary.learningDefaults.autoApprove ? '开启' : '关闭'}`
        : '',
    },
    {
      label: '验证码有效期',
      value: summary ? `${summary.verificationCode.expiresInSec} 秒` : '-',
      meta: '',
    },
    {
      label: '访问令牌有效期',
      value: summary?.accessToken.expiresIn ?? '-',
      meta: '',
    },
  ];
});

onMounted(async () => {
  loading.value = true;
  try {
    overview.value = await adminOverviewApi.getOverview();
  } catch {
    ElMessage.error('加载工作台总览失败');
  } finally {
    loading.value = false;
  }
});

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleString('zh-CN', {
    hour12: false,
  });
}

function formatVersionTimestamp(version: AdminOverviewResponse['recentContentVersions'][number]) {
  if (version.reviewStatus === 'PUBLISHED' && version.publishedAt) {
    return `发布时间 ${formatDateTime(version.publishedAt)}`;
  }

  return `更新时间 ${formatDateTime(version.updatedAt)}`;
}

function formatTrendDelta(value: number) {
  if (value > 0) {
    return `较前 7 天 +${value}`;
  }

  if (value < 0) {
    return `较前 7 天 ${value}`;
  }

  return '较前 7 天 持平';
}

function trendDeltaClass(value: number) {
  if (value > 0) {
    return 'trend-delta--up';
  }

  if (value < 0) {
    return 'trend-delta--down';
  }

  return 'trend-delta--flat';
}
</script>

<style scoped>
.dashboard-grid {
  display: grid;
  gap: 20px;
}

.hero-card,
.governance-card,
.trend-card,
.asset-card,
.config-card,
.timeline-card {
  grid-column: 1 / -1;
}

.hero-content {
  display: grid;
  gap: 20px;
  grid-template-columns: minmax(0, 1.5fr) minmax(320px, 1fr);
  align-items: start;
}

.hero-title {
  font-size: 24px;
  font-weight: 700;
}

.hero-description {
  margin: 12px 0 0;
  color: #4b5563;
  line-height: 1.6;
}

.hero-descriptions {
  align-self: stretch;
}

.metrics-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.metric-card,
.status-card {
  background: linear-gradient(180deg, #fffef9 0%, #ffffff 100%);
}

.metric-label,
.timeline-meta {
  color: #6b7280;
  font-size: 13px;
}

.metric-value,
.status-value {
  margin-top: 8px;
  font-size: 28px;
  font-weight: 700;
}

.metric-hint {
  margin-top: 6px;
  color: #9ca3af;
  font-size: 12px;
}

.status-grid,
.trend-grid,
.asset-grid,
.timeline-grid {
  display: grid;
  gap: 16px;
}

.status-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.timeline-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.trend-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.asset-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.config-grid {
  display: grid;
  gap: 12px;
}

.status-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
}

.trend-metric {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  background: linear-gradient(180deg, #fffdfa 0%, #ffffff 100%);
}

.trend-primary {
  margin-top: 8px;
  font-size: 32px;
  font-weight: 700;
}

.trend-meta {
  margin-top: 8px;
  color: #6b7280;
  font-size: 13px;
}

.trend-delta {
  margin-top: 10px;
  font-size: 13px;
  font-weight: 600;
}

.trend-delta--up {
  color: #15803d;
}

.trend-delta--down {
  color: #b91c1c;
}

.trend-delta--flat {
  color: #6b7280;
}

.asset-panel {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  background: linear-gradient(180deg, #fffefb 0%, #ffffff 100%);
}

.asset-title {
  font-size: 15px;
  font-weight: 700;
}

.asset-list {
  display: grid;
  gap: 12px;
  margin-top: 14px;
}

.asset-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: 10px;
  border-top: 1px solid #f3f4f6;
}

.asset-row:first-child {
  border-top: 0;
  padding-top: 0;
}

.config-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: linear-gradient(180deg, #fdfcf8 0%, #ffffff 100%);
}

.asset-label {
  font-size: 14px;
  font-weight: 600;
}

.asset-meta {
  margin-top: 4px;
  color: #9ca3af;
  font-size: 12px;
}

.asset-value {
  color: #111827;
  font-size: 14px;
  font-weight: 600;
  text-align: right;
}

.status-card--draft {
  border-color: #dbeafe;
}

.status-card--reviewing {
  border-color: #fde68a;
}

.status-card--approved {
  border-color: #bbf7d0;
}

.status-card--rejected {
  border-color: #fecaca;
}

.status-card--published {
  border-color: #a7f3d0;
}

.status-card--offline {
  border-color: #e5e7eb;
}

.status-header,
.timeline-heading {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.timeline-heading {
  margin-bottom: 6px;
}

@media (max-width: 1200px) {
  .metrics-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .status-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .timeline-grid {
    grid-template-columns: 1fr;
  }

  .trend-grid {
    grid-template-columns: 1fr;
  }

  .asset-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .hero-content {
    grid-template-columns: 1fr;
  }

  .metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .metrics-grid,
  .status-grid,
  .trend-grid {
    grid-template-columns: 1fr;
  }
}
</style>
