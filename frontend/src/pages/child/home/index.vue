<template>
  <view class="container">
    <view class="title">孩子任务面板</view>

    <view v-if="children.length === 0 && !loading" class="empty">未找到孩子档案，请先创建孩子数据。</view>

    <view v-else class="panel">
      <view class="field">
        <text class="label">孩子</text>
        <picker :range="childNames" :value="selectedChildIndex" @change="onChildChange">
          <view class="picker-value">{{ childNames[selectedChildIndex] }}</view>
        </picker>
      </view>

      <view class="field">
        <text class="label">日期筛选（YYYY-MM-DD，可选）</text>
        <input v-model="dateFilter" class="input" placeholder="例如：2026-03-11" @blur="onDateFilterBlur" />
      </view>

      <view class="quick-row">
        <button size="mini" @tap="applyTodayFilter">今天</button>
        <button size="mini" @tap="clearDateFilter">清空日期</button>
      </view>

      <view class="field">
        <text class="label">状态筛选</text>
        <picker :range="statusFilterLabels" :value="selectedStatusFilterIndex" @change="onStatusFilterChange">
          <view class="picker-value">{{ statusFilterLabels[selectedStatusFilterIndex] }}</view>
        </picker>
      </view>

      <button class="refresh-btn" :loading="loading" @tap="loadTasks">刷新任务</button>

      <view v-if="taskRecommendation" class="recommend-card">
        <view class="task-title">{{ taskRecommendation.title }}</view>
        <view class="line">{{ taskRecommendation.summary }}</view>
        <view class="line">{{ taskRecommendation.description }}</view>
        <view v-if="taskRecommendation.focusSummary" class="line">{{ taskRecommendation.focusSummary }}</view>
        <view v-if="taskRecommendation.coachHint" class="line">提示：{{ taskRecommendation.coachHint }}</view>
        <button
          size="mini"
          type="primary"
          :loading="recommendedActionLoading"
          @tap="handleTaskRecommendation"
        >
          {{ taskRecommendation.actionLabel }}
        </button>
      </view>

      <view class="summary">
        <text>总数：{{ tasks.length }}</text>
        <text>筛选后：{{ filteredTasks.length }}</text>
        <text>可投递：{{ filteredDeliverableTasks.length }}</text>
        <text>可学习：{{ filteredLearnableTasks.length }}</text>
        <text>可完成：{{ filteredCompletableTasks.length }}</text>
      </view>

      <view class="quick-row">
        <button
          size="mini"
          :disabled="filteredDeliverableTasks.length === 0 || batchDelivering"
          :loading="batchDelivering"
          @tap="deliverFilteredTasks"
        >
          批量投递
        </button>
        <button
          size="mini"
          type="primary"
          :disabled="filteredCompletableTasks.length === 0 || batchCompleting"
          :loading="batchCompleting"
          @tap="completeFilteredTasks"
        >
          批量完成
        </button>
      </view>

      <view v-if="filteredTasks.length === 0 && !loading" class="empty">当前筛选条件下没有任务。</view>

      <view
        v-for="item in prioritizedTasks"
        :key="item.id"
        class="task-card"
        :class="{ 'task-card--recommended': item.id === taskRecommendation?.taskId }"
      >
        <view v-if="item.id === taskRecommendation?.taskId" class="recommend-badge">推荐优先处理</view>
        <view class="task-title">{{ item.summary }}</view>
        <view class="line">状态：{{ formatStatus(item.status) }}</view>
        <view class="line">计划时间：{{ formatTime(item.scheduledAt) }}</view>

        <view v-if="getTaskInsight(item)" class="task-insight">
          <view class="line">{{ getTaskInsight(item)?.modeLabel }} · {{ getTaskInsight(item)?.priorityLabel }}</view>
          <view class="line">任务要点：{{ getTaskInsight(item)?.countSummary }}</view>
          <view v-if="getTaskInsight(item)?.focusReviewSummary" class="line">
            {{ getTaskInsight(item)?.focusReviewSummary }}
          </view>
          <view v-if="getTaskInsight(item)?.coachHint" class="line">提示：{{ getTaskInsight(item)?.coachHint }}</view>
          <view v-if="getTaskInsight(item)?.previewWords.length" class="line">
            词汇预览：{{ getTaskInsight(item)?.previewWords.join("、") }}
          </view>
        </view>

        <view class="actions">
          <button
            v-if="item.status === 'APPROVED' || item.status === 'MODIFIED'"
            size="mini"
            :loading="deliveringId === item.id"
            @tap="deliverTask(item.id)"
          >
            标记为已投递
          </button>
          <button
            v-if="item.status === 'DELIVERED'"
            size="mini"
            type="primary"
            :loading="startingTaskId === item.id"
            @tap="startLearning(item.id)"
          >
            开始学习
          </button>
          <button
            v-if="item.status === 'DELIVERED'"
            size="mini"
            :loading="completingId === item.id"
            @tap="completeTask(item.id)"
          >
            标记为已完成
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad, onShow } from "@dcloudio/uni-app";
import { computed, ref } from "vue";
import {
  ChildSummary,
  ChildTask,
  getChildren,
  getChildTasks,
  postCompletePush,
  postCreateLearningSession,
  postDeliverPush
} from "../../../services/api";
import { useSessionStore } from "../../../stores/session";
import { buildTaskInsight } from "./task-insights";
import { prioritizeTasks } from "./task-list-order";
import { buildTaskRecommendation } from "./task-recommendation";

