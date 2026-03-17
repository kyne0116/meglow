<template>
  <view class="container">
    <view class="title">学习会话</view>

    <view v-if="loading" class="empty">正在加载学习会话...</view>
    <view v-else-if="summary" class="panel">
      <view class="summary-card">
        <view class="summary-title">学习完成</view>
        <view class="line">总题数：{{ summary.totalItems }}</view>
        <view class="line">答对题数：{{ summary.correctItems }}</view>
        <view class="line">正确率：{{ accuracyText }}</view>
        <view class="line">新学单词数：{{ summary.newWordsLearned }}</view>
        <view class="line">复习完成数：{{ summary.reviewWordsCompleted }}</view>
      </view>

      <view v-if="summary.masteredWords.length" class="summary-card">
        <view class="summary-title">本次已掌握</view>
        <view v-for="item in summary.masteredWords" :key="`mastered-${item.word}`" class="line">
          {{ item.word }} - {{ item.meaningZh }}
        </view>
      </view>

      <view v-if="summary.needsReviewWords.length" class="summary-card">
        <view class="summary-title">待复习单词</view>
        <view v-for="item in summary.needsReviewWords" :key="`review-${item.word}`" class="line">
          {{ item.word }} - {{ item.meaningZh }}（{{ formatIncorrectItems(item.incorrectItems) }}）
        </view>
      </view>

      <view v-if="summaryNextStep" class="summary-card">
        <view class="summary-title">{{ summaryNextStep.title }}</view>
        <view class="line">{{ summaryNextStep.description }}</view>
        <view v-if="summaryNextStep.nextTaskSummary" class="line">{{ summaryNextStep.nextTaskSummary }}</view>
        <view v-if="summaryNextStep.pendingPushSummary" class="line">{{ summaryNextStep.pendingPushSummary }}</view>
      </view>

      <button type="primary" :loading="startingNextTask" @tap="handleSummaryAction">
        {{ summaryNextStep?.actionLabel ?? "返回任务面板" }}
      </button>
    </view>

    <view v-else-if="currentItem" class="panel">
      <view v-if="session?.taskOverview" class="summary-card">
        <view class="summary-title">本轮任务</view>
        <view class="line">{{ session.taskOverview.summary }}</view>
        <view v-if="session.taskOverview.focusSummary" class="line">
          任务要点：{{ session.taskOverview.focusSummary }}
        </view>
        <view v-if="session.taskOverview.coachHint" class="line">
          提示：{{ session.taskOverview.coachHint }}
        </view>
      </view>

      <view class="progress">
        <text>进度 {{ currentIndex + 1 }}/{{ session?.items.length ?? 0 }}</text>
        <text>{{ displayItemType }}</text>
      </view>

      <view class="question-card">
        <view v-if="currentItem.itemType === 'WORD_MEANING'">
          <view class="question-title">{{ displayWord }}</view>
          <view class="question-subtitle">{{ displayPhonetic }}</view>
          <button
            v-for="option in meaningOptions"
            :key="option"
            class="option-btn"
            @tap="submitMeaningAnswer(option)"
          >
            {{ option }}
          </button>
        </view>

        <view v-else-if="currentItem.itemType === 'WORD_SPELLING'">
          <view class="question-title">{{ displayMeaning }}</view>
          <view class="question-subtitle">{{ displayPhonetic }}</view>
          <view class="hint">提示：{{ spellingHint }}</view>
          <input v-model="spellingInput" class="input" placeholder="请输入单词" />
          <button type="primary" :loading="submitting" @tap="submitSpellingAnswer">提交答案</button>
        </view>

        <view v-else-if="currentItem.itemType === 'WORD_PRONUNCIATION'">
          <view class="question-title">{{ displayWord }}</view>
          <view class="question-subtitle">{{ displayPhonetic }}</view>
          <view class="hint">{{ pronunciationInstruction }}</view>
          <view v-if="pronunciationExample" class="line">例句：{{ pronunciationExample }}</view>
          <button
            v-for="option in pronunciationRatingOptions"
            :key="option.value"
            class="option-btn"
            :disabled="submitting"
            @tap="submitPronunciationAnswer(option.value)"
          >
            {{ option.label }}
          </button>
        </view>

        <view v-else>
          <view class="question-title">{{ displayItemType }}</view>
          <view class="hint">当前小程序暂未支持该题型。</view>
        </view>
      </view>

      <view v-if="feedbackCard" class="feedback-card">
        <view class="feedback-title">{{ feedbackCard.isCorrect ? "回答正确" : "下次继续加油" }}</view>
        <view class="line">反馈：{{ feedbackCard.feedback }}</view>
        <view class="line">指导：{{ feedbackCard.guidance }}</view>
        <view class="line">鼓励：{{ feedbackCard.encouragement }}</view>
        <view class="line">得分：{{ feedbackCard.score }}</view>
      </view>

      <button
        v-if="isLastItem && allAnswered"
        type="primary"
        :loading="finishing"
        @tap="finishSession"
      >
        完成学习
      </button>
    </view>

    <view v-else class="empty">未找到学习题目。</view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from "@dcloudio/uni-app";
