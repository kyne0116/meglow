<template>
  <view class="container">
    <view class="title">待审批推送</view>
    <button class="refresh-btn" :loading="loading" @tap="loadPending">刷新</button>

    <view v-if="pending.length === 0 && !loading" class="empty">当前没有待审批推送。</view>

    <view v-else-if="approvalRecommendation" class="card recommend-card">
      <view class="card-title">{{ approvalRecommendation.title }}</view>
      <view class="line">{{ approvalRecommendation.description }}</view>
      <button
        size="mini"
        type="primary"
        :loading="approvingId === approvalRecommendation.pushId"
        @tap="handleApprovalRecommendation"
      >
        {{ approvalRecommendation.actionLabel }}
      </button>
    </view>

    <view v-for="item in pending" :key="item.id" class="card">
      <view class="card-title">{{ item.childName }}: {{ item.summary }}</view>
      <view class="line">原因：{{ item.reason }}</view>
      <view class="line">预期结果：{{ item.expectedOutcome }}</view>
      <view class="line">计划时间：{{ formatTime(item.scheduledAt) }}</view>

      <view v-if="getApprovalInsight(item)" class="line">
        类型：{{ getApprovalInsight(item)?.modeLabel }}
      </view>
      <view v-if="getApprovalInsight(item)?.focusReviewSummary" class="line">
        {{ getApprovalInsight(item)?.focusReviewSummary }}
      </view>
      <view v-if="getApprovalInsight(item)?.coachHint" class="line">
        学习提示：{{ getApprovalInsight(item)?.coachHint }}
      </view>

      <view class="actions">
        <button size="mini" type="primary" :loading="approvingId === item.id" @tap="approve(item.id)">通过</button>
        <button size="mini" :loading="approvingId === item.id" @tap="startModify(item)">修改</button>
        <button size="mini" :loading="approvingId === item.id" @tap="postpone(item.id)">延后 1 小时</button>
        <button size="mini" :loading="approvingId === item.id" class="reject" @tap="reject(item.id)">拒绝</button>
      </view>

      <view v-if="editingPushId === item.id" class="modify-panel">
        <view class="panel-title">修改推送</view>

        <view v-if="currentAdjustmentPresets.length" class="preset-row">
          <button
            v-for="preset in currentAdjustmentPresets"
            :key="preset.id"
            size="mini"
            @tap="applyAdjustmentPreset(preset)"
          >
            套用：{{ preset.label }}
          </button>
        </view>

        <view class="field">
          <text class="label">调整模式</text>
          <picker :range="adjustmentModeLabels" :value="selectedAdjustmentModeIndex" @change="onAdjustmentModeChange">
            <view class="input">{{ adjustmentModeLabels[selectedAdjustmentModeIndex] }}</view>
          </picker>
        </view>

        <view class="field">
          <text class="label">单次单词上限（可选，1-50）</text>
          <input v-model="wordsLimitInput" class="input" type="number" placeholder="例如：8" />
        </view>

        <view class="field">
          <text class="label">备注</text>
          <textarea v-model="modifyComment" class="textarea" placeholder="请说明为什么要修改这条任务" />
        </view>

        <view class="field">
          <text class="label">原始内容 JSON</text>
          <textarea :value="originalContentJson" class="textarea preview" disabled />
        </view>

        <view class="field">
          <text class="label">修改后内容 JSON</text>
          <textarea v-model="modifiedContentJson" class="textarea" />
          <view v-if="modifiedContentError" class="error-text">{{ modifiedContentError }}</view>
        </view>

        <view class="field">
          <text class="label">结构化字段（与 JSON 联动）</text>
          <input v-model="structuredModeInput" class="input" placeholder="mode，例如：word_review" />
          <input v-model="structuredDueWordsInput" class="input" type="number" placeholder="dueWords，例如：10" />
          <input
            v-model="structuredWordsCsv"
            class="input"
            placeholder="words CSV，例如：apple,banana,orange"
          />
          <input v-model="structuredCoachHintInput" class="input" placeholder="coachHint，可选" />
          <input v-model="structuredPriorityInput" class="input" placeholder="priority，可选" />
        </view>

        <view class="field">
          <text class="label">最终请求预览</text>
          <textarea :value="modifyPreviewText" class="textarea preview" disabled />
        </view>

        <view class="panel-actions">
          <button size="mini" @tap="applyStructuredFieldsToJson">应用字段到 JSON</button>
          <button size="mini" @tap="loadStructuredFieldsFromJson">从 JSON 读取字段</button>
          <button size="mini" @tap="resetContentToOriginal">重置内容</button>
          <button size="mini" @tap="cancelModify">取消</button>
          <button size="mini" type="primary" :loading="approvingId === item.id" @tap="submitModify(item.id)">
            提交修改
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
import { ApprovalAdjustmentPreset, buildApprovalAdjustmentPresets } from "./approval-adjustments";
import { buildApprovalInsight } from "./approval-insights";
import { buildApprovalRecommendation } from "./approval-recommendation";

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
const currentAdjustmentPresets = ref<ApprovalAdjustmentPreset[]>([]);
const adjustmentModeOptions = ["lite_review_mode", "normal_review_mode", "focus_pronunciation_mode"] as const;
const adjustmentModeLabels = ["轻量复习", "标准复习", "强化发音"];
const selectedAdjustmentModeIndex = ref(0);
const wordsLimitInput = ref("");
const modifyComment = ref("在家长小程序中修改");
const originalContentJson = ref("{}");
const modifiedContentJson = ref("{}");
const structuredModeInput = ref("");
const structuredDueWordsInput = ref("");
const structuredWordsCsv = ref("");
const structuredCoachHintInput = ref("");
const structuredPriorityInput = ref("");
const approvalRecommendation = computed(() => buildApprovalRecommendation(pending.value));

