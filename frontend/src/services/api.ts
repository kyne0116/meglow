import { requestApi } from "./http/client";

export interface SendCodeRequest {
  phone: string;
}

export interface LoginRequest {
  phone: string;
  verificationCode: string;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: string;
  parentId: string;
  familyId: string;
}

export interface ChildSummary {
  id: string;
  familyId: string;
  name: string;
  gender: "MALE" | "FEMALE";
  birthDate?: string | null;
  grade: number;
  k12Stage: "LOWER_PRIMARY" | "MIDDLE_PRIMARY" | "UPPER_PRIMARY" | "JUNIOR_HIGH";
  avatarUrl?: string | null;
}

export interface CreateChildRequest {
  name: string;
  gender: "MALE" | "FEMALE";
  grade: number;
  birthDate?: string;
  avatarUrl?: string;
}

export interface TimeWindow {
  start: string;
  end: string;
}

export interface ChildLearningSettings {
  childId: string;
  subject: "ENGLISH";
  autoApprove: boolean;
  weekdayTimeWindows: TimeWindow[];
  weekendTimeWindows: TimeWindow[];
  dailyDurationMin: number;
  wordsPerSession: number;
}

export interface UpsertChildLearningSettingsRequest {
  autoApprove?: boolean;
  weekdayTimeWindows?: TimeWindow[];
  weekendTimeWindows?: TimeWindow[];
  dailyDurationMin?: number;
  wordsPerSession?: number;
}

export type ApprovalAction = "APPROVE" | "REJECT" | "MODIFY" | "POSTPONE";

export interface PendingPush {
  id: string;
  childId: string;
  childName: string;
  summary: string;
  reason: string;
  expectedOutcome: string;
  status: "PENDING_APPROVAL";
  scheduledAt: string;
  content: Record<string, unknown>;
}

export interface ApprovePushRequest {
  action: ApprovalAction;
  comment?: string;
  modifiedContent?: Record<string, unknown>;
  postponedUntil?: string;
}

export interface ChildTask {
  id: string;
  summary: string;
  status: "APPROVED" | "MODIFIED" | "DELIVERED" | "COMPLETED";
  scheduledAt: string;
  content: Record<string, unknown>;
}

export interface PushActionResponse {
  pushId: string;
  status: string;
}

export interface EnglishWord {
  id: string;
  value: string;
  phonetic: string | null;
  meaningZh: string;
  exampleSentence: string | null;
  imageHint: string | null;
  difficultyLevel: number;
  k12Stage: "LOWER_PRIMARY" | "MIDDLE_PRIMARY" | "UPPER_PRIMARY" | "JUNIOR_HIGH";
}

export interface LearningSessionItem {
  id: string;
  itemType: "WORD_MEANING" | "WORD_SPELLING" | "WORD_PRONUNCIATION" | "CONTENT_REVIEW";
  sequence: number;
  prompt: Record<string, unknown>;
  result?: Record<string, unknown> | null;
}

export interface LearningSession {
  id: string;
  taskId: string;
  childId: string;
  subject: "ENGLISH";
  status: "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
  startedAt: string;
  finishedAt?: string | null;
  taskOverview: {
    summary: string;
    focusSummary: string | null;
    coachHint: string | null;
  } | null;
  items: LearningSessionItem[];
}

export interface SubmitLearningAnswerRequest {
  sessionItemId: string;
  answer: Record<string, unknown>;
}

export interface SubmitLearningAnswerResponse {
  sessionItemId: string;
  isCorrect: boolean;
  score: number;
  feedback: string;
  guidance: string;
  encouragement: string;
  progress: {
    current: number;
    total: number;
  };
}

export interface FinishLearningSessionResponse {
  sessionId: string;
  status: "COMPLETED";
  summary: {
    totalItems: number;
    correctItems: number;
    accuracy: number;
    newWordsLearned: number;
    reviewWordsCompleted: number;
    masteredWords: Array<{
      word: string;
      meaningZh: string;
      phonetic: string | null;
    }>;
    needsReviewWords: Array<{
      word: string;
      meaningZh: string;
      phonetic: string | null;
      incorrectItems: Array<"WORD_MEANING" | "WORD_SPELLING" | "WORD_PRONUNCIATION" | "CONTENT_REVIEW">;
    }>;
  };
}

