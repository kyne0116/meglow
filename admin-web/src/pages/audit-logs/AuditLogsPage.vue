<template>
  <div class="page-grid">
    <el-card shadow="never">
      <template #header>
        <div class="page-header">
          <div>
            <div class="page-title">操作审计</div>
            <div class="page-subtitle">查看管理员对教材、知识点和内容项的关键写操作记录。</div>
          </div>
        </div>
      </template>

      <div class="filters-grid">
        <el-input v-model="filters.action" placeholder="按 action 过滤" clearable @keyup.enter="reloadLogs" @clear="reloadLogs" />
        <el-input v-model="filters.targetType" placeholder="按 targetType 过滤" clearable @keyup.enter="reloadLogs" @clear="reloadLogs" />
        <el-input-number v-model="filters.limit" :min="1" :max="200" @change="reloadLogs" />
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="panel-header">
          <div class="panel-title">审计日志</div>
          <el-button @click="reloadLogs">刷新</el-button>
        </div>
      </template>

      <el-table :data="logs" v-loading="loading" size="small">
        <el-table-column prop="createdAt" label="时间" min-width="180" />
        <el-table-column prop="adminDisplayName" label="管理员" width="140" />
        <el-table-column prop="action" label="Action" min-width="180" />
        <el-table-column prop="targetType" label="Target" min-width="180" />
        <el-table-column prop="summary" label="摘要" min-width="260" />
        <el-table-column label="载荷" min-width="280">
          <template #default="{ row }">
            <code class="payload-text">{{ formatPayload(row.payload) }}</code>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus';
import { onMounted, reactive, ref } from 'vue';
import { adminAuditApi, type AdminAuditLogRecord } from '../../services/admin-audit-api';

const filters = reactive({
  action: '',
  targetType: '',
  limit: 50,
});

const logs = ref<AdminAuditLogRecord[]>([]);
const loading = ref(false);

onMounted(async () => {
  await reloadLogs();
});

async function reloadLogs() {
  loading.value = true;
  try {
    logs.value = await adminAuditApi.listLogs({
      action: filters.action || undefined,
      targetType: filters.targetType || undefined,
      limit: filters.limit,
    });
  } catch {
    ElMessage.error('加载审计日志失败');
  } finally {
    loading.value = false;
  }
}

function formatPayload(payload: Record<string, unknown> | null): string {
  if (!payload) {
    return '-';
  }

  return JSON.stringify(payload);
}
</script>

<style scoped>
.page-grid {
  display: grid;
  gap: 20px;
}

.page-header,
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.page-title,
.panel-title {
  font-size: 18px;
  font-weight: 700;
}

.page-subtitle {
  color: #6b7280;
  font-size: 13px;
}

.filters-grid {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(220px, 1fr) 180px;
  gap: 16px;
}

.payload-text {
  color: #4b5563;
  font-size: 12px;
  white-space: normal;
  word-break: break-all;
}

@media (max-width: 1100px) {
  .filters-grid {
    grid-template-columns: 1fr;
  }
}
</style>