interface PickerChangeEvent {
  detail: {
    value: string;
  };
}

type StatusFilter = "ALL" | "APPROVED" | "MODIFIED" | "DELIVERED" | "COMPLETED";

const FILTER_STORAGE_PREFIX = "child_task_filters:";

const sessionStore = useSessionStore();
const loading = ref(false);
const completingId = ref("");
const deliveringId = ref("");
const startingTaskId = ref("");
const batchDelivering = ref(false);
const batchCompleting = ref(false);
const recommendedActionLoading = ref(false);
const children = ref<ChildSummary[]>([]);
const selectedChildIndex = ref(0);
const tasks = ref<ChildTask[]>([]);
const dateFilter = ref("");

const statusFilterOptions: StatusFilter[] = ["ALL", "APPROVED", "MODIFIED", "DELIVERED", "COMPLETED"];
const statusFilterLabels = ["全部", "已通过", "已修改", "已投递", "已完成"];
const selectedStatusFilterIndex = ref(0);

const childNames = computed(() => children.value.map((item) => `${item.name}（${item.grade} 年级）`));
const selectedChildId = computed(() => children.value[selectedChildIndex.value]?.id ?? "");
const selectedStatusFilter = computed(() => statusFilterOptions[selectedStatusFilterIndex.value] ?? "ALL");
const filteredTasks = computed(() => {
  if (selectedStatusFilter.value === "ALL") {
    return tasks.value;
  }
  return tasks.value.filter((item) => item.status === selectedStatusFilter.value);
});
const filteredDeliverableTasks = computed(() =>
  filteredTasks.value.filter((item) => item.status === "APPROVED" || item.status === "MODIFIED")
);
const filteredLearnableTasks = computed(() => filteredTasks.value.filter((item) => item.status === "DELIVERED"));
const filteredCompletableTasks = computed(() => filteredTasks.value.filter((item) => item.status === "DELIVERED"));
const taskRecommendation = computed(() => buildTaskRecommendation(filteredTasks.value));
const prioritizedTasks = computed(() => prioritizeTasks(filteredTasks.value, taskRecommendation.value?.taskId));

onLoad(async () => {
  await initialize();
});

onShow(async () => {
  if (sessionStore.accessToken && selectedChildId.value) {
    await loadTasks();
  }
});

async function initialize(): Promise<void> {
  sessionStore.loadFromStorage();
  if (!sessionStore.accessToken) {
    uni.showToast({ title: "请先登录", icon: "none" });
    uni.reLaunch({
      url: "/pages/auth/login/index"
    });
    return;
  }

  loading.value = true;
  try {
    children.value = await getChildren(sessionStore.accessToken);
    selectedChildIndex.value = 0;
    if (children.value.length > 0) {
      restoreFilters(children.value[0].id);
      await loadTasks();
    }
  } catch (error) {
    uni.showToast({ title: toErrorMessage(error), icon: "none" });
  } finally {
    loading.value = false;
  }
}

