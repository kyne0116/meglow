<template>
  <view class="container">
    <view class="title">Learning Settings</view>

    <view v-if="children.length === 0" class="empty">No child found. Please create a child first.</view>

    <view v-else class="panel">
      <view class="field">
        <text class="label">Child</text>
        <picker :range="childNames" :value="selectedChildIndex" @change="onChildChange">
          <view class="picker-value">{{ childNames[selectedChildIndex] }}</view>
        </picker>
      </view>

      <view class="field switch-field">
        <text class="label">Auto Approve</text>
        <switch :checked="autoApprove" @change="onAutoApproveChange" />
      </view>

      <view class="field">
        <text class="label">Words Per Session (1-50)</text>
        <input v-model="wordsPerSessionInput" class="input" type="number" />
      </view>

      <view class="field">
        <text class="label">Daily Duration Minutes (5-240)</text>
        <input v-model="dailyDurationInput" class="input" type="number" />
      </view>

      <view class="field">
        <text class="label">Weekday Window (HH:mm)</text>
        <view class="row">
          <input v-model="weekdayStart" class="input half" placeholder="start e.g. 18:30" />
          <input v-model="weekdayEnd" class="input half" placeholder="end e.g. 20:00" />
        </view>
      </view>

      <view class="field">
        <text class="label">Weekend Window (HH:mm)</text>
        <view class="row">
          <input v-model="weekendStart" class="input half" placeholder="start e.g. 09:00" />
          <input v-model="weekendEnd" class="input half" placeholder="end e.g. 10:30" />
        </view>
      </view>

      <button class="save-btn" type="primary" :loading="saving || loading" @tap="saveSettings">Save Settings</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from "@dcloudio/uni-app";
import { computed, ref } from "vue";
import {
  ChildSummary,
  getChildren,
  getChildSettings,
  putChildSettings,
  TimeWindow,
  UpsertChildLearningSettingsRequest
} from "../../../../services/api";
import { useSessionStore } from "../../../../stores/session";

interface PickerChangeEvent {
  detail: {
    value: string;
  };
}

interface SwitchChangeEvent {
  detail: {
    value: boolean;
  };
}

const sessionStore = useSessionStore();

const loading = ref(false);
const saving = ref(false);
const children = ref<ChildSummary[]>([]);
const selectedChildIndex = ref(0);

const autoApprove = ref(false);
const wordsPerSessionInput = ref("10");
const dailyDurationInput = ref("20");
const weekdayStart = ref("");
const weekdayEnd = ref("");
const weekendStart = ref("");
const weekendEnd = ref("");

const childNames = computed(() => children.value.map((item) => `${item.name} (Grade ${item.grade})`));
const selectedChildId = computed(() => children.value[selectedChildIndex.value]?.id ?? "");

onLoad(async () => {
  await initialize();
});

async function initialize(): Promise<void> {
  sessionStore.loadFromStorage();
  const token = sessionStore.accessToken;
  if (!token) {
    uni.showToast({ title: "Please login first", icon: "none" });
    uni.reLaunch({
      url: "/pages/auth/login/index"
    });
    return;
  }

  loading.value = true;
  try {
    children.value = await getChildren(token);
    selectedChildIndex.value = 0;
    if (children.value.length > 0) {
      await loadSettings(children.value[0].id);
    }
  } catch (error) {
    uni.showToast({ title: toErrorMessage(error), icon: "none" });
  } finally {
    loading.value = false;
  }
}

async function loadSettings(childId: string): Promise<void> {
  const token = sessionStore.accessToken;
  if (!token) {
    return;
  }

  const settings = await getChildSettings(token, childId);
  autoApprove.value = settings.autoApprove;
  wordsPerSessionInput.value = String(settings.wordsPerSession);
  dailyDurationInput.value = String(settings.dailyDurationMin);

  const weekday = settings.weekdayTimeWindows[0];
  const weekend = settings.weekendTimeWindows[0];
  weekdayStart.value = weekday?.start ?? "";
  weekdayEnd.value = weekday?.end ?? "";
  weekendStart.value = weekend?.start ?? "";
  weekendEnd.value = weekend?.end ?? "";
}

async function onChildChange(event: PickerChangeEvent): Promise<void> {
  const nextIndex = Number(event.detail.value);
  if (Number.isNaN(nextIndex) || nextIndex < 0 || nextIndex >= children.value.length) {
    return;
  }
  selectedChildIndex.value = nextIndex;
  loading.value = true;
  try {
    await loadSettings(children.value[nextIndex].id);
  } catch (error) {
    uni.showToast({ title: toErrorMessage(error), icon: "none" });
  } finally {
    loading.value = false;
  }
}

function onAutoApproveChange(event: SwitchChangeEvent): void {
  autoApprove.value = Boolean(event.detail.value);
}

async function saveSettings(): Promise<void> {
  const token = sessionStore.accessToken;
  if (!token) {
    uni.showToast({ title: "Please login first", icon: "none" });
    return;
  }

  if (!selectedChildId.value) {
    uni.showToast({ title: "No child selected", icon: "none" });
    return;
  }

  const wordsPerSession = Number(wordsPerSessionInput.value);
  const dailyDurationMin = Number(dailyDurationInput.value);
  if (!Number.isInteger(wordsPerSession) || wordsPerSession < 1 || wordsPerSession > 50) {
    uni.showToast({ title: "Words per session must be 1-50", icon: "none" });
    return;
  }
  if (!Number.isInteger(dailyDurationMin) || dailyDurationMin < 5 || dailyDurationMin > 240) {
    uni.showToast({ title: "Daily duration must be 5-240", icon: "none" });
    return;
  }

  const weekdayWindows = buildTimeWindows(weekdayStart.value, weekdayEnd.value);
  if (weekdayWindows === null) {
    uni.showToast({ title: "Invalid weekday time window", icon: "none" });
    return;
  }
  const weekendWindows = buildTimeWindows(weekendStart.value, weekendEnd.value);
  if (weekendWindows === null) {
    uni.showToast({ title: "Invalid weekend time window", icon: "none" });
    return;
  }

  const payload: UpsertChildLearningSettingsRequest = {
    autoApprove: autoApprove.value,
    wordsPerSession,
    dailyDurationMin,
    weekdayTimeWindows: weekdayWindows,
    weekendTimeWindows: weekendWindows
  };

  saving.value = true;
  try {
    await putChildSettings(token, selectedChildId.value, payload);
    uni.showToast({ title: "Saved", icon: "success" });
  } catch (error) {
    uni.showToast({ title: toErrorMessage(error), icon: "none" });
  } finally {
    saving.value = false;
  }
}

function buildTimeWindows(start: string, end: string): TimeWindow[] | null {
  const trimmedStart = start.trim();
  const trimmedEnd = end.trim();
  if (!trimmedStart && !trimmedEnd) {
    return [];
  }
  if (!isValidTime(trimmedStart) || !isValidTime(trimmedEnd)) {
    return null;
  }
  if (trimmedStart === trimmedEnd) {
    return null;
  }
  return [{ start: trimmedStart, end: trimmedEnd }];
}

function isValidTime(value: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
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

.switch-field {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
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

.row {
  display: flex;
  gap: 12rpx;
}

.half {
  flex: 1;
}

.save-btn {
  margin-top: 8rpx;
}
</style>
