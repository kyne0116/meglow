import { requestApi } from "./http/client";

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
  grade: number;
  k12Stage: "LOWER_PRIMARY" | "MIDDLE_PRIMARY" | "UPPER_PRIMARY" | "JUNIOR_HIGH";
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
  status: "APPROVED" | "MODIFIED" | "DELIVERED";
  scheduledAt: string;
  content: Record<string, unknown>;
}

export interface PushActionResponse {
  pushId: string;
  status: string;
}

export async function postLogin(payload: LoginRequest): Promise<LoginResponse> {
  return requestApi("POST", "/auth/login", {
    data: payload as unknown as Record<string, unknown>
  });
}

export async function getChildren(token: string): Promise<ChildSummary[]> {
  return requestApi("GET", "/children", { token });
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