import { computed, ref } from "vue";
import {
  ChildTask,
  FinishLearningSessionResponse,
  getChildTasks,
  getLearningSession,
  getPendingPushes,
  LearningSession,
  postCreateLearningSession,
  postDeliverPush,
  postFinishLearningSession,
  postSubmitLearningAnswer,
  SubmitLearningAnswerResponse
} from "../../../services/api";
import {
  buildPronunciationAnswer,
  getLearningItemTypeLabel,
  type PronunciationSelfRating
} from "./item-helpers";
import { pickFollowupPendingPush } from "./pending-push-match";
import { buildSummaryNextStep, type SummaryNextStep } from "./summary-next-step";
import { useSessionStore } from "../../../stores/session";

const sessionStore = useSessionStore();
const loading = ref(false);
const submitting = ref(false);
const finishing = ref(false);
const startingNextTask = ref(false);
const session = ref<LearningSession | null>(null);
const currentIndex = ref(0);
const spellingInput = ref("");
const feedbackCard = ref<SubmitLearningAnswerResponse | null>(null);
const summary = ref<FinishLearningSessionResponse["summary"] | null>(null);
const summaryNextStep = ref<SummaryNextStep | null>(null);
const sessionId = ref("");
const pronunciationRatingOptions: Array<{
  value: PronunciationSelfRating;
  label: string;
}> = [
  { value: "NEEDS_PRACTICE", label: "读不顺" },
  { value: "OK", label: "基本读对" },
  { value: "GOOD", label: "读得很好" }
];

const currentItem = computed(() => session.value?.items[currentIndex.value] ?? null);
const currentPrompt = computed<Record<string, unknown>>(() => {
  return currentItem.value?.prompt ?? {};
});
const meaningOptions = computed(() => {
  const options = currentPrompt.value.options;
  return Array.isArray(options) ? options.map((item) => String(item)) : [];
});
const displayWord = computed(() => String(currentPrompt.value.word ?? ""));
const displayMeaning = computed(() => String(currentPrompt.value.meaningZh ?? ""));
const displayItemType = computed(() => getLearningItemTypeLabel(currentItem.value?.itemType ?? ""));
const displayPhonetic = computed(() => {
  const phonetic = String(currentPrompt.value.phonetic ?? "").trim();
  return phonetic || "-";
});
const spellingHint = computed(() => String(currentPrompt.value.hint ?? ""));
const pronunciationInstruction = computed(() => String(currentPrompt.value.instruction ?? "请先朗读当前单词"));
const pronunciationExample = computed(() => String(currentPrompt.value.exampleSentence ?? "").trim());
const isLastItem = computed(() => {
  if (!session.value) {
    return false;
  }
  return currentIndex.value >= session.value.items.length - 1;
});
const allAnswered = computed(() => {
  if (!session.value) {
    return false;
  }
  return session.value.items.every((item) => Boolean(item.result));
});
const accuracyText = computed(() => {
  if (!summary.value) {
    return "-";
  }
  return `${Math.round(summary.value.accuracy * 100)}%`;
});

onLoad(async (options) => {
  sessionStore.loadFromStorage();
  if (!sessionStore.accessToken) {
    uni.reLaunch({
      url: "/pages/auth/login/index"
    });
    return;
  }

  const nextSessionId = typeof options?.sessionId === "string" ? options.sessionId : "";
  if (!nextSessionId) {
    uni.showToast({ title: "缺少 sessionId", icon: "none" });
    return;
  }

  sessionId.value = nextSessionId;
  await loadSession();
});

async function loadSession(): Promise<void> {
  if (!sessionStore.accessToken || !sessionId.value) {
    return;
  }
  loading.value = true;
  try {
    session.value = await getLearningSession(sessionStore.accessToken, sessionId.value);
    const firstUnansweredIndex = session.value.items.findIndex((item) => !item.result);
    currentIndex.value =
      firstUnansweredIndex >= 0 ? firstUnansweredIndex : Math.max(session.value.items.length - 1, 0);
    feedbackCard.value = null;
    summaryNextStep.value = null;
  } catch (error) {
    uni.showToast({ title: toErrorMessage(error), icon: "none" });
  } finally {
    loading.value = false;
  }
}

async function submitMeaningAnswer(selected: string): Promise<void> {
  await submitAnswer({ selected });
}

async function submitSpellingAnswer(): Promise<void> {
  if (!spellingInput.value.trim()) {
    uni.showToast({ title: "请输入单词", icon: "none" });
    return;
  }
  await submitAnswer({ text: spellingInput.value.trim() });
}

async function submitPronunciationAnswer(selfRating: PronunciationSelfRating): Promise<void> {
  await submitAnswer(buildPronunciationAnswer(selfRating));
}

