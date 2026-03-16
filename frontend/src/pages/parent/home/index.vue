<template>
  <view class="container">
    <view class="title">家长首页</view>
    <view class="desc">当前可体验家长学习设置与待审批推送流程</view>
    <view class="meta">家庭 ID：{{ sessionStore.familyId || "-" }}</view>

    <button class="action-btn" @tap="goCreateChild">创建孩子档案</button>
    <button class="action-btn" type="primary" @tap="goApprovalCenter">待审批推送</button>
    <button class="action-btn" @tap="goLearningSettings">学习设置</button>
    <button class="action-btn" @tap="goChildTaskBoard">孩子任务面板</button>
    <button class="action-btn danger" @tap="logout">退出登录</button>
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

function goCreateChild(): void {
  uni.navigateTo({
    url: "/pages/parent/children/create/index"
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
