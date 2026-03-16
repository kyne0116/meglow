<template>
  <div class="page-grid">
    <el-card shadow="never">
      <template #header>
        <div class="page-header">
          <div>
            <div class="page-title">管理员</div>
            <div class="page-subtitle">管理后台账号、角色、启停状态和密码重置。</div>
          </div>
          <el-button type="primary" @click="openCreateDialog">新建管理员</el-button>
        </div>
      </template>

      <div class="filters-grid">
        <el-select v-model="filters.role" placeholder="角色" clearable @change="reloadAdminUsers">
          <el-option label="SUPER_ADMIN" value="SUPER_ADMIN" />
          <el-option label="CONTENT_EDITOR" value="CONTENT_EDITOR" />
          <el-option label="CONTENT_PUBLISHER" value="CONTENT_PUBLISHER" />
          <el-option label="VIEWER" value="VIEWER" />
        </el-select>

        <el-select v-model="filters.enabled" placeholder="状态" clearable @change="reloadAdminUsers">
          <el-option label="启用" :value="true" />
          <el-option label="停用" :value="false" />
        </el-select>

        <el-input-number v-model="filters.limit" :min="1" :max="200" @change="reloadAdminUsers" />
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="panel-header">
          <div class="panel-title">管理员列表</div>
          <el-tag type="warning" effect="plain">{{ adminUsers.length }} 人</el-tag>
        </div>
      </template>

      <el-table :data="adminUsers" v-loading="loading" size="small">
        <el-table-column prop="username" label="用户名" min-width="160" />
        <el-table-column prop="displayName" label="显示名" min-width="160" />
        <el-table-column prop="role" label="角色" min-width="180" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isEnabled ? 'success' : 'info'" effect="plain">
              {{ row.isEnabled ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastLoginAt" label="最近登录" min-width="180" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogMode === 'create' ? '新建管理员' : '编辑管理员'" width="680px">
      <el-form label-position="top">
        <div class="dialog-grid">
          <el-form-item label="用户名">
            <el-input v-model="form.username" :disabled="dialogMode === 'edit'" />
          </el-form-item>

          <el-form-item label="显示名">
            <el-input v-model="form.displayName" />
          </el-form-item>
        </div>

        <div class="dialog-grid">
          <el-form-item label="角色">
            <el-select v-model="form.role">
              <el-option label="SUPER_ADMIN" value="SUPER_ADMIN" />
              <el-option label="CONTENT_EDITOR" value="CONTENT_EDITOR" />
              <el-option label="CONTENT_PUBLISHER" value="CONTENT_PUBLISHER" />
              <el-option label="VIEWER" value="VIEWER" />
            </el-select>
          </el-form-item>

          <el-form-item label="状态">
            <el-switch v-model="form.isEnabled" active-text="启用" inactive-text="停用" />
          </el-form-item>
        </div>

        <el-form-item :label="dialogMode === 'create' ? '初始密码' : '重置密码（可选）'">
          <el-input v-model="form.password" type="password" show-password />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus';
import { onMounted, reactive, ref } from 'vue';
import { adminUsersApi, type AdminUserRecord } from '../../services/admin-users-api';

type DialogMode = 'create' | 'edit';

const filters = reactive({
  role: '',
  enabled: undefined as boolean | undefined,
  limit: 50,
});

const adminUsers = ref<AdminUserRecord[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const dialogMode = ref<DialogMode>('create');
const submitting = ref(false);
const editingAdminUserId = ref('');

const form = reactive({
  username: '',
  displayName: '',
  role: 'CONTENT_EDITOR',
  isEnabled: true,
  password: '',
});

onMounted(async () => {
  await reloadAdminUsers();
});

async function reloadAdminUsers() {
  loading.value = true;
  try {
    adminUsers.value = await adminUsersApi.listAdminUsers({
      role: filters.role || undefined,
      enabled: filters.enabled,
      limit: filters.limit,
    });
  } catch {
    ElMessage.error('加载管理员列表失败');
  } finally {
    loading.value = false;
  }
}

function openCreateDialog() {
  dialogMode.value = 'create';
  editingAdminUserId.value = '';
  form.username = '';
  form.displayName = '';
  form.role = 'CONTENT_EDITOR';
  form.isEnabled = true;
  form.password = '';
  dialogVisible.value = true;
}

function openEditDialog(adminUser: AdminUserRecord) {
  dialogMode.value = 'edit';
  editingAdminUserId.value = adminUser.id;
  form.username = adminUser.username;
  form.displayName = adminUser.displayName;
  form.role = adminUser.role;
  form.isEnabled = adminUser.isEnabled;
  form.password = '';
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (submitting.value) {
    return;
  }

  submitting.value = true;
  try {
    if (dialogMode.value === 'create') {
      await adminUsersApi.createAdminUser({
        username: form.username,
        displayName: form.displayName,
        role: form.role,
        password: form.password,
      });
      ElMessage.success('管理员创建成功');
    } else if (editingAdminUserId.value) {
      await adminUsersApi.updateAdminUser(editingAdminUserId.value, {
        displayName: form.displayName,
        role: form.role,
        isEnabled: form.isEnabled,
        password: form.password || undefined,
      });
      ElMessage.success('管理员更新成功');
    }

    dialogVisible.value = false;
    await reloadAdminUsers();
  } catch {
    ElMessage.error(dialogMode.value === 'create' ? '管理员创建失败' : '管理员更新失败');
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.dialog-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

@media (max-width: 1100px) {
  .filters-grid,
  .dialog-grid {
    grid-template-columns: 1fr;
  }
}
</style>
