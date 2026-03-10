<template>
  <view class="container">
    <view class="title">Pending Push Center</view>
    <button class="refresh-btn" :loading="loading" @tap="loadPending">Refresh</button>

    <view v-if="pending.length === 0 && !loading" class="empty">No pending pushes.</view>

    <view v-for="item in pending" :key="item.id" class="card">
      <view class="card-title">{{ item.childName }}: {{ item.summary }}</view>
      <view class="line">Reason: {{ item.reason }}</view>
      <view class="line">Expected: {{ item.expectedOutcome }}</view>
      <view class="line">Scheduled: {{ formatTime(item.scheduledAt) }}</view>

      <view class="actions">
        <button size="mini" type="primary" :loading="approvingId === item.id" @tap="approve(item.id)">Approve</button>
        <button size="mini" :loading="approvingId === item.id" @tap="startModify(item)">Modify</button>
        <button size="mini" :loading="approvingId === item.id" @tap="postpone(item.id)">Postpone 1h</button>
        <button size="mini" :loading="approvingId === item.id" class="reject" @tap="reject(item.id)">Reject</button>
      </view>

      <view v-if="editingPushId === item.id" class="modify-panel">
        <view class="panel-title">Modify Push</view>

        <view class="field">
          <text class="label">Adjustment Mode</text>
          <picker :range="adjustmentModeOptions" :value="selectedAdjustmentModeIndex" @change="onAdjustmentModeChange">
            <view class="input">{{ adjustmentModeOptions[selectedAdjustmentModeIndex] }}</view>
          </picker>
        </view>

        <view class="field">
          <text class="label">Words Limit (optional, 1-50)</text>
          <input v-model="wordsLimitInput" class="input" type="number" placeholder="e.g. 8" />
        </view>

        <view class="field">
          <text class="label">Comment</text>
          <textarea v-model="modifyComment" class="textarea" placeholder="describe why this task is modified" />
        </view>

        <view class="field">
          <text class="label">Original Content JSON</text>
          <textarea :value="originalContentJson" class="textarea preview" disabled />
        </view>

        <view class="field">
          <text class="label">Modified Content JSON</text>
          <textarea v-model="modifiedContentJson" class="textarea" />
          <view v-if="modifiedContentError" class="error-text">{{ modifiedContentError }}</view>
        </view>

        <view class="field">
          <text class="label">Structured Fields (JSON Linked)</text>
          <input v-model="structuredModeInput" class="input" placeholder="mode, e.g. word_review" />
          <input v-model="structuredDueWordsInput" class="input" type="number" placeholder="dueWords, e.g. 10" />
          <input
            v-model="structuredWordsCsv"
            class="input"
            placeholder="words CSV, e.g. apple,banana,orange"
          />
          <input v-model="structuredCoachHintInput" class="input" placeholder="coachHint, optional" />
          <input v-model="structuredPriorityInput" class="input" placeholder="priority, optional" />
        </view>

        <view class="field">
          <text class="label">Final Payload Preview</text>
          <textarea :value="modifyPreviewText" class="textarea preview" disabled />
        </view>

        <view class="panel-actions">
          <button size="mini" @tap="applyStructuredFieldsToJson">Apply Fields To JSON</button>
          <button size="mini" @tap="loadStructuredFieldsFromJson">Load Fields From JSON</button>
          <button size="mini" @tap="resetContentToOriginal">Reset Content</button>
          <button size="mini" @tap="cancelModify">Cancel</button>
          <button size="mini" type="primary" :loading="approvingId === item.id" @tap="submitModify(item.id)">
            Submit Modify
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad, onShow } from "@dcloudio/uni-app";
import { computed, ref } from "vue";
import { ApprovePushRequest, getPendingPushes, PendingPush, postApprovePush } from "../../../services/api";
import { useSessionStore } from "../../../stores/session";

interface PickerChangeEvent {
  detail: {
    value: string;
  };
}

const sessionStore = useSessionStore();
const loading = ref(false);
const approvingId = ref("");
const pending = ref<PendingPush[]>([]);

