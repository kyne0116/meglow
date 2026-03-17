import { buildApprovalAdjustmentPresets } from "./approval-adjustments";

export interface ApprovalQuickAction {
  presetId: "focus_review" | "focus_pronunciation";
  label: string;
}

export function buildApprovalQuickActions(content: Record<string, unknown>): ApprovalQuickAction[] {
  return buildApprovalAdjustmentPresets(content).map((preset) => ({
    presetId: preset.id,
    label: `快速套用：${preset.label}`
  }));
}
