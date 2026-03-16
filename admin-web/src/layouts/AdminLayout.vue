<template>
  <el-container class="layout-shell">
    <el-aside width="240px" class="layout-aside">
      <div class="brand-block">
        <div class="brand-mark">M</div>
        <div>
          <div class="brand-title">Meglow 内容后台</div>
          <div class="brand-subtitle">教材与内容运营工作台</div>
        </div>
      </div>

      <el-menu
        class="layout-menu"
        :default-active="route.name ? String(route.name) : 'dashboard'"
        router
      >
        <el-menu-item index="dashboard" :route="{ name: 'dashboard' }">工作台</el-menu-item>
        <el-menu-item index="textbooks" :route="{ name: 'textbooks' }">教材管理</el-menu-item>
        <el-menu-item index="knowledge-points" :route="{ name: 'knowledge-points' }">知识点</el-menu-item>
        <el-menu-item index="content-items" :route="{ name: 'content-items' }">内容项</el-menu-item>
        <el-menu-item
          v-if="session.profile?.role === 'SUPER_ADMIN'"
          index="admin-users"
          :route="{ name: 'admin-users' }"
        >
          管理员
        </el-menu-item>
        <el-menu-item index="audit-logs" :route="{ name: 'audit-logs' }">审计日志</el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="layout-header">
        <div>
          <div class="header-title">{{ pageTitle }}</div>
          <div class="header-subtitle">独立后台应用，不复用家长端/孩子端 uni-app</div>
        </div>

        <div class="header-actions">
          <el-tag type="warning" effect="plain">{{ session.profile?.role }}</el-tag>
          <span class="header-user">{{ session.profile?.displayName }}</span>
          <el-button link type="primary" @click="handleLogout">退出</el-button>
        </div>
      </el-header>

      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAdminSessionStore } from '../stores/session';

const route = useRoute();
const router = useRouter();
const session = useAdminSessionStore();

const pageTitle = computed(() => {
  switch (route.name) {
    case 'textbooks':
      return '教材管理';
    case 'knowledge-points':
      return '知识点管理';
    case 'content-items':
      return '内容项管理';
    case 'admin-users':
      return '管理员管理';
    case 'audit-logs':
      return '审计日志';
    default:
      return '后台工作台';
  }
});

function handleLogout() {
  session.logout();
  router.push({ name: 'login' });
}
</script>

<style scoped>
.layout-shell {
  min-height: 100vh;
}

.layout-aside {
  border-right: 1px solid #ebeef5;
  background: linear-gradient(180deg, #fff8eb 0%, #ffffff 100%);
}

.brand-block {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 24px 20px 16px;
}

.brand-mark {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 12px;
  background: linear-gradient(135deg, #f59e0b, #fb7185);
  color: #fff;
  font-weight: 700;
}

.brand-title {
  font-size: 16px;
  font-weight: 700;
}

.brand-subtitle {
  color: #6b7280;
  font-size: 12px;
}

.layout-menu {
  border-right: none;
  background: transparent;
}

.layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 72px;
  border-bottom: 1px solid #ebeef5;
  background: rgba(255, 255, 255, 0.84);
  backdrop-filter: blur(8px);
}

.header-title {
  font-size: 20px;
  font-weight: 700;
}

.header-subtitle {
  color: #6b7280;
  font-size: 12px;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.header-user {
  font-size: 14px;
  font-weight: 600;
}

.layout-main {
  padding: 24px;
}
</style>