const editingPushId = ref("");
const adjustmentModeOptions = ["lite_review_mode", "normal_review_mode", "focus_pronunciation_mode"];
const selectedAdjustmentModeIndex = ref(0);
const wordsLimitInput = ref("");
const modifyComment = ref("modified in parent miniapp");
const originalContentJson = ref("{}");
const modifiedContentJson = ref("{}");
const structuredModeInput = ref("");
const structuredDueWordsInput = ref("");
const structuredWordsCsv = ref("");
const structuredCoachHintInput = ref("");
const structuredPriorityInput = ref("");

const modifiedContentError = computed(() => validateJsonObject(modifiedContentJson.value));
const modifyPreviewText = computed(() => {
  const wordsLimit = wordsLimitInput.value.trim() ? Number(wordsLimitInput.value.trim()) : undefined;
  const normalizedWordsLimit = Number.isInteger(wordsLimit) ? wordsLimit : undefined;
  const parsed = safeParseJsonObject(modifiedContentJson.value);
  if (!parsed.ok) {
    return `Invalid modified JSON: ${parsed.error}`;
  }
  return JSON.stringify(buildModifyContent(parsed.value, normalizedWordsLimit), null, 2);
});

onLoad(async () => {
  await ensureSessionAndLoad();
});

onShow(async () => {
  if (sessionStore.accessToken) {
    await loadPending();
  }
});

async function ensureSessionAndLoad(): Promise<void> {
  sessionStore.loadFromStorage();
  if (!sessionStore.accessToken) {
    uni.showToast({ title: "Please login first", icon: "none" });
    uni.reLaunch({
      url: "/pages/auth/login/index"
    });
    return;
  }
  await loadPending();
}

