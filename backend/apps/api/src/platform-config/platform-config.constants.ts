import { SubjectType } from '@prisma/client';

export const DEFAULT_CHILD_LEARNING_SETTINGS_SUMMARY = {
  autoApprove: false,
  dailyDurationMin: 20,
  wordsPerSession: 10,
} as const;

export function createDefaultChildLearningSettings() {
  return {
    subject: SubjectType.ENGLISH,
    autoApprove: DEFAULT_CHILD_LEARNING_SETTINGS_SUMMARY.autoApprove,
    weekdayTimeWindows: [{ start: '18:30', end: '20:00' }],
    weekendTimeWindows: [{ start: '09:00', end: '10:30' }],
    dailyDurationMin: DEFAULT_CHILD_LEARNING_SETTINGS_SUMMARY.dailyDurationMin,
    wordsPerSession: DEFAULT_CHILD_LEARNING_SETTINGS_SUMMARY.wordsPerSession,
  };
}
