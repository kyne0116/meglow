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