async function loadPending(): Promise<void> {
  if (!sessionStore.accessToken) {
    return;
  }
  loading.value = true;
  try {
    pending.value = await getPendingPushes(sessionStore.accessToken);
    if (pending.value.every((item) => item.id !== editingPushId.value)) {
      cancelModify();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "load failed";
    uni.showToast({ title: message, icon: "none" });
  } finally {
    loading.value = false;
  }
}

async function approve(pushId: string): Promise<void> {
  await applyAction(pushId, {
    action: "APPROVE",
    comment: "approved in parent miniapp"
  });
}

async function reject(pushId: string): Promise<void> {
  await applyAction(pushId, {
    action: "REJECT",
    comment: "rejected in parent miniapp"
  });
}

async function postpone(pushId: string): Promise<void> {
  const postponedUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  await applyAction(pushId, {
    action: "POSTPONE",
    postponedUntil,
    comment: "postponed for one hour in parent miniapp"
  });
}

function startModify(item: PendingPush): void {
  editingPushId.value = item.id;
  selectedAdjustmentModeIndex.value = 0;
  wordsLimitInput.value = "";
  modifyComment.value = "modified in parent miniapp";
  const base = normalizeContent(item.content);
  const baseText = JSON.stringify(base, null, 2);
  originalContentJson.value = baseText;
  modifiedContentJson.value = baseText;
  hydrateStructuredFields(base);
}

function resetContentToOriginal(): void {
  modifiedContentJson.value = originalContentJson.value;
  const parsed = safeParseJsonObject(originalContentJson.value);
  if (parsed.ok) {
    hydrateStructuredFields(parsed.value);
  }
}

function cancelModify(): void {
  editingPushId.value = "";
  selectedAdjustmentModeIndex.value = 0;
  wordsLimitInput.value = "";
  modifyComment.value = "modified in parent miniapp";
  originalContentJson.value = "{}";
  modifiedContentJson.value = "{}";
  clearStructuredFields();
}

function onAdjustmentModeChange(event: PickerChangeEvent): void {
  const nextIndex = Number(event.detail.value);
  if (Number.isNaN(nextIndex) || nextIndex < 0 || nextIndex >= adjustmentModeOptions.length) {
    return;
  }
  selectedAdjustmentModeIndex.value = nextIndex;
}

async function submitModify(pushId: string): Promise<void> {
  const wordsLimit = wordsLimitInput.value.trim() ? Number(wordsLimitInput.value.trim()) : undefined;
  if (wordsLimit !== undefined && (!Number.isInteger(wordsLimit) || wordsLimit < 1 || wordsLimit > 50)) {
    uni.showToast({ title: "Words limit must be 1-50", icon: "none" });
    return;
  }

  const parsed = safeParseJsonObject(modifiedContentJson.value);
  if (!parsed.ok) {
    uni.showToast({ title: `Invalid modified JSON: ${parsed.error}`, icon: "none" });
    return;
  }

  const payload: ApprovePushRequest = {
    action: "MODIFY",
    comment: modifyComment.value.trim() || "modified in parent miniapp",
    modifiedContent: buildModifyContent(parsed.value, wordsLimit)
  };
  await applyAction(pushId, payload);
}

function applyStructuredFieldsToJson(): void {
  const parsed = safeParseJsonObject(modifiedContentJson.value);
  if (!parsed.ok) {
    uni.showToast({ title: `Invalid JSON: ${parsed.error}`, icon: "none" });
    return;
  }

  const next: Record<string, unknown> = { ...parsed.value };
  const mode = structuredModeInput.value.trim();
  if (mode) {
    next.mode = mode;
  }

  const dueWords = structuredDueWordsInput.value.trim() ? Number(structuredDueWordsInput.value.trim()) : undefined;
  if (dueWords !== undefined) {
    if (!Number.isInteger(dueWords) || dueWords < 0) {
      uni.showToast({ title: "dueWords must be >= 0", icon: "none" });
      return;
    }
    next.dueWords = dueWords;
  }

  const words = parseWordsCsv(structuredWordsCsv.value);
  if (words.length > 0) {
    next.words = words.map((value) => ({ value }));
    next.dueWords = words.length;
  }

  const coachHint = structuredCoachHintInput.value.trim();
  if (coachHint) {
    next.coachHint = coachHint;
  }

  const priority = structuredPriorityInput.value.trim();
  if (priority) {
    next.priority = priority;
  }

  modifiedContentJson.value = JSON.stringify(next, null, 2);
}

function loadStructuredFieldsFromJson(): void {
  const parsed = safeParseJsonObject(modifiedContentJson.value);
  if (!parsed.ok) {
    uni.showToast({ title: `Invalid JSON: ${parsed.error}`, icon: "none" });
    return;
  }
  hydrateStructuredFields(parsed.value);
}

function normalizeContent(content: unknown): Record<string, unknown> {
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    return {};
  }
  return content as Record<string, unknown>;
}

function buildModifyContent(baseContent: Record<string, unknown>, wordsLimit: number | undefined): Record<string, unknown> {
  const coachHint = structuredCoachHintInput.value.trim();
  const priority = structuredPriorityInput.value.trim();
  return {
    ...baseContent,
    parentMeta: {
      adjusted: true,
      adjustment: adjustmentModeOptions[selectedAdjustmentModeIndex.value],
      wordsPerSessionLimit: wordsLimit,
      source: "miniapp_parent_modify",
      coachHint: coachHint || undefined,
      priority: priority || undefined
    }
  };
}

function hydrateStructuredFields(content: Record<string, unknown>): void {
  structuredModeInput.value = typeof content.mode === "string" ? content.mode : "";
  const dueWords = typeof content.dueWords === "number" ? content.dueWords : undefined;
  structuredDueWordsInput.value = dueWords !== undefined ? String(dueWords) : "";
  structuredWordsCsv.value = extractWordsCsv(content.words);
  structuredCoachHintInput.value =
    typeof content.coachHint === "string"
      ? content.coachHint
      : getNestedString(content, "parentMeta", "coachHint") ?? "";
  structuredPriorityInput.value =
    typeof content.priority === "string"
      ? content.priority
      : getNestedString(content, "parentMeta", "priority") ?? "";
}

