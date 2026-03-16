<template>
  <div class="page-grid">
    <el-card shadow="never">
      <template #header>
        <div class="page-header">
          <div>
            <div class="page-title">内容项管理</div>
            <div class="page-subtitle">查看内容项主数据、当前状态和版本历史。</div>
          </div>
          <el-button type="primary" @click="dialogVisible = true">新建内容项</el-button>
        </div>
      </template>

      <div class="filters-grid">
        <el-select v-model="filters.subjectCode" placeholder="学科" clearable @change="reloadContentItems">
          <el-option label="英语" value="ENGLISH" />
          <el-option label="语文" value="CHINESE" />
          <el-option label="数学" value="MATH" />
        </el-select>

        <el-select v-model="filters.reviewStatus" placeholder="版本状态" clearable @change="reloadContentItems">
          <el-option
            v-for="option in CONTENT_ITEM_FILTER_STATUS_OPTIONS"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>

        <el-input-number v-model="filters.limit" :min="1" :max="100" @change="reloadContentItems" />
      </div>
    </el-card>

    <div class="workspace-grid">
      <el-card shadow="never">
        <template #header>
          <div class="panel-title">内容项列表</div>
        </template>

        <el-table
          :data="contentItems"
          v-loading="loadingContentItems"
          highlight-current-row
          @current-change="handleContentItemChange"
        >
          <el-table-column prop="title" label="标题" min-width="220" />
          <el-table-column prop="subjectCode" label="学科" width="100" />
          <el-table-column prop="itemType" label="类型" width="130" />
          <el-table-column prop="currentVersion" label="当前版本" width="100" />
          <el-table-column prop="currentReviewStatus" label="当前状态" width="120" />
          <el-table-column prop="versionCount" label="版本数" width="90" />
        </el-table>
      </el-card>

      <el-card shadow="never">
        <template #header>
          <div class="panel-title">版本明细</div>
        </template>

        <el-empty v-if="!selectedContentItem" description="点击左侧内容项查看版本历史。" />

        <template v-else>
          <div class="content-summary">
            <div class="content-title">{{ selectedContentItem.title }}</div>
            <div class="content-meta">
              <el-tag size="small">{{ selectedContentItem.subjectCode }}</el-tag>
              <el-tag size="small" effect="plain">{{ selectedContentItem.itemType }}</el-tag>
              <span>{{ selectedContentItem.canonicalKey || '无 canonicalKey' }}</span>
            </div>
            <div class="content-description">
              {{ selectedContentItem.summary || '暂无摘要' }}
            </div>
          </div>

          <el-table :data="versions" v-loading="loadingVersions" size="small">
            <el-table-column prop="version" label="版本号" width="90" />
            <el-table-column prop="title" label="版本标题" min-width="220" />
            <el-table-column prop="reviewStatus" label="状态" width="120" />
            <el-table-column prop="changeSummary" label="变更说明" min-width="180" />
            <el-table-column prop="publishedAt" label="发布时间" min-width="180" />
          </el-table>
        </template>
      </el-card>
    </div>

    <el-dialog v-model="dialogVisible" title="新建内容项" width="720px">
      <el-form label-position="top">
        <div class="dialog-grid">
          <el-form-item label="学科">
            <el-select v-model="createForm.subjectCode">
              <el-option label="英语" value="ENGLISH" />
              <el-option label="语文" value="CHINESE" />
              <el-option label="数学" value="MATH" />
            </el-select>
          </el-form-item>

          <el-form-item label="内容类型">
            <el-select v-model="createForm.itemType">
              <el-option label="TEXT" value="TEXT" />
              <el-option label="WORD" value="WORD" />
              <el-option label="EXERCISE" value="EXERCISE" />
              <el-option label="CONCEPT" value="CONCEPT" />
            </el-select>
          </el-form-item>
        </div>

        <el-form-item label="标题">
          <el-input v-model="createForm.title" />
        </el-form-item>

        <el-form-item label="canonicalKey">
          <el-input v-model="createForm.canonicalKey" placeholder="可选，建议全局唯一" />
        </el-form-item>

        <el-form-item label="摘要">
          <el-input v-model="createForm.summary" type="textarea" :rows="2" />
        </el-form-item>

        <div class="dialog-grid">
          <el-form-item label="难度">
            <el-input-number v-model="createForm.difficultyLevel" :min="1" :max="5" />
          </el-form-item>

          <el-form-item label="K12 阶段">
            <el-select v-model="createForm.k12Stage" clearable>
              <el-option label="LOWER_PRIMARY" value="LOWER_PRIMARY" />
              <el-option label="MIDDLE_PRIMARY" value="MIDDLE_PRIMARY" />
              <el-option label="UPPER_PRIMARY" value="UPPER_PRIMARY" />
              <el-option label="JUNIOR_HIGH" value="JUNIOR_HIGH" />
            </el-select>
          </el-form-item>
        </div>

        <el-divider>初始化版本</el-divider>

        <el-form-item label="版本标题">
          <el-input v-model="createForm.versionTitle" />
        </el-form-item>

        <el-form-item label="变更说明">
          <el-input v-model="createForm.changeSummary" />
        </el-form-item>

        <el-form-item label="Payload JSON">
          <el-input v-model="createForm.payloadText" type="textarea" :rows="10" />
        </el-form-item>

        <el-form-item>
          <el-checkbox v-model="createForm.publishImmediately">创建后立即发布</el-checkbox>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleCreateContentItem">
          提交
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus';
import { onMounted, reactive, ref } from 'vue';
import {
  adminContentApi,
  type AdminContentItemRecord,
  type AdminContentItemVersionRecord,
} from '../../services/admin-content-api';
import { adminContentOpsApi } from '../../services/admin-content-ops-api';
import { CONTENT_ITEM_FILTER_STATUS_OPTIONS } from './status-presentation';

