<template>
  <view class="container">
    <view class="title">Meglow 登录</view>
    <view class="desc">请填写手机可访问的 API 地址，然后获取开发验证码 123456。</view>

    <view class="field">
      <text class="label">API 地址</text>
      <input v-model="apiBaseInput" class="input" placeholder="例如：http://192.168.1.20:5002/api" />
      <view class="hint">当前：{{ effectiveApiBase }}</view>
    </view>

    <view class="field">
      <text class="label">手机号</text>
      <input v-model="phone" class="input" type="number" placeholder="例如：13800138000" />
    </view>

    <view class="field">
      <text class="label">验证码</text>
      <input v-model="verificationCode" class="input" placeholder="123456" />
    </view>

    <view class="row">
      <button class="secondary-btn" :loading="sendingCode" @tap="sendCode">发送验证码</button>
      <button class="login-btn" type="primary" :loading="loggingIn" @tap="login">登录</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from "@dcloudio/uni-app";
import { computed, ref } from "vue";
import { postLogin, postSendVerificationCode } from "../../../services/api";
import { getApiBase, normalizeApiBase, setApiBase } from "../../../services/http/client";
import { useSessionStore } from "../../../stores/session";

const sessionStore = useSessionStore();
const sendingCode = ref(false);
const loggingIn = ref(false);
const phone = ref("");
const verificationCode = ref("123456");
const apiBaseInput = ref(getApiBase());

const effectiveApiBase = computed(() => {
  const trimmed = apiBaseInput.value.trim();
  return trimmed ? normalizeApiBase(trimmed) : getApiBase();
});

onLoad(() => {
  sessionStore.loadFromStorage();
  if (sessionStore.accessToken) {
    uni.reLaunch({
      url: "/pages/parent/home/index"
    });
  }
});

function persistApiBase(): string | null {
  const trimmed = apiBaseInput.value.trim();
  if (!/^https?:\/\/.+/i.test(trimmed)) {
    uni.showToast({ title: "API 地址必须以 http:// 或 https:// 开头", icon: "none" });
    return null;
  }

  const normalized = setApiBase(trimmed);
  apiBaseInput.value = normalized;
  return normalized;
}

async function sendCode(): Promise<void> {
  const trimmedPhone = phone.value.trim();
  if (!/^1\d{10}$/.test(trimmedPhone)) {
    uni.showToast({ title: "手机号格式不正确", icon: "none" });
    return;
  }

  if (!persistApiBase()) {
    return;
  }

  sendingCode.value = true;
  try {
    await postSendVerificationCode({ phone: trimmedPhone });
    uni.showToast({ title: "验证码已发送：123456", icon: "none" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "发送验证码失败";
    uni.showToast({ title: message, icon: "none" });
  } finally {
    sendingCode.value = false;
  }
}

async function login(): Promise<void> {
  const trimmedPhone = phone.value.trim();
  if (!/^1\d{10}$/.test(trimmedPhone)) {
    uni.showToast({ title: "手机号格式不正确", icon: "none" });
    return;
  }
  if (!verificationCode.value.trim()) {
    uni.showToast({ title: "请输入验证码", icon: "none" });
    return;
  }
  if (!persistApiBase()) {
    return;
  }

  loggingIn.value = true;
  try {
    const result = await postLogin({
      phone: trimmedPhone,
      verificationCode: verificationCode.value.trim()
    });
    sessionStore.setSession({
      accessToken: result.accessToken,
      parentId: result.parentId,
      familyId: result.familyId
    });
    uni.reLaunch({
      url: "/pages/parent/home/index"
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "登录失败";
    uni.showToast({ title: message, icon: "none" });
  } finally {
    loggingIn.value = false;
  }
}
</script>

<style scoped>
.container {
  padding: 32rpx 24rpx;
}

.title {
  font-size: 44rpx;
  font-weight: 700;
}

.desc {
  margin-top: 12rpx;
  color: #667085;
  font-size: 26rpx;
  line-height: 1.5;
}

.field {
  margin-top: 24rpx;
}

.label {
  display: block;
  margin-bottom: 10rpx;
  font-size: 26rpx;
  color: #1f2937;
}

.input {
  min-height: 74rpx;
  border: 1rpx solid #d5d9e2;
  border-radius: 10rpx;
  padding: 14rpx 16rpx;
  background: #fff;
  font-size: 26rpx;
  box-sizing: border-box;
}

.hint {
  margin-top: 10rpx;
  color: #667085;
  font-size: 22rpx;
  word-break: break-all;
}

.row {
  display: flex;
  gap: 16rpx;
  margin-top: 30rpx;
}

.secondary-btn,
.login-btn {
  flex: 1;
}
</style>
