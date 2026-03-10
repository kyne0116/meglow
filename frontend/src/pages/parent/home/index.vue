<template>
  <view class="container">
    <view class="title">Parent Home</view>
    <view class="desc">Current phase: parent settings and push approval center</view>
    <view class="meta">Family: {{ sessionStore.familyId || "-" }}</view>

    <button class="action-btn" type="primary" @tap="goApprovalCenter">Pending Push Center</button>
    <button class="action-btn" @tap="goLearningSettings">Learning Settings</button>
    <button class="action-btn" @tap="goChildTaskBoard">Child Task Board</button>
    <button class="action-btn danger" @tap="logout">Logout</button>
  </view>
</template>

<script setup lang="ts">
import { onShow } from "@dcloudio/uni-app";
import { useSessionStore } from "../../../stores/session";

const sessionStore = useSessionStore();

onShow(() => {
  sessionStore.loadFromStorage();
  if (!sessionStore.accessToken) {
    uni.reLaunch({
      url: "/pages/auth/login/index"
    });
  }
});

function goLearningSettings(): void {
  uni.navigateTo({
    url: "/pages/parent/settings/learning/index"
  });
}

function goApprovalCenter(): void {
  uni.navigateTo({
    url: "/pages/parent/approval/index"
  });
}

function goChildTaskBoard(): void {
  uni.navigateTo({
    url: "/pages/child/home/index"
  });
}

function logout(): void {
  sessionStore.clearSession();
  uni.reLaunch({
    url: "/pages/auth/login/index"
  });
}
</script>

<style scoped>
.container {
  padding: 24rpx;
}

.title {
  font-size: 40rpx;
  font-weight: 600;
}

.desc {
  margin-top: 16rpx;
  color: #666;
  font-size: 28rpx;
}

.meta {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #7b8190;
}

.action-btn {
  margin-top: 20rpx;
}

.danger {
  color: #c53030;
}
</style>
