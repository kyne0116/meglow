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

      <button type="primary" @tap="backToTasks">返回任务面板</button>
    </view>

    <view v-else-if="currentItem" class="panel">
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
          <button type="primary" :loading="submitting" @tap="submitPronunciationAnswer">我已朗读</button>
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
  FinishLearningSessionResponse,
  getLearningSession,
  LearningSession,
  postFinishLearningSession,
  postSubmitLearningAnswer,
  SubmitLearningAnswerResponse
} from "../../../services/api";
import { buildPronunciationAnswer, getLearningItemTypeLabel } from "./item-helpers";
import { useSessionStore } from "../../../stores/session";

const sessionStore = useSessionStore();
const loading = ref(false);
const submitting = ref(false);
const finishing = ref(false);
const session = ref<LearningSession | null>(null);
const currentIndex = ref(0);
const spellingInput = ref("");
const feedbackCard = ref<SubmitLearningAnswerResponse | null>(null);
const summary = ref<FinishLearningSessionResponse["summary"] | null>(null);
const sessionId = ref("");

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

async function submitPronunciationAnswer(): Promise<void> {
  await submitAnswer(buildPronunciationAnswer());
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