function clearStructuredFields(): void {
  structuredModeInput.value = "";
  structuredDueWordsInput.value = "";
  structuredWordsCsv.value = "";
  structuredCoachHintInput.value = "";
  structuredPriorityInput.value = "";
}

function parseWordsCsv(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function extractWordsCsv(raw: unknown): string {
  if (!Array.isArray(raw)) {
    return "";
  }

  const values: string[] = [];
  for (const item of raw) {
    if (typeof item === "string") {
      values.push(item);
      continue;
    }
    if (item && typeof item === "object") {
      const candidate = item as { value?: unknown };
      if (typeof candidate.value === "string") {
        values.push(candidate.value);
      }
    }
  }
  return values.join(",");
}

function getNestedString(content: Record<string, unknown>, field: string, key: string): string | undefined {
  const nested = content[field];
  if (!nested || typeof nested !== "object" || Array.isArray(nested)) {
    return undefined;
  }
  const nestedValue = (nested as Record<string, unknown>)[key];
  return typeof nestedValue === "string" ? nestedValue : undefined;
}

function validateJsonObject(text: string): string {
  const parsed = safeParseJsonObject(text);
  return parsed.ok ? "" : `Invalid JSON object: ${parsed.error}`;
}

function safeParseJsonObject(text: string): { ok: true; value: Record<string, unknown> } | { ok: false; error: string } {
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: true, value: {} };
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ok: false, error: "must be a JSON object" };
    }
    return { ok: true, value: parsed as Record<string, unknown> };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "invalid JSON"
    };
  }
}

async function applyAction(pushId: string, payload: ApprovePushRequest): Promise<void> {
  if (!sessionStore.accessToken) {
    return;
  }
  approvingId.value = pushId;
  try {
    await postApprovePush(sessionStore.accessToken, pushId, payload);
    uni.showToast({ title: "Updated", icon: "success" });
    cancelModify();
    await loadPending();
  } catch (error) {
    const message = error instanceof Error ? error.message : "update failed";
    uni.showToast({ title: message, icon: "none" });
  } finally {
    approvingId.value = "";
  }
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(
    date.getMinutes()
  )}`;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
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

.refresh-btn {
  margin-top: 18rpx;
}

.empty {
  margin-top: 28rpx;
  color: #666;
}

.card {
  margin-top: 20rpx;
  padding: 18rpx;
  border-radius: 12rpx;
  background: #fff;
  border: 1rpx solid #e5e7eb;
}

.card-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #111827;
}

.line {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #4b5563;
}

.actions {
  margin-top: 14rpx;
  display: flex;
  gap: 10rpx;
}

.reject {
  color: #c53030;
}

.modify-panel {
  margin-top: 16rpx;
  padding: 14rpx;
  border: 1rpx dashed #cbd5e1;
  border-radius: 10rpx;
  background: #f8fafc;
}

.panel-title {
  font-size: 26rpx;
  font-weight: 600;
  color: #0f172a;
}

.field {
  margin-top: 12rpx;
}

.label {
  display: block;
  margin-bottom: 8rpx;
  color: #334155;
  font-size: 24rpx;
}

.input {
  min-height: 68rpx;
  border: 1rpx solid #d5d9e2;
  border-radius: 8rpx;
  padding: 12rpx 14rpx;
  background: #fff;
  font-size: 24rpx;
  box-sizing: border-box;
}

.textarea {
  width: 100%;
  min-height: 120rpx;
  border: 1rpx solid #d5d9e2;
  border-radius: 8rpx;
  padding: 12rpx 14rpx;
  background: #fff;
  font-size: 24rpx;
  box-sizing: border-box;
}

.preview {
  color: #0f172a;
  background: #f1f5f9;
}

.error-text {
  margin-top: 6rpx;
  color: #b91c1c;
  font-size: 22rpx;
}

.panel-actions {
  margin-top: 12rpx;
  display: flex;
  gap: 10rpx;
}
</style>
