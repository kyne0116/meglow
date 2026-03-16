<template>
  <div class="page-grid">
    <el-card shadow="never">
      <template #header>
        <div class="page-header">
          <div>
            <div class="page-title">知识点管理</div>
            <div class="page-subtitle">按学科和阶段检索知识点，并支持新增、编辑与启停维护。</div>
          </div>
          <el-button type="primary" @click="openCreateDialog">新建知识点</el-button>
        </div>
      </template>

      <div class="filters-grid">
        <el-select v-model="filters.subjectCode" placeholder="学科" @change="reloadKnowledgePoints">
          <el-option label="英语" value="ENGLISH" />
          <el-option label="语文" value="CHINESE" />
          <el-option label="数学" value="MATH" />
        </el-select>

        <el-select v-model="filters.k12Stage" placeholder="K12 阶段" clearable @change="reloadKnowledgePoints">
          <el-option label="LOWER_PRIMARY" value="LOWER_PRIMARY" />
          <el-option label="MIDDLE_PRIMARY" value="MIDDLE_PRIMARY" />
          <el-option label="UPPER_PRIMARY" value="UPPER_PRIMARY" />
          <el-option label="JUNIOR_HIGH" value="JUNIOR_HIGH" />
        </el-select>

        <el-select v-model="filters.enabled" placeholder="启用状态" clearable @change="reloadKnowledgePoints">
          <el-option label="仅启用" :value="true" />
          <el-option label="仅停用" :value="false" />
        </el-select>

        <el-input
          v-model="filters.keyword"
          placeholder="按编码或名称搜索"
          clearable
          @keyup.enter="reloadKnowledgePoints"
          @clear="reloadKnowledgePoints"
        >
          <template #append>
            <el-button @click="reloadKnowledgePoints">搜索</el-button>
          </template>
        </el-input>
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="panel-header">
          <div class="panel-title">知识点列表</div>
          <el-tag effect="plain" type="warning">{{ knowledgePoints.length }} 条</el-tag>
        </div>
      </template>

      <el-table :data="knowledgePoints" v-loading="loading" size="small">
        <el-table-column prop="code" label="知识点编码" min-width="180" />
        <el-table-column prop="name" label="知识点名称" min-width="220" />
        <el-table-column prop="subjectCode" label="学科" width="100" />
        <el-table-column prop="difficultyLevel" label="难度" width="90" />
        <el-table-column prop="k12Stage" label="K12 阶段" min-width="140" />
        <el-table-column label="标签" min-width="180">
          <template #default="{ row }">
            <span>{{ formatTags(row.tags) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isEnabled ? 'success' : 'info'" effect="plain">
              {{ row.isEnabled ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <div class="row-actions">
              <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
              <el-button
                link
                :type="row.isEnabled ? 'danger' : 'success'"
                :loading="togglingKnowledgePointId === row.id"
                @click="handleToggleEnabled(row)"
              >
                {{ row.isEnabled ? '停用' : '启用' }}
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogMode === 'create' ? '新建知识点' : '编辑知识点'" width="680px">
      <el-form label-position="top">
        <div class="dialog-grid">
          <el-form-item label="学科">
            <el-select v-model="form.subjectCode" :disabled="dialogMode === 'edit'">
              <el-option label="英语" value="ENGLISH" />
              <el-option label="语文" value="CHINESE" />
              <el-option label="数学" value="MATH" />
            </el-select>
          </el-form-item>

          <el-form-item label="K12 阶段">
            <el-select v-model="form.k12Stage" clearable>
              <el-option label="LOWER_PRIMARY" value="LOWER_PRIMARY" />
              <el-option label="MIDDLE_PRIMARY" value="MIDDLE_PRIMARY" />
              <el-option label="UPPER_PRIMARY" value="UPPER_PRIMARY" />
              <el-option label="JUNIOR_HIGH" value="JUNIOR_HIGH" />
            </el-select>
          </el-form-item>
        </div>

        <div class="dialog-grid">
          <el-form-item label="知识点编码">
            <el-input v-model="form.code" />
          </el-form-item>

          <el-form-item label="难度">
            <el-input-number v-model="form.difficultyLevel" :min="1" :max="5" />
          </el-form-item>
        </div>

        <el-form-item label="知识点名称">
          <el-input v-model="form.name" />
        </el-form-item>

        <el-form-item label="说明">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>

        <el-form-item label="标签">
          <el-input v-model="form.tagsText" placeholder="多个标签用英文逗号分隔，例如 语法,阅读,句型" />
        </el-form-item>

        <el-form-item v-if="dialogMode === 'edit'" label="启用状态">
          <el-switch
            v-model="form.isEnabled"
            active-text="启用"
            inactive-text="停用"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          提交
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus';
import { onMounted, reactive, ref } from 'vue';
import { adminContentOpsApi } from '../../services/admin-content-ops-api';
import { textbooksApi, type KnowledgePointRecord } from '../../services/textbooks-api';

type DialogMode = 'create' | 'edit';

const filters = reactive({
  subjectCode: 'ENGLISH',
  k12Stage: '',
  enabled: undefined as boolean | undefined,
  keyword: '',
});

const knowledgePoints = ref<KnowledgePointRecord[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const dialogMode = ref<DialogMode>('create');
const submitting = ref(false);
const editingKnowledgePointId = ref('');
const togglingKnowledgePointId = ref('');

const form = reactive({
  subjectCode: 'ENGLISH',
  code: '',
  name: '',
  description: '',
  difficultyLevel: 2,
  k12Stage: 'JUNIOR_HIGH',
  isEnabled: true,
  tagsText: '',
});

onMounted(async () => {
  await reloadKnowledgePoints();
});

async function reloadKnowledgePoints() {
  loading.value = true;
  try {
    knowledgePoints.value = await textbooksApi.listKnowledgePoints({
      subjectCode: filters.subjectCode || undefined,
      k12Stage: filters.k12Stage || undefined,
      enabled: filters.enabled,
      keyword: filters.keyword || undefined,
    });
  } catch {
    ElMessage.error('加载知识点失败');
  } finally {
    loading.value = false;
  }
}

function openCreateDialog() {
  dialogMode.value = 'create';
  editingKnowledgePointId.value = '';
  form.subjectCode = filters.subjectCode || 'ENGLISH';
  form.code = '';
  form.name = '';
  form.description = '';
  form.difficultyLevel = 2;
  form.k12Stage = filters.k12Stage || 'JUNIOR_HIGH';
  form.isEnabled = true;
  form.tagsText = '';
  dialogVisible.value = true;
}

function openEditDialog(knowledgePoint: KnowledgePointRecord) {
  dialogMode.value = 'edit';
  editingKnowledgePointId.value = knowledgePoint.id;
  form.subjectCode = knowledgePoint.subjectCode;
  form.code = knowledgePoint.code;
  form.name = knowledgePoint.name;
  form.description = knowledgePoint.description ?? '';
  form.difficultyLevel = knowledgePoint.difficultyLevel;
  form.k12Stage = knowledgePoint.k12Stage || '';
  form.isEnabled = knowledgePoint.isEnabled;
  form.tagsText = getTagsText(knowledgePoint.tags);
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (submitting.value) {
    return;
  }

  submitting.value = true;
  try {
    if (dialogMode.value === 'create') {
      await adminContentOpsApi.createKnowledgePoint({
        subjectCode: form.subjectCode,
        code: form.code,
        name: form.name,
        description: form.description || undefined,
        difficultyLevel: form.difficultyLevel,
        k12Stage: form.k12Stage || undefined,
        tags: toTagsPayload(form.tagsText),
      });
      ElMessage.success('知识点创建成功');
    } else if (editingKnowledgePointId.value) {
      await adminContentOpsApi.updateKnowledgePoint(editingKnowledgePointId.value, {
        code: form.code,
        name: form.name,
        description: form.description || undefined,
        difficultyLevel: form.difficultyLevel,
        k12Stage: form.k12Stage || undefined,
        isEnabled: form.isEnabled,
        tags: toTagsPayload(form.tagsText),
      });
      ElMessage.success('知识点更新成功');
    }

    dialogVisible.value = false;
    filters.subjectCode = form.subjectCode;
    await reloadKnowledgePoints();
  } catch {
    ElMessage.error(dialogMode.value === 'create' ? '知识点创建失败' : '知识点更新失败');
  } finally {
    submitting.value = false;
  }
}

async function handleToggleEnabled(knowledgePoint: KnowledgePointRecord) {
  try {
    await ElMessageBox.confirm(
      knowledgePoint.isEnabled ? '停用后将不再出现在启用知识点选择中。是否继续？' : '启用后将重新可被教材节点挂载。是否继续？',
      knowledgePoint.isEnabled ? '确认停用' : '确认启用',
      {
        type: 'warning',
        confirmButtonText: knowledgePoint.isEnabled ? '停用' : '启用',
        cancelButtonText: '取消',
      },
    );
  } catch {
    return;
  }

  togglingKnowledgePointId.value = knowledgePoint.id;
  try {
    await adminContentOpsApi.updateKnowledgePoint(knowledgePoint.id, {
      isEnabled: !knowledgePoint.isEnabled,
    });
    ElMessage.success(knowledgePoint.isEnabled ? '知识点已停用' : '知识点已启用');
    await reloadKnowledgePoints();
  } catch {
    ElMessage.error(knowledgePoint.isEnabled ? '知识点停用失败' : '知识点启用失败');
  } finally {
    togglingKnowledgePointId.value = '';
  }
}

function toTagsPayload(tagsText: string): Record<string, unknown> | undefined {
  const labels = tagsText
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return labels.length > 0 ? { labels } : undefined;
}

function getTagsText(tags: Record<string, unknown> | null): string {
  const labels = tags?.labels;
  if (!Array.isArray(labels)) {
    return '';
  }

  return labels
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .join(', ');
}

function formatTags(tags: Record<string, unknown> | null): string {
  const text = getTagsText(tags);
  return text || '无';
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
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.dialog-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.row-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

@media (max-width: 1100px) {
  .filters-grid,
  .dialog-grid {
    grid-template-columns: 1fr;
  }
}
</style>
