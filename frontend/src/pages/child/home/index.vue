<template>
  <view class="container">
    <view class="title">Child Task Board</view>

    <view v-if="children.length === 0 && !loading" class="empty">No child found. Please create child data first.</view>

    <view v-else class="panel">
      <view class="field">
        <text class="label">Child</text>
        <picker :range="childNames" :value="selectedChildIndex" @change="onChildChange">
          <view class="picker-value">{{ childNames[selectedChildIndex] }}</view>
        </picker>
      </view>

      <view class="field">
        <text class="label">Date Filter (YYYY-MM-DD, optional)</text>
        <input v-model="dateFilter" class="input" placeholder="e.g. 2026-03-11" @blur="onDateFilterBlur" />
      </view>

      <view class="quick-row">
        <button size="mini" @tap="applyTodayFilter">Today</button>
        <button size="mini" @tap="clearDateFilter">Clear Date</button>
      </view>

      <view class="field">
        <text class="label">Status Filter</text>
        <picker :range="statusFilterOptions" :value="selectedStatusFilterIndex" @change="onStatusFilterChange">
          <view class="picker-value">{{ statusFilterOptions[selectedStatusFilterIndex] }}</view>
        </picker>
      </view>

      <button class="refresh-btn" :loading="loading" @tap="loadTasks">Refresh Tasks</button>

      <view class="summary">
        <text>Total: {{ tasks.length }}</text>
        <text>Filtered: {{ filteredTasks.length }}</text>
        <text>Deliverable: {{ filteredDeliverableTasks.length }}</text>
        <text>Learnable: {{ filteredLearnableTasks.length }}</text>
        <text>Completable: {{ filteredCompletableTasks.length }}</text>
      </view>

      <view class="quick-row">
        <button
          size="mini"
          :disabled="filteredDeliverableTasks.length === 0 || batchDelivering"
          :loading="batchDelivering"
          @tap="deliverFilteredTasks"
        >
          Deliver Filtered
        </button>
        <button
          size="mini"
          type="primary"
          :disabled="filteredCompletableTasks.length === 0 || batchCompleting"
          :loading="batchCompleting"
          @tap="completeFilteredTasks"
        >
          Complete Filtered
        </button>
      </view>

      <view v-if="filteredTasks.length === 0 && !loading" class="empty">No tasks for selected filters.</view>

      <view v-for="item in filteredTasks" :key="item.id" class="task-card">
        <view class="task-title">{{ item.summary }}</view>
        <view class="line">Status: {{ item.status }}</view>
        <view class="line">Scheduled: {{ formatTime(item.scheduledAt) }}</view>

        <view class="actions">
          <button
            v-if="item.status === 'APPROVED' || item.status === 'MODIFIED'"
            size="mini"
            :loading="deliveringId === item.id"
            @tap="deliverTask(item.id)"
          >
            Mark Delivered
          </button>
          <button
            v-if="item.status === 'DELIVERED'"
            size="mini"
            type="primary"
            :loading="startingTaskId === item.id"
            @tap="startLearning(item.id)"
          >
            Start Learning
          </button>
          <button
            v-if="item.status === 'DELIVERED'"
            size="mini"
            :loading="completingId === item.id"
            @tap="completeTask(item.id)"
          >
            Mark Completed
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
const children = ref<ChildSummary[]>([]);
const selectedChildIndex = ref(0);
const tasks = ref<ChildTask[]>([]);
const dateFilter = ref("");

const statusFilterOptions: StatusFilter[] = ["ALL", "APPROVED", "MODIFIED", "DELIVERED", "COMPLETED"];
const selectedStatusFilterIndex = ref(0);

const childNames = computed(() => children.value.map((item) => `${item.name} (Grade ${item.grade})`));
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
    uni.showToast({ title: "Please login first", icon: "none" });
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
    uni.showToast({ title: "Completed", icon: "success" });
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
    uni.showToast({ title: "Delivered", icon: "success" });
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
  uni.showToast({ title: `Delivered ${success}/${filteredDeliverableTasks.value.length}`, icon: "none" });
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
  uni.showToast({ title: `Completed ${success}/${filteredCompletableTasks.value.length}`, icon: "none" });
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

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "request failed";
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
