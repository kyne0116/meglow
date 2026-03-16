<template>
  <div class="page-grid">
    <el-card shadow="never">
      <template #header>
        <div class="page-header">
          <div>
            <div class="page-title">教材管理</div>
            <div class="page-subtitle">按学科、版本、册次浏览目录树，并维护教材目录与挂载关系。</div>
          </div>

          <div class="header-actions">
            <el-button type="primary" @click="editionDialogVisible = true">新建教材版本</el-button>
            <el-button :disabled="!selectedEditionId" @click="volumeDialogVisible = true">新建册次</el-button>
            <el-button :disabled="!selectedVolumeId" @click="nodeDialogVisible = true">新建节点</el-button>
          </div>
        </div>
      </template>

      <div class="filters-grid">
        <el-select v-model="selectedSubjectCode" placeholder="选择学科" @change="handleSubjectChange">
          <el-option
            v-for="subject in subjects"
            :key="subject.code"
            :label="subject.name"
            :value="subject.code"
          />
        </el-select>

        <el-select
          v-model="selectedEditionId"
          placeholder="选择教材版本"
          :disabled="!selectedSubjectCode"
          @change="handleEditionChange"
        >
          <el-option
            v-for="edition in editions"
            :key="edition.id"
            :label="edition.displayName"
            :value="edition.id"
          />
        </el-select>

        <el-select
          v-model="selectedVolumeId"
          placeholder="选择册次"
          :disabled="!selectedEditionId"
          @change="handleVolumeChange"
        >
          <el-option
            v-for="volume in volumes"
            :key="volume.id"
            :label="`${volume.volumeLabel} · v${volume.version}`"
            :value="volume.id"
          />
        </el-select>
      </div>
    </el-card>

    <div class="workspace-grid">
      <el-card shadow="never">
        <template #header>
          <div class="panel-header">
            <div class="panel-title">目录树</div>
            <el-tag v-if="selectedVolumeId" effect="plain" type="warning">可继续新增节点</el-tag>
          </div>
        </template>

        <el-skeleton v-if="loadingTree" :rows="8" animated />
        <el-empty v-else-if="treeData.length === 0" description="请选择册次" />
        <el-tree
          v-else
          node-key="id"
          :data="treeData"
          :props="{ label: 'title', children: 'children' }"
          highlight-current
          default-expand-all
          @node-click="handleNodeClick"
        >
          <template #default="{ data }">
            <div class="tree-row">
              <span>{{ data.title }}</span>
              <el-tag size="small" effect="plain">{{ data.nodeType }}</el-tag>
            </div>
          </template>
        </el-tree>
      </el-card>

      <el-card shadow="never">
        <template #header>
          <div class="panel-header">
            <div class="panel-title">节点内容</div>
            <div class="header-actions">
              <el-button size="small" :disabled="!selectedNode" @click="openEditNodeDialog">编辑节点</el-button>
              <el-button size="small" type="danger" :disabled="!selectedNode" @click="handleDeleteNode">删除节点</el-button>
              <el-button size="small" :disabled="!selectedNode" @click="attachContentDialogVisible = true">
                挂载内容项
              </el-button>
              <el-button size="small" :disabled="!selectedNode" @click="attachKnowledgeDialogVisible = true">
                挂载知识点
              </el-button>
            </div>
          </div>
        </template>

        <el-empty
          v-if="!selectedNode"
          description="点击目录树节点后，这里会显示挂载的内容项。"
        />

        <template v-else>
          <div class="node-summary">
            <div class="node-title">{{ selectedNode.title }}</div>
            <div class="node-meta">
              <el-tag size="small">{{ selectedNode.nodeType }}</el-tag>
              <span>Depth {{ selectedNode.depth }}</span>
              <span v-if="selectedNode.nodeCode">Code {{ selectedNode.nodeCode }}</span>
              <span v-if="selectedNodeDetail">Sort {{ selectedNodeDetail.sortOrder }}</span>
            </div>
          </div>

          <el-table :data="nodeContentItems" v-loading="loadingNodeContent" size="small">
            <el-table-column prop="title" label="内容标题" min-width="220" />
            <el-table-column prop="itemType" label="类型" width="130" />
            <el-table-column prop="version" label="版本" width="90" />
            <el-table-column prop="reviewStatus" label="状态" width="120" />
            <el-table-column prop="difficultyLevel" label="难度" width="80" />
            <el-table-column label="主内容" width="90">
              <template #default="{ row }">
                <el-tag :type="row.isPrimary ? 'success' : 'info'" effect="plain">
                  {{ row.isPrimary ? '是' : '否' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button
                  link
                  type="danger"
                  :loading="detachingContentItemId === row.id"
                  @click="handleDetachContent(row.id)"
                >
                  解绑
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-divider>已挂载知识点</el-divider>

          <el-table :data="nodeKnowledgePoints" v-loading="loadingNodeKnowledgePoints" size="small">
            <el-table-column prop="code" label="知识点编码" min-width="180" />
            <el-table-column prop="name" label="知识点名称" min-width="220" />
            <el-table-column prop="difficultyLevel" label="难度" width="90" />
            <el-table-column prop="k12Stage" label="K12 阶段" min-width="140" />
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button
                  link
                  type="danger"
                  :loading="detachingKnowledgePointId === row.id"
                  @click="handleDetachKnowledge(row.id)"
                >
                  解绑
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </template>
      </el-card>
    </div>

    <el-dialog v-model="editionDialogVisible" title="新建教材版本" width="640px">
      <el-form label-position="top">
        <div class="dialog-grid">
          <el-form-item label="学科">
            <el-select v-model="editionForm.subjectCode">
              <el-option label="英语" value="ENGLISH" />
              <el-option label="语文" value="CHINESE" />
              <el-option label="数学" value="MATH" />
            </el-select>
          </el-form-item>
          <el-form-item label="出版社编码">
            <el-input v-model="editionForm.publisherCode" placeholder="例如 RJB / SUJ / BSD" />
          </el-form-item>
        </div>
        <div class="dialog-grid">
          <el-form-item label="版本编码">
            <el-input v-model="editionForm.code" />
          </el-form-item>
          <el-form-item label="显示名称">
            <el-input v-model="editionForm.displayName" />
          </el-form-item>
        </div>
        <div class="dialog-grid">
          <el-form-item label="课程年份">
            <el-input-number v-model="editionForm.curriculumYear" :min="2000" :max="2100" />
          </el-form-item>
          <el-form-item label="区域范围">
            <el-input v-model="editionForm.regionScope" />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="editionDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submittingEdition" @click="handleCreateEdition">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="volumeDialogVisible" title="新建册次" width="640px">
      <el-form label-position="top">
        <div class="dialog-grid">
          <el-form-item label="年级">
            <el-input-number v-model="volumeForm.grade" :min="1" :max="9" />
          </el-form-item>
          <el-form-item label="学期">
            <el-select v-model="volumeForm.semester">
              <el-option label="FIRST_TERM" value="FIRST_TERM" />
              <el-option label="SECOND_TERM" value="SECOND_TERM" />
              <el-option label="FULL_VOLUME" value="FULL_VOLUME" />
              <el-option label="ELECTIVE" value="ELECTIVE" />
            </el-select>
          </el-form-item>
        </div>
        <div class="dialog-grid">
          <el-form-item label="册次名称">
            <el-input v-model="volumeForm.volumeLabel" />
          </el-form-item>
          <el-form-item label="K12 阶段">
            <el-select v-model="volumeForm.k12Stage">
              <el-option label="LOWER_PRIMARY" value="LOWER_PRIMARY" />
              <el-option label="MIDDLE_PRIMARY" value="MIDDLE_PRIMARY" />
              <el-option label="UPPER_PRIMARY" value="UPPER_PRIMARY" />
              <el-option label="JUNIOR_HIGH" value="JUNIOR_HIGH" />
            </el-select>
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="volumeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submittingVolume" @click="handleCreateVolume">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="nodeDialogVisible" title="新建目录节点" width="700px">
      <el-form label-position="top">
        <div class="dialog-grid">
          <el-form-item label="父节点">
            <el-select v-model="nodeForm.parentId" clearable placeholder="不选则创建根节点">
              <el-option
                v-for="node in flatNodes"
                :key="node.id"
                :label="`${' '.repeat(Math.max(node.depth - 1, 0) * 2)}${node.title}`"
                :value="node.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="节点类型">
            <el-select v-model="nodeForm.nodeType">
              <el-option label="UNIT" value="UNIT" />
              <el-option label="LESSON" value="LESSON" />
              <el-option label="SECTION" value="SECTION" />
              <el-option label="TOPIC" value="TOPIC" />
              <el-option label="SPECIAL" value="SPECIAL" />
            </el-select>
          </el-form-item>
        </div>
        <div class="dialog-grid">
          <el-form-item label="节点编码">
            <el-input v-model="nodeForm.nodeCode" />
          </el-form-item>
          <el-form-item label="标题">
            <el-input v-model="nodeForm.title" />
          </el-form-item>
        </div>
        <el-form-item label="说明">
          <el-input v-model="nodeForm.description" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="nodeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submittingNode" @click="handleCreateNode">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editNodeDialogVisible" title="编辑目录节点" width="700px">
      <el-form label-position="top">
        <div class="dialog-grid">
          <el-form-item label="父节点">
            <el-select v-model="editNodeForm.parentId" clearable placeholder="不选则移动为根节点">
              <el-option
                v-for="node in moveCandidateNodes"
                :key="node.id"
                :label="`${' '.repeat(Math.max(node.depth - 1, 0) * 2)}${node.title}`"
                :value="node.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="节点类型">
            <el-select v-model="editNodeForm.nodeType">
              <el-option label="UNIT" value="UNIT" />
              <el-option label="LESSON" value="LESSON" />
              <el-option label="SECTION" value="SECTION" />
              <el-option label="TOPIC" value="TOPIC" />
              <el-option label="SPECIAL" value="SPECIAL" />
            </el-select>
          </el-form-item>
        </div>
        <div class="dialog-grid">
          <el-form-item label="是否叶子节点">
            <el-switch v-model="editNodeForm.isLeaf" />
          </el-form-item>
          <el-form-item label="节点编码">
            <el-input v-model="editNodeForm.nodeCode" />
          </el-form-item>
        </div>
        <div class="dialog-grid">
          <el-form-item label="排序">
            <el-input-number v-model="editNodeForm.sortOrder" :min="0" />
          </el-form-item>
          <div />
        </div>
        <el-form-item label="标题">
          <el-input v-model="editNodeForm.title" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="editNodeForm.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editNodeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submittingEditNode" @click="handleUpdateNode">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="attachContentDialogVisible" title="挂载内容项" width="640px">
      <el-form label-position="top">
        <el-form-item label="内容项">
          <el-select v-model="attachContentForm.contentItemId" filterable placeholder="选择内容项">
            <el-option
              v-for="item in attachableContentItems"
              :key="item.id"
              :label="`${item.title} · ${item.itemType}`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <div class="dialog-grid">
          <el-form-item label="排序">
            <el-input-number v-model="attachContentForm.sortOrder" :min="0" />
          </el-form-item>
          <el-form-item label="主内容">
            <el-switch v-model="attachContentForm.isPrimary" />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="attachContentDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submittingAttachContent" @click="handleAttachContent">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="attachKnowledgeDialogVisible" title="挂载知识点" width="640px">
      <el-form label-position="top">
        <div class="dialog-grid">
          <el-form-item label="新增知识点编码">
            <el-input v-model="knowledgeDraft.code" placeholder="可选，留空则仅挂载已有知识点" />
          </el-form-item>
          <el-form-item label="新增知识点名称">
            <el-input v-model="knowledgeDraft.name" placeholder="可选" />
          </el-form-item>
        </div>
        <el-form-item label="已有知识点">
          <el-select v-model="attachKnowledgeForm.knowledgePointId" filterable clearable placeholder="选择已有知识点">
            <el-option
              v-for="item in attachableKnowledgePoints"
              :key="item.id"
              :label="`${item.name} · ${item.code}`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <div class="dialog-grid">
          <el-form-item label="关联类型">
            <el-input v-model="attachKnowledgeForm.relationType" placeholder="例如 PRIMARY" />
          </el-form-item>
          <el-form-item label="排序">
            <el-input-number v-model="attachKnowledgeForm.sortOrder" :min="0" />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="attachKnowledgeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submittingAttachKnowledge" @click="handleAttachKnowledge">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus';
import { computed, onMounted, reactive, ref } from 'vue';
import { adminContentApi, type AdminContentItemRecord } from '../../services/admin-content-api';
import { adminContentOpsApi } from '../../services/admin-content-ops-api';
import {
  textbooksApi,
  type KnowledgePointRecord,
  type NodeContentItemRecord,
  type SubjectRecord,
  type TextbookEditionRecord,
  type TextbookNodeDetailRecord,
  type TextbookTreeNodeRecord,
  type TextbookVolumeRecord,
} from '../../services/textbooks-api';

const subjects = ref<SubjectRecord[]>([]);
const editions = ref<TextbookEditionRecord[]>([]);
const volumes = ref<TextbookVolumeRecord[]>([]);
const treeData = ref<TextbookTreeNodeRecord[]>([]);
const nodeContentItems = ref<NodeContentItemRecord[]>([]);
const nodeKnowledgePoints = ref<KnowledgePointRecord[]>([]);
const attachableContentItems = ref<AdminContentItemRecord[]>([]);
const attachableKnowledgePoints = ref<KnowledgePointRecord[]>([]);
const selectedNodeDetail = ref<TextbookNodeDetailRecord | null>(null);

const selectedSubjectCode = ref('');
const selectedEditionId = ref('');
const selectedVolumeId = ref('');
const selectedNode = ref<TextbookTreeNodeRecord | null>(null);

const loadingTree = ref(false);
const loadingNodeContent = ref(false);
const loadingNodeKnowledgePoints = ref(false);

const editionDialogVisible = ref(false);
const volumeDialogVisible = ref(false);
const nodeDialogVisible = ref(false);
const editNodeDialogVisible = ref(false);
const attachContentDialogVisible = ref(false);
const attachKnowledgeDialogVisible = ref(false);

const submittingEdition = ref(false);
const submittingVolume = ref(false);
const submittingNode = ref(false);
const submittingEditNode = ref(false);
const submittingAttachContent = ref(false);
const submittingAttachKnowledge = ref(false);
const detachingContentItemId = ref('');
const detachingKnowledgePointId = ref('');
const deletingNode = ref(false);

const editionForm = reactive({
  subjectCode: 'ENGLISH',
  publisherCode: 'RJB',
  code: '',
  displayName: '',
  curriculumYear: 2026,
  regionScope: '全国',
});

const volumeForm = reactive({
  grade: 7,
  semester: 'FIRST_TERM',
  volumeLabel: '',
  k12Stage: 'JUNIOR_HIGH',
});

const nodeForm = reactive({
  parentId: '',
  nodeType: 'LESSON',
  nodeCode: '',
  title: '',
  description: '',
});

const editNodeForm = reactive({
  parentId: '',
  nodeType: 'LESSON',
  nodeCode: '',
  title: '',
  description: '',
  sortOrder: 0,
  isLeaf: true,
});

const attachContentForm = reactive({
  contentItemId: '',
  sortOrder: 0,
  isPrimary: false,
});

const knowledgeDraft = reactive({
  code: '',
  name: '',
});

const attachKnowledgeForm = reactive({
  knowledgePointId: '',
  relationType: 'PRIMARY',
  sortOrder: 0,
});

const flatNodes = computed(() => flattenTree(treeData.value));
const moveCandidateNodes = computed(() => {
  if (!selectedNode.value) {
    return flatNodes.value;
  }

  const excludedNodeIds = new Set(collectSubtreeIds(selectedNode.value));
  return flatNodes.value.filter((node) => !excludedNodeIds.has(node.id));
});

onMounted(async () => {
  try {
    subjects.value = await textbooksApi.listSubjects();
    if (subjects.value.length > 0) {
      selectedSubjectCode.value = subjects.value[0].code;
      editionForm.subjectCode = subjects.value[0].code;
      await handleSubjectChange(selectedSubjectCode.value);
    }
  } catch {
    ElMessage.error('加载学科列表失败');
  }
});

async function handleSubjectChange(subjectCode: string) {
  selectedEditionId.value = '';
  selectedVolumeId.value = '';
  editions.value = [];
  volumes.value = [];
  treeData.value = [];
  selectedNode.value = null;
  selectedNodeDetail.value = null;
  nodeContentItems.value = [];
  nodeKnowledgePoints.value = [];

  if (!subjectCode) {
    return;
  }

  editionForm.subjectCode = subjectCode;

  try {
    editions.value = await textbooksApi.listEditions(subjectCode);
    attachableContentItems.value = await adminContentApi.listContentItems({
      subjectCode,
      limit: 50,
    });
    attachableKnowledgePoints.value = await textbooksApi.listKnowledgePoints({
      subjectCode,
      enabled: true,
    });
    if (editions.value.length > 0) {
      selectedEditionId.value = editions.value[0].id;
      await handleEditionChange(selectedEditionId.value);
    }
  } catch {
    ElMessage.error('加载教材版本失败');
  }
}

async function handleEditionChange(editionId: string) {
  selectedVolumeId.value = '';
  volumes.value = [];
  treeData.value = [];
  selectedNode.value = null;
  selectedNodeDetail.value = null;
  nodeContentItems.value = [];
  nodeKnowledgePoints.value = [];

  if (!editionId) {
    return;
  }

  try {
    volumes.value = await textbooksApi.listVolumes(editionId);
    if (volumes.value.length > 0) {
      selectedVolumeId.value = volumes.value[0].id;
      await handleVolumeChange(selectedVolumeId.value);
    }
  } catch {
    ElMessage.error('加载册次失败');
  }
}

async function handleVolumeChange(volumeId: string) {
  treeData.value = [];
  selectedNode.value = null;
  selectedNodeDetail.value = null;
  nodeContentItems.value = [];
  nodeKnowledgePoints.value = [];

  if (!volumeId) {
    return;
  }

  loadingTree.value = true;
  try {
    const result = await textbooksApi.getVolumeTree(volumeId);
    treeData.value = result.nodes;
  } catch {
    ElMessage.error('加载目录树失败');
  } finally {
    loadingTree.value = false;
  }
}

async function handleNodeClick(node: TextbookTreeNodeRecord) {
  selectedNode.value = node;
  selectedNodeDetail.value = null;
  loadingNodeContent.value = true;
  loadingNodeKnowledgePoints.value = true;
  try {
    const [nodeDetail, contentItems, knowledgePoints] = await Promise.all([
      textbooksApi.getNode(node.id),
      textbooksApi.listNodeContentItems(node.id),
      textbooksApi.listNodeKnowledgePoints(node.id),
    ]);
    selectedNodeDetail.value = nodeDetail;
    nodeContentItems.value = contentItems;
    nodeKnowledgePoints.value = knowledgePoints;
  } catch {
    ElMessage.error('加载节点内容失败');
  } finally {
    loadingNodeContent.value = false;
    loadingNodeKnowledgePoints.value = false;
  }
}

async function handleCreateEdition() {
  if (submittingEdition.value) return;
  submittingEdition.value = true;
  try {
    await adminContentOpsApi.createTextbookEdition({
      subjectCode: editionForm.subjectCode,
      publisherCode: editionForm.publisherCode,
      code: editionForm.code,
      displayName: editionForm.displayName,
      curriculumYear: editionForm.curriculumYear,
      regionScope: editionForm.regionScope,
      isEnabled: true,
    });
    editionDialogVisible.value = false;
    ElMessage.success('教材版本创建成功');
    selectedSubjectCode.value = editionForm.subjectCode;
    await handleSubjectChange(selectedSubjectCode.value);
  } catch {
    ElMessage.error('教材版本创建失败');
  } finally {
    submittingEdition.value = false;
  }
}

async function handleCreateVolume() {
  if (!selectedEditionId.value || submittingVolume.value) return;
  submittingVolume.value = true;
  try {
    await adminContentOpsApi.createTextbookVolume(selectedEditionId.value, {
      grade: volumeForm.grade,
      semester: volumeForm.semester,
      volumeLabel: volumeForm.volumeLabel,
      k12Stage: volumeForm.k12Stage,
      sortOrder: 0,
      version: 1,
    });
    volumeDialogVisible.value = false;
    ElMessage.success('册次创建成功');
    await handleEditionChange(selectedEditionId.value);
  } catch {
    ElMessage.error('册次创建失败');
  } finally {
    submittingVolume.value = false;
  }
}

async function handleCreateNode() {
  if (!selectedVolumeId.value || submittingNode.value) return;
  submittingNode.value = true;
  try {
    await adminContentOpsApi.createTextbookNode(selectedVolumeId.value, {
      parentId: nodeForm.parentId || undefined,
      nodeType: nodeForm.nodeType,
      nodeCode: nodeForm.nodeCode || undefined,
      title: nodeForm.title,
      description: nodeForm.description || undefined,
      sortOrder: 0,
      isLeaf: nodeForm.nodeType === 'LESSON' || nodeForm.nodeType === 'TOPIC',
    });
    nodeDialogVisible.value = false;
    ElMessage.success('节点创建成功');
    await handleVolumeChange(selectedVolumeId.value);
  } catch {
    ElMessage.error('节点创建失败');
  } finally {
    submittingNode.value = false;
  }
}

async function openEditNodeDialog() {
  if (!selectedNode.value) {
    return;
  }

  try {
    const nodeDetail = selectedNodeDetail.value ?? (await textbooksApi.getNode(selectedNode.value.id));
    selectedNodeDetail.value = nodeDetail;
    editNodeForm.parentId = nodeDetail.parentId ?? '';
    editNodeForm.nodeType = nodeDetail.nodeType;
    editNodeForm.nodeCode = nodeDetail.nodeCode ?? '';
    editNodeForm.title = nodeDetail.title;
    editNodeForm.description = nodeDetail.description ?? '';
    editNodeForm.sortOrder = nodeDetail.sortOrder;
    editNodeForm.isLeaf = nodeDetail.isLeaf;
    editNodeDialogVisible.value = true;
  } catch {
    ElMessage.error('加载节点详情失败');
  }
}

async function handleUpdateNode() {
  if (!selectedNode.value || submittingEditNode.value) return;
  submittingEditNode.value = true;
  try {
    await adminContentOpsApi.updateTextbookNode(selectedNode.value.id, {
      parentId: editNodeForm.parentId || null,
      nodeType: editNodeForm.nodeType,
      nodeCode: editNodeForm.nodeCode || undefined,
      title: editNodeForm.title,
      description: editNodeForm.description || undefined,
      sortOrder: editNodeForm.sortOrder,
      isLeaf: editNodeForm.isLeaf,
    });
    editNodeDialogVisible.value = false;
    ElMessage.success('节点更新成功');
    await refreshSelectedNode(selectedNode.value.id);
  } catch {
    ElMessage.error('节点更新失败');
  } finally {
    submittingEditNode.value = false;
  }
}

async function handleDeleteNode() {
  if (!selectedNode.value || deletingNode.value) {
    return;
  }

  try {
    await ElMessageBox.confirm(
      '删除后将级联移除该节点及其子节点上的挂载关系。是否继续？',
      '确认删除节点',
      {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消',
      },
    );
  } catch {
    return;
  }

  deletingNode.value = true;
  try {
    const deletedNodeId = selectedNode.value.id;
    await adminContentOpsApi.deleteTextbookNode(deletedNodeId);
    selectedNode.value = null;
    selectedNodeDetail.value = null;
    nodeContentItems.value = [];
    nodeKnowledgePoints.value = [];
    ElMessage.success('节点删除成功');
    await handleVolumeChange(selectedVolumeId.value);
  } catch {
    ElMessage.error('节点删除失败');
  } finally {
    deletingNode.value = false;
  }
}

async function handleAttachContent() {
  if (!selectedNode.value || !attachContentForm.contentItemId || submittingAttachContent.value) return;
  submittingAttachContent.value = true;
  try {
    await adminContentOpsApi.attachContentItemToNode(selectedNode.value.id, {
      contentItemId: attachContentForm.contentItemId,
      isPrimary: attachContentForm.isPrimary,
      sortOrder: attachContentForm.sortOrder,
    });
    attachContentDialogVisible.value = false;
    ElMessage.success('内容项挂载成功');
    await handleNodeClick(selectedNode.value);
  } catch {
    ElMessage.error('内容项挂载失败');
  } finally {
    submittingAttachContent.value = false;
  }
}

async function handleDetachContent(contentItemId: string) {
  if (!selectedNode.value || detachingContentItemId.value) return;

  try {
    await ElMessageBox.confirm('解绑后该节点将不再关联此内容项。是否继续？', '确认解绑', {
      type: 'warning',
      confirmButtonText: '解绑',
      cancelButtonText: '取消',
    });
  } catch {
    return;
  }

  detachingContentItemId.value = contentItemId;
  try {
    await adminContentOpsApi.detachContentItemFromNode(selectedNode.value.id, contentItemId);
    ElMessage.success('内容项解绑成功');
    await handleNodeClick(selectedNode.value);
  } catch {
    ElMessage.error('内容项解绑失败');
  } finally {
    detachingContentItemId.value = '';
  }
}

async function handleAttachKnowledge() {
  if (!selectedNode.value || submittingAttachKnowledge.value) return;
  submittingAttachKnowledge.value = true;
  try {
    let knowledgePointId = attachKnowledgeForm.knowledgePointId;

    if (!knowledgePointId && knowledgeDraft.code && knowledgeDraft.name) {
      const created = await adminContentOpsApi.createKnowledgePoint({
        subjectCode: selectedSubjectCode.value,
        code: knowledgeDraft.code,
        name: knowledgeDraft.name,
        difficultyLevel: 2,
      });
      knowledgePointId = created.id;
      attachableKnowledgePoints.value = await textbooksApi.listKnowledgePoints({
        subjectCode: selectedSubjectCode.value,
        enabled: true,
      });
    }

    if (!knowledgePointId) {
      ElMessage.error('请选择或创建知识点');
      return;
    }

    await adminContentOpsApi.attachKnowledgePointToNode(selectedNode.value.id, {
      knowledgePointId,
      relationType: attachKnowledgeForm.relationType || undefined,
      sortOrder: attachKnowledgeForm.sortOrder,
    });
    attachKnowledgeDialogVisible.value = false;
    ElMessage.success('知识点挂载成功');
    await handleNodeClick(selectedNode.value);
  } catch {
    ElMessage.error('知识点挂载失败');
  } finally {
    submittingAttachKnowledge.value = false;
  }
}

async function handleDetachKnowledge(knowledgePointId: string) {
  if (!selectedNode.value || detachingKnowledgePointId.value) return;

  try {
    await ElMessageBox.confirm('解绑后该节点将不再关联此知识点。是否继续？', '确认解绑', {
      type: 'warning',
      confirmButtonText: '解绑',
      cancelButtonText: '取消',
    });
  } catch {
    return;
  }

  detachingKnowledgePointId.value = knowledgePointId;
  try {
    await adminContentOpsApi.detachKnowledgePointFromNode(selectedNode.value.id, knowledgePointId);
    ElMessage.success('知识点解绑成功');
    await handleNodeClick(selectedNode.value);
  } catch {
    ElMessage.error('知识点解绑失败');
  } finally {
    detachingKnowledgePointId.value = '';
  }
}

async function refreshSelectedNode(nodeId: string) {
  if (!selectedVolumeId.value) {
    return;
  }

  await handleVolumeChange(selectedVolumeId.value);
  const refreshedNode = findNodeById(treeData.value, nodeId);
  if (refreshedNode) {
    await handleNodeClick(refreshedNode);
  }
}

function flattenTree(nodes: TextbookTreeNodeRecord[]): TextbookTreeNodeRecord[] {
  const result: TextbookTreeNodeRecord[] = [];
  const visit = (list: TextbookTreeNodeRecord[]) => {
    for (const node of list) {
      result.push(node);
      if (node.children.length > 0) {
        visit(node.children);
      }
    }
  };
  visit(nodes);
  return result;
}

function collectSubtreeIds(node: TextbookTreeNodeRecord): string[] {
  const ids = [node.id];
  for (const child of node.children) {
    ids.push(...collectSubtreeIds(child));
  }
  return ids;
}

function findNodeById(nodes: TextbookTreeNodeRecord[], nodeId: string): TextbookTreeNodeRecord | null {
  for (const node of nodes) {
    if (node.id === nodeId) {
      return node;
    }

    const childMatch = findNodeById(node.children, nodeId);
    if (childMatch) {
      return childMatch;
    }
  }

  return null;
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

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.workspace-grid {
  display: grid;
  grid-template-columns: minmax(320px, 0.95fr) minmax(420px, 1.05fr);
  gap: 20px;
}

.dialog-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.tree-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.node-summary {
  margin-bottom: 16px;
}

.node-title {
  font-size: 16px;
  font-weight: 700;
}

.node-meta {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 8px;
  color: #6b7280;
  font-size: 13px;
}

@media (max-width: 1100px) {
  .filters-grid,
  .workspace-grid,
  .dialog-grid {
    grid-template-columns: 1fr;
  }
}
</style>