const filters = reactive({
  subjectCode: '',
  reviewStatus: '',
  limit: 20,
});

const contentItems = ref<AdminContentItemRecord[]>([]);
const versions = ref<AdminContentItemVersionRecord[]>([]);
const selectedContentItem = ref<AdminContentItemRecord | null>(null);
const loadingContentItems = ref(false);
const loadingVersions = ref(false);
const dialogVisible = ref(false);
const submitting = ref(false);

const createForm = reactive({
  subjectCode: 'ENGLISH',
  itemType: 'TEXT',
  canonicalKey: '',
  title: '',
  summary: '',
  difficultyLevel: 1,
  k12Stage: 'JUNIOR_HIGH',
  versionTitle: '',
  changeSummary: 'admin console init version',
  payloadText: '{\n  "kind": "text",\n  "blocks": [\n    {\n      "type": "paragraph",\n      "text": "请在后台继续编辑内容。"\n    }\n  ]\n}',
  publishImmediately: true,
});

onMounted(async () => {
  await reloadContentItems();
});

async function reloadContentItems() {
  loadingContentItems.value = true;
  selectedContentItem.value = null;
  versions.value = [];

  try {
    contentItems.value = await adminContentApi.listContentItems({
      subjectCode: filters.subjectCode || undefined,
      reviewStatus: filters.reviewStatus || undefined,
      limit: filters.limit,
    });
    if (contentItems.value.length > 0) {
      await handleContentItemChange(contentItems.value[0]);
    }
  } catch {
    ElMessage.error('加载内容项失败');
  } finally {
    loadingContentItems.value = false;
  }
}

async function handleContentItemChange(contentItem: AdminContentItemRecord | undefined) {
  selectedContentItem.value = contentItem ?? null;
  versions.value = [];

  if (!contentItem) {
    return;
  }

  loadingVersions.value = true;
  try {
    versions.value = await adminContentApi.listContentItemVersions(contentItem.id);
  } catch {
    ElMessage.error('加载版本明细失败');
  } finally {
    loadingVersions.value = false;
  }
}

async function handleCreateContentItem() {
  if (submitting.value) {
    return;
  }

  let parsedPayload: Record<string, unknown>;
  try {
    parsedPayload = JSON.parse(createForm.payloadText) as Record<string, unknown>;
  } catch {
    ElMessage.error('Payload JSON 格式不合法');
    return;
  }

  submitting.value = true;
  try {
    const createdItem = await adminContentOpsApi.createContentItem({
      subjectCode: createForm.subjectCode,
      itemType: createForm.itemType,
      canonicalKey: createForm.canonicalKey || undefined,
      title: createForm.title,
      summary: createForm.summary || undefined,
      difficultyLevel: createForm.difficultyLevel,
      k12Stage: createForm.k12Stage || undefined,
      isReusable: true,
    });

    const createdVersion = await adminContentOpsApi.createContentItemVersion(createdItem.id, {
      title: createForm.versionTitle || createForm.title,
      payload: parsedPayload,
      changeSummary: createForm.changeSummary || undefined,
    });

    if (createForm.publishImmediately) {
      await adminContentOpsApi.publishContentItemVersion(createdItem.id, createdVersion.id);
    }

    dialogVisible.value = false;
    ElMessage.success('内容项创建成功');
    await reloadContentItems();
  } catch {
    ElMessage.error('创建内容项失败');
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.page-grid {
  display: grid;
  gap: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title {
  font-size: 18px;
  font-weight: 700;
}

.page-subtitle {
  color: #6b7280;
  font-size: 13px;
}

.filters-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 180px;
  gap: 16px;
}

.dialog-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.workspace-grid {
  display: grid;
  grid-template-columns: minmax(420px, 1.1fr) minmax(360px, 0.9fr);
  gap: 20px;
}

.panel-title {
  font-size: 16px;
  font-weight: 700;
}

.content-summary {
  margin-bottom: 16px;
}

.content-title {
  font-size: 16px;
  font-weight: 700;
}

.content-meta {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 8px;
  color: #6b7280;
  font-size: 13px;
}

.content-description {
  margin-top: 12px;
  color: #4b5563;
  line-height: 1.6;
}

@media (max-width: 1200px) {
  .filters-grid,
  .workspace-grid,
  .dialog-grid {
    grid-template-columns: 1fr;
  }
}
</style>
