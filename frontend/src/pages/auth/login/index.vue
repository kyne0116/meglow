<template>
  <view class="container">
    <view class="title">Meglow Login</view>
    <view class="desc">Use dev verification code 123456</view>

    <view class="field">
      <text class="label">Phone</text>
      <input v-model="phone" class="input" type="number" placeholder="e.g. 13800138000" />
    </view>

    <view class="field">
      <text class="label">Verification Code</text>
      <input v-model="verificationCode" class="input" placeholder="123456" />
    </view>

    <button class="login-btn" type="primary" :loading="loading" @tap="login">Login</button>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from "@dcloudio/uni-app";
import { ref } from "vue";
import { postLogin } from "../../../services/api";
import { useSessionStore } from "../../../stores/session";

const sessionStore = useSessionStore();
const loading = ref(false);
const phone = ref("");
const verificationCode = ref("123456");

onLoad(() => {
  sessionStore.loadFromStorage();
  if (sessionStore.accessToken) {
    uni.reLaunch({
      url: "/pages/parent/home/index"
    });
  }
});

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

  loading.value = true;
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
    loading.value = false;
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

.login-btn {
  margin-top: 30rpx;
}
</style>