const modifiedContentError = computed(() => validateJsonObject(modifiedContentJson.value));
const modifyPreviewText = computed(() => {
  const wordsLimit = wordsLimitInput.value.trim() ? Number(wordsLimitInput.value.trim()) : undefined;
  const normalizedWordsLimit = Number.isInteger(wordsLimit) ? wordsLimit : undefined;
  const parsed = safeParseJsonObject(modifiedContentJson.value);
  if (!parsed.ok) {
    return `修改后 JSON 无效：${parsed.error}`;
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
    uni.showToast({ title: "请先登录", icon: "none" });
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
    const message = error instanceof Error ? error.message : "加载失败";
    uni.showToast({ title: message, icon: "none" });
  } finally {
    loading.value = false;
  }
}

async function approve(pushId: string): Promise<void> {
  await applyAction(pushId, {
    action: "APPROVE",
    comment: "在家长小程序中通过"
  });
}

async function reject(pushId: string): Promise<void> {
  await applyAction(pushId, {
    action: "REJECT",
    comment: "在家长小程序中拒绝"
  });
}

async function postpone(pushId: string): Promise<void> {
  const postponedUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  await applyAction(pushId, {
    action: "POSTPONE",
    postponedUntil,
    comment: "在家长小程序中延后 1 小时"
  });
}

function startModify(item: PendingPush): void {
  editingPushId.value = item.id;
  selectedAdjustmentModeIndex.value = 0;
  wordsLimitInput.value = "";
  modifyComment.value = "在家长小程序中修改";
  const base = normalizeContent(item.content);
  const baseText = JSON.stringify(base, null, 2);
  originalContentJson.value = baseText;
  modifiedContentJson.value = baseText;
  currentAdjustmentPresets.value = buildApprovalAdjustmentPresets(base);
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
  modifyComment.value = "在家长小程序中修改";
  originalContentJson.value = "{}";
  modifiedContentJson.value = "{}";
  currentAdjustmentPresets.value = [];
  clearStructuredFields();
}

function onAdjustmentModeChange(event: PickerChangeEvent): void {
  const nextIndex = Number(event.detail.value);
  if (Number.isNaN(nextIndex) || nextIndex < 0 || nextIndex >= adjustmentModeOptions.length) {
    return;
  }
  selectedAdjustmentModeIndex.value = nextIndex;
}

function getApprovalInsight(item: PendingPush) {
  return buildApprovalInsight(item.content);
}

function handleApprovalRecommendation(): void {
  if (!approvalRecommendation.value) {
    return;
  }
  const target = pending.value.find((item) => item.id === approvalRecommendation.value?.pushId);
  if (!target) {
    return;
  }

  if (approvalRecommendation.value.actionType === "OPEN_MODIFY") {
    startModify(target);
    return;
  }

  void approve(target.id);
}

function applyAdjustmentPreset(preset: ApprovalAdjustmentPreset): void {
  modifiedContentJson.value = originalContentJson.value;
  const adjustmentIndex = adjustmentModeOptions.indexOf(preset.adjustmentMode);
  selectedAdjustmentModeIndex.value = adjustmentIndex >= 0 ? adjustmentIndex : 0;
  structuredModeInput.value = preset.mode;
  structuredWordsCsv.value = preset.words.join(",");
  structuredDueWordsInput.value = String(preset.words.length);
  structuredCoachHintInput.value = preset.coachHint;
  structuredPriorityInput.value = preset.priority;
  wordsLimitInput.value = String(preset.wordsLimit);
  applyStructuredFieldsToJson();
}

async function submitModify(pushId: string): Promise<void> {
  const wordsLimit = wordsLimitInput.value.trim() ? Number(wordsLimitInput.value.trim()) : undefined;
  if (wordsLimit !== undefined && (!Number.isInteger(wordsLimit) || wordsLimit < 1 || wordsLimit > 50)) {
    uni.showToast({ title: "单词上限必须在 1-50 之间", icon: "none" });
    return;
  }

  const parsed = safeParseJsonObject(modifiedContentJson.value);
  if (!parsed.ok) {
    uni.showToast({ title: `修改后 JSON 无效：${parsed.error}`, icon: "none" });
    return;
  }

  const payload: ApprovePushRequest = {
    action: "MODIFY",
    comment: modifyComment.value.trim() || "在家长小程序中修改",
    modifiedContent: buildModifyContent(parsed.value, wordsLimit)
  };
  await applyAction(pushId, payload);
}

function applyStructuredFieldsToJson(): void {
  const parsed = safeParseJsonObject(modifiedContentJson.value);
  if (!parsed.ok) {
    uni.showToast({ title: `JSON 无效：${parsed.error}`, icon: "none" });
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
      uni.showToast({ title: "dueWords 必须大于等于 0", icon: "none" });
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
    uni.showToast({ title: `JSON 无效：${parsed.error}`, icon: "none" });
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
  return parsed.ok ? "" : `JSON 对象无效：${parsed.error}`;
}

function safeParseJsonObject(text: string): { ok: true; value: Record<string, unknown> } | { ok: false; error: string } {
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: true, value: {} };
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ok: false, error: "必须是 JSON 对象" };
    }
    return { ok: true, value: parsed as Record<string, unknown> };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "JSON 无效"
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
    uni.showToast({ title: "已更新", icon: "success" });
    cancelModify();
    await loadPending();
  } catch (error) {
    const message = error instanceof Error ? error.message : "更新失败";
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

.recommend-card {
  background: #ecfeff;
  border-color: #67e8f9;
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

.preset-row {
  margin-top: 12rpx;
  display: flex;
  gap: 10rpx;
  flex-wrap: wrap;
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
