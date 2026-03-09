import { SchedulePriority } from "@/types"

export function getSchedulePriorityLabel(priority: SchedulePriority) {
  switch (priority) {
    case SchedulePriority.Low:
      return "Low"
    case SchedulePriority.Normal:
      return "Normal"
    case SchedulePriority.High:
      return "High"
    default:
      return "Unknown"
  }
}