async function onChildChange(event: PickerChangeEvent): Promise<void> {
  const nextIndex = Number(event.detail.value);
  if (Number.isNaN(nextIndex) || nextIndex < 0 || nextIndex >= children.value.length) {
    return;
  }
  selectedChildIndex.value = nextIndex;
  restoreFilters(children.value[nextIndex].id);
  await loadTasks();
}

function onStatusFilterChange(event: PickerChangeEvent): void {
  const nextIndex = Number(event.detail.value);
  if (Number.isNaN(nextIndex) || nextIndex < 0 || nextIndex >= statusFilterOptions.length) {
    return;
  }
  selectedStatusFilterIndex.value = nextIndex;
  persistFilters();
}

function onDateFilterBlur(): void {
  persistFilters();
}

async function applyTodayFilter(): Promise<void> {
  dateFilter.value = formatDate(new Date());
  persistFilters();
  await loadTasks();
}

async function clearDateFilter(): Promise<void> {
  dateFilter.value = "";
  persistFilters();
  await loadTasks();
}

async function loadTasks(): Promise<void> {
  if (!sessionStore.accessToken || !selectedChildId.value) {
    return;
  }
  loading.value = true;
  try {
    tasks.value = await getChildTasks(sessionStore.accessToken, selectedChildId.value, sanitizeDate(dateFilter.value));
  } catch (error) {
    uni.showToast({ title: toErrorMessage(error), icon: "none" });
  } finally {
    loading.value = false;
  }
}

async function completeTask(pushId: string): Promise<void> {
  if (!sessionStore.accessToken) {
    return;
  }
  completingId.value = pushId;
  try {
    await postCompletePush(sessionStore.accessToken, pushId);
    uni.showToast({ title: "已完成", icon: "success" });
    await loadTasks();
  } catch (error) {
    uni.showToast({ title: toErrorMessage(error), icon: "none" });
  } finally {
    completingId.value = "";
  }
}

async function deliverTask(pushId: string): Promise<void> {
  if (!sessionStore.accessToken) {
    return;
  }
  deliveringId.value = pushId;
  try {
    await postDeliverPush(sessionStore.accessToken, pushId);
    uni.showToast({ title: "已投递", icon: "success" });
    await loadTasks();
  } catch (error) {
    uni.showToast({ title: toErrorMessage(error), icon: "none" });
  } finally {
    deliveringId.value = "";
  }
}

async function deliverFilteredTasks(): Promise<void> {
  if (!sessionStore.accessToken || filteredDeliverableTasks.value.length === 0) {
    return;
  }
  batchDelivering.value = true;
  let success = 0;
  for (const item of filteredDeliverableTasks.value) {
    try {
      await postDeliverPush(sessionStore.accessToken, item.id);
      success += 1;
    } catch {}
  }
  batchDelivering.value = false;
  uni.showToast({ title: `已投递 ${success}/${filteredDeliverableTasks.value.length}`, icon: "none" });
  await loadTasks();
}

async function completeFilteredTasks(): Promise<void> {
  if (!sessionStore.accessToken || filteredCompletableTasks.value.length === 0) {
    return;
  }
  batchCompleting.value = true;
  let success = 0;
  for (const item of filteredCompletableTasks.value) {
    try {
      await postCompletePush(sessionStore.accessToken, item.id);
      success += 1;
    } catch {}
  }
  batchCompleting.value = false;
  uni.showToast({ title: `已完成 ${success}/${filteredCompletableTasks.value.length}`, icon: "none" });
  await loadTasks();
}

async function startLearning(taskId: string): Promise<void> {
  if (!sessionStore.accessToken) {
    return;
  }
  startingTaskId.value = taskId;
  try {
    const session = await postCreateLearningSession(sessionStore.accessToken, taskId);
    uni.navigateTo({
      url: `/pages/child/session/index?sessionId=${encodeURIComponent(session.id)}&taskId=${encodeURIComponent(taskId)}`
    });
  } catch (error) {
    uni.showToast({ title: toErrorMessage(error), icon: "none" });
  } finally {
    startingTaskId.value = "";
  }
}