async function submitAnswer(answer: Record<string, unknown>): Promise<void> {
  if (!sessionStore.accessToken || !sessionId.value || !currentItem.value) {
    return;
  }
  submitting.value = true;
  try {
    const result = await postSubmitLearningAnswer(sessionStore.accessToken, sessionId.value, {
      sessionItemId: currentItem.value.id,
      answer
    });
    feedbackCard.value = result;
    const nextItems = [...(session.value?.items ?? [])];
    nextItems[currentIndex.value] = {
      ...nextItems[currentIndex.value],
      result: {
        isCorrect: result.isCorrect,
        score: result.score,
        feedback: result.feedback,
        guidance: result.guidance,
        encouragement: result.encouragement
      }
    };
    if (session.value) {
      session.value = {
        ...session.value,
        items: nextItems
      };
    }
    spellingInput.value = "";

    if (!isLastItem.value) {
      currentIndex.value += 1;
    }
  } catch (error) {
    uni.showToast({ title: toErrorMessage(error), icon: "none" });
  } finally {
    submitting.value = false;
  }
}

async function finishSession(): Promise<void> {
  if (!sessionStore.accessToken || !sessionId.value) {
    return;
  }
  finishing.value = true;
  try {
    const result = await postFinishLearningSession(sessionStore.accessToken, sessionId.value);
    summary.value = result.summary;
    summaryNextStep.value = await loadSummaryNextStep(result.summary.needsReviewWords.length);
  } catch (error) {
    uni.showToast({ title: toErrorMessage(error), icon: "none" });
  } finally {
    finishing.value = false;
  }
}

function backToTasks(): void {
  uni.redirectTo({
    url: "/pages/child/home/index"
  });
}

async function handleSummaryAction(): Promise<void> {
  if (
    (summaryNextStep.value?.actionType === "START_NEXT_TASK" ||
      summaryNextStep.value?.actionType === "DELIVER_AND_START_NEXT_TASK") &&
    summaryNextStep.value.taskId &&
    sessionStore.accessToken
  ) {
    startingNextTask.value = true;
    try {
      if (summaryNextStep.value.actionType === "DELIVER_AND_START_NEXT_TASK") {
        await postDeliverPush(sessionStore.accessToken, summaryNextStep.value.taskId);
      }
      const nextSession = await postCreateLearningSession(sessionStore.accessToken, summaryNextStep.value.taskId);
      uni.redirectTo({
        url: `/pages/child/session/index?sessionId=${encodeURIComponent(nextSession.id)}&taskId=${encodeURIComponent(
          summaryNextStep.value.taskId
        )}`
      });
      return;
    } catch (error) {
      uni.showToast({ title: toErrorMessage(error), icon: "none" });
    } finally {
      startingNextTask.value = false;
    }
  }

  backToTasks();
}

async function loadSummaryNextStep(needsReviewWordCount: number): Promise<SummaryNextStep> {
  const fallback = buildSummaryNextStep([], {
    currentTaskId: session.value?.taskId ?? "",
    needsReviewWordCount
  });

  if (!sessionStore.accessToken || !session.value?.childId) {
    return fallback;
  }

  try {
    const tasks = await getChildTasks(sessionStore.accessToken, session.value.childId);
    const pendingPushes = await getPendingPushes(sessionStore.accessToken);
    const nextPendingPush = pickFollowupPendingPush(pendingPushes, {
      childId: session.value.childId,
      needsReviewWordCount
    });
    return buildSummaryNextStep(tasks as ChildTask[], {
      currentTaskId: session.value.taskId,
      needsReviewWordCount,
      pendingPushSummary: nextPendingPush?.summary,
      pendingPushScheduledAt: nextPendingPush?.scheduledAt
    });
  } catch {
    return fallback;
  }
}

function formatIncorrectItems(
  incorrectItems: Array<"WORD_MEANING" | "WORD_SPELLING" | "WORD_PRONUNCIATION" | "CONTENT_REVIEW">
): string {
  return incorrectItems.map((itemType) => getLearningItemTypeLabel(itemType)).join(" / ");
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

.progress,
.summary-card,
.question-card,
.feedback-card {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  padding: 20rpx;
  border-radius: 14rpx;
  background: #fff;
  border: 1rpx solid #e5e7eb;
}

.progress {
  flex-direction: row;
  justify-content: space-between;
  color: #667085;
  font-size: 24rpx;
}

.question-title,
.summary-title,
.feedback-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #111827;
}

.question-subtitle,
.hint,
.line {
  color: #4b5563;
  font-size: 24rpx;
}

.option-btn {
  margin-top: 8rpx;
}

.input {
  min-height: 72rpx;
  border: 1rpx solid #d5d9e2;
  border-radius: 10rpx;
  padding: 16rpx 18rpx;
  background: #fff;
  font-size: 26rpx;
  box-sizing: border-box;
}
</style>
