<template>
  <div class="login-page">
    <div class="login-panel">
      <div class="hero-copy">
        <el-tag effect="dark" type="warning">Content Admin</el-tag>
        <h1>教材与内容运营后台</h1>
        <p>用于维护教材版本、册次、目录节点、内容项与版本发布。</p>
      </div>

      <el-card shadow="never" class="login-card">
        <template #header>
          <div class="card-header">管理员登录</div>
        </template>

        <el-form label-position="top" @submit.prevent="handleSubmit">
          <el-form-item label="用户名">
            <el-input v-model="form.username" placeholder="请输入用户名" />
          </el-form-item>

          <el-form-item label="密码">
            <el-input
              v-model="form.password"
              placeholder="请输入密码"
              type="password"
              show-password
              @keyup.enter="handleSubmit"
            />
          </el-form-item>

          <el-alert
            v-if="errorMessage"
            type="error"
            :closable="false"
            :title="errorMessage"
            class="login-error"
          />

          <el-button type="primary" size="large" class="login-button" :loading="loading" @click="handleSubmit">
            登录后台
          </el-button>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAdminSessionStore } from '../../stores/session';

const router = useRouter();
const route = useRoute();
const session = useAdminSessionStore();

const loading = ref(false);
const errorMessage = ref('');
const form = reactive({
  username: 'admin',
  password: 'Admin@123456',
});

async function handleSubmit() {
  if (loading.value) {
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    await session.login(form.username.trim(), form.password);
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/';
    router.push(redirect);
  } catch (error) {
    errorMessage.value = '登录失败，请检查用户名和密码。';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 24px;
}

.login-panel {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 24px;
  width: min(1080px, 100%);
}

.hero-copy {
  padding: 48px;
  border: 1px solid rgba(251, 191, 36, 0.18);
  border-radius: 28px;
  background:
    radial-gradient(circle at top right, rgba(245, 158, 11, 0.18), transparent 26%),
    linear-gradient(180deg, rgba(255, 251, 235, 0.92), rgba(255, 255, 255, 0.95));
}

.hero-copy h1 {
  margin: 20px 0 12px;
  font-size: 42px;
  line-height: 1.1;
}

.hero-copy p {
  max-width: 480px;
  color: #4b5563;
  font-size: 16px;
  line-height: 1.7;
}

.login-card {
  align-self: center;
  border-radius: 24px;
}

.card-header {
  font-size: 18px;
  font-weight: 700;
}

.login-error {
  margin-bottom: 16px;
}

.login-button {
  width: 100%;
}

@media (max-width: 900px) {
  .login-panel {
    grid-template-columns: 1fr;
  }

  .hero-copy {
    padding: 32px;
  }

  .hero-copy h1 {
    font-size: 32px;
  }
}
</style>