async function handleTaskRecommendation(): Promise<void> {
  if (!sessionStore.accessToken || !taskRecommendation.value) {
    return;
  }

  recommendedActionLoading.value = true;
  try {
    if (taskRecommendation.value.actionType === "DELIVER_AND_START") {
      await postDeliverPush(sessionStore.accessToken, taskRecommendation.value.taskId);
    }
    const session = await postCreateLearningSession(sessionStore.accessToken, taskRecommendation.value.taskId);
    uni.navigateTo({
      url: `/pages/child/session/index?sessionId=${encodeURIComponent(session.id)}&taskId=${encodeURIComponent(
        taskRecommendation.value.taskId
      )}`
    });
  } catch (error) {
    uni.showToast({ title: toErrorMessage(error), icon: "none" });
  } finally {
    recommendedActionLoading.value = false;
  }
}

function restoreFilters(childId: string): void {
  const raw = uni.getStorageSync(`${FILTER_STORAGE_PREFIX}${childId}`) as
    | { dateFilter?: string; statusFilter?: StatusFilter }
    | null
    | undefined;
  if (!raw) {
    dateFilter.value = "";
    selectedStatusFilterIndex.value = 0;
    return;
  }

  dateFilter.value = typeof raw.dateFilter === "string" ? raw.dateFilter : "";
  const statusIndex = statusFilterOptions.indexOf(raw.statusFilter ?? "ALL");
  selectedStatusFilterIndex.value = statusIndex >= 0 ? statusIndex : 0;
}

function persistFilters(): void {
  if (!selectedChildId.value) {
    return;
  }
  uni.setStorageSync(`${FILTER_STORAGE_PREFIX}${selectedChildId.value}`, {
    dateFilter: dateFilter.value,
    statusFilter: selectedStatusFilter.value
  });
}

function sanitizeDate(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed || !/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return undefined;
  }
  return trimmed;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTime(value: string): string {
  return value.replace("T", " ").replace(".000Z", "Z");
}

function formatStatus(value: ChildTask["status"]): string {
  switch (value) {
    case "APPROVED":
      return "已通过";
    case "MODIFIED":
      return "已修改";
    case "DELIVERED":
      return "已投递";
    case "COMPLETED":
      return "已完成";
    default:
      return value;
  }
}

function getTaskInsight(task: ChildTask) {
  return buildTaskInsight(task.content);
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "请求失败";
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

.empty {
  margin-top: 24rpx;
  color: #666;
}

.panel {
  margin-top: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.label {
  font-size: 28rpx;
  color: #222;
}

.picker-value,
.input {
  min-height: 72rpx;
  border: 1rpx solid #d5d9e2;
  border-radius: 10rpx;
  padding: 16rpx 18rpx;
  background: #fff;
  font-size: 26rpx;
  box-sizing: border-box;
}

.summary {
  display: flex;
  flex-wrap: wrap;
  gap: 18rpx;
  color: #667085;
  font-size: 24rpx;
}

.recommend-card {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  padding: 20rpx;
  border-radius: 14rpx;
  background: #ecfeff;
  border: 1rpx solid #a5f3fc;
}

.quick-row,
.actions {
  display: flex;
  gap: 12rpx;
  flex-wrap: wrap;
}

.task-card {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  padding: 20rpx;
  border-radius: 14rpx;
  background: #fff;
  border: 1rpx solid #e5e7eb;
}

.task-card--recommended {
  border-color: #22c55e;
  box-shadow: 0 0 0 2rpx rgba(34, 197, 94, 0.12);
}

.recommend-badge {
  align-self: flex-start;
  padding: 6rpx 12rpx;
  border-radius: 999rpx;
  background: #dcfce7;
  color: #166534;
  font-size: 22rpx;
}

.task-insight {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  padding: 16rpx;
  border-radius: 12rpx;
  background: #f8fafc;
}

.task-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #111827;
}

.line {
  color: #4b5563;
  font-size: 24rpx;
}
</style>
