<template>
  <view class="container">
    <view class="title">Meglow Login</view>
    <view class="desc">Configure a reachable API address for your phone, then request dev code 123456.</view>

    <view class="field">
      <text class="label">API Base</text>
      <input v-model="apiBaseInput" class="input" placeholder="e.g. http://192.168.1.20:5002/api" />
      <view class="hint">Current: {{ effectiveApiBase }}</view>
    </view>

    <view class="field">
      <text class="label">Phone</text>
      <input v-model="phone" class="input" type="number" placeholder="e.g. 13800138000" />
    </view>

    <view class="field">
      <text class="label">Verification Code</text>
      <input v-model="verificationCode" class="input" placeholder="123456" />
    </view>

    <view class="row">
      <button class="secondary-btn" :loading="sendingCode" @tap="sendCode">Send Code</button>
      <button class="login-btn" type="primary" :loading="loggingIn" @tap="login">Login</button>
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
    uni.showToast({ title: "API Base must start with http:// or https://", icon: "none" });
    return null;
  }

  const normalized = setApiBase(trimmed);
  apiBaseInput.value = normalized;
  return normalized;
}

async function sendCode(): Promise<void> {
  const trimmedPhone = phone.value.trim();
  if (!/^1\d{10}$/.test(trimmedPhone)) {
    uni.showToast({ title: "Invalid phone number", icon: "none" });
    return;
  }

  if (!persistApiBase()) {
    return;
  }

  sendingCode.value = true;
  try {
    await postSendVerificationCode({ phone: trimmedPhone });
    uni.showToast({ title: "Code sent: 123456", icon: "none" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "send code failed";
    uni.showToast({ title: message, icon: "none" });
  } finally {
    sendingCode.value = false;
  }
}

async function login(): Promise<void> {
  const trimmedPhone = phone.value.trim();
  if (!/^1\d{10}$/.test(trimmedPhone)) {
    uni.showToast({ title: "Invalid phone number", icon: "none" });
    return;
  }
  if (!verificationCode.value.trim()) {
    uni.showToast({ title: "Verification code required", icon: "none" });
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
    const message = error instanceof Error ? error.message : "login failed";
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
