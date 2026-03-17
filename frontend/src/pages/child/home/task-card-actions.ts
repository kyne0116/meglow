import type { ChildTask } from "../../../services/api";

export interface TaskCardAction {
  label: string;
  actionType: "DELIVER_AND_START" | "START_LEARNING";
}

export function buildTaskCardAction(status: ChildTask["status"]): TaskCardAction | null {
  if (status === "APPROVED" || status === "MODIFIED") {
    return {
      label: "投递并开始",
      actionType: "DELIVER_AND_START"
    };
  }

  if (status === "DELIVERED") {
    return {
      label: "开始学习",
      actionType: "START_LEARNING"
    };
  }

  return null;
}
