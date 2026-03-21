import { SchedulePriority } from "@/types"

export function getSchedulePriorityLabel(priority: SchedulePriority) {
  switch (priority) {
    case SchedulePriority.Low:
      return "low"
    case SchedulePriority.Normal:
      return "normal"
    case SchedulePriority.High:
      return "high"
    default:
      return "unknown3"
  }
}