export async function postSendVerificationCode(payload: SendCodeRequest): Promise<{
  success: true;
  expiresInSec: number;
}> {
  return requestApi("POST", "/auth/send-code", {
    data: payload as unknown as Record<string, unknown>
  });
}

export async function postLogin(payload: LoginRequest): Promise<LoginResponse> {
  return requestApi("POST", "/auth/login", {
    data: payload as unknown as Record<string, unknown>
  });
}

export async function getChildren(token: string): Promise<ChildSummary[]> {
  return requestApi("GET", "/children", { token });
}

export async function postCreateChild(token: string, payload: CreateChildRequest): Promise<ChildSummary> {
  return requestApi("POST", "/children", {
    token,
    data: payload as unknown as Record<string, unknown>
  });
}

export async function getChildSettings(token: string, childId: string): Promise<ChildLearningSettings> {
  return requestApi("GET", `/children/${childId}/settings`, { token });
}

export async function putChildSettings(
  token: string,
  childId: string,
  payload: UpsertChildLearningSettingsRequest
): Promise<ChildLearningSettings> {
  return requestApi("PUT", `/children/${childId}/settings`, {
    token,
    data: payload as unknown as Record<string, unknown>
  });
}

export async function getPendingPushes(token: string): Promise<PendingPush[]> {
  return requestApi("GET", "/pushes/pending", { token });
}

export async function postApprovePush(
  token: string,
  pushId: string,
  payload: ApprovePushRequest
): Promise<PushActionResponse> {
  return requestApi("POST", `/pushes/${pushId}/approve`, {
    token,
    data: payload as unknown as Record<string, unknown>
  });
}

export async function getChildTasks(token: string, childId: string, date?: string): Promise<ChildTask[]> {
  const path = date ? `/pushes/tasks/${childId}?date=${encodeURIComponent(date)}` : `/pushes/tasks/${childId}`;
  return requestApi("GET", path, { token });
}

export async function postCompletePush(token: string, pushId: string): Promise<PushActionResponse> {
  return requestApi("POST", `/pushes/${pushId}/complete`, {
    token,
    data: {}
  });
}

export async function postDeliverPush(token: string, pushId: string): Promise<PushActionResponse> {
  return requestApi("POST", `/pushes/${pushId}/deliver`, {
    token,
    data: {}
  });
}

export async function getEnglishWords(
  token: string,
  params: { k12Stage?: string; keyword?: string; limit?: number } = {}
): Promise<EnglishWord[]> {
  const query = new URLSearchParams();
  if (params.k12Stage) {
    query.set("k12Stage", params.k12Stage);
  }
  if (params.keyword) {
    query.set("keyword", params.keyword);
  }
  if (typeof params.limit === "number") {
    query.set("limit", String(params.limit));
  }
  const path = query.toString() ? `/content/english/words?${query.toString()}` : "/content/english/words";
  return requestApi("GET", path, { token });
}

export async function postCreateLearningSession(token: string, taskId: string): Promise<LearningSession> {
  return requestApi("POST", "/learning/sessions", {
    token,
    data: { taskId }
  });
}

export async function getLearningSession(token: string, sessionId: string): Promise<LearningSession> {
  return requestApi("GET", `/learning/sessions/${sessionId}`, {
    token
  });
}

export async function postSubmitLearningAnswer(
  token: string,
  sessionId: string,
  payload: SubmitLearningAnswerRequest
): Promise<SubmitLearningAnswerResponse> {
  return requestApi("POST", `/learning/sessions/${sessionId}/answer`, {
    token,
    data: payload as unknown as Record<string, unknown>
  });
}

export async function postFinishLearningSession(
  token: string,
  sessionId: string
): Promise<FinishLearningSessionResponse> {
  return requestApi("POST", `/learning/sessions/${sessionId}/finish`, {
    token,
    data: {}
  });
}
