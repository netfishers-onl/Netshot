import { SchedulePriority } from "@/types"

export function getSchedulePriorityLabel(priority: SchedulePriority | undefined) {
  switch (priority) {
    case SchedulePriority.Low:
      return "common.low"
    case SchedulePriority.Normal:
      return "common.normal"
    case SchedulePriority.High:
      return "common.high"
    default:
      return "common.nA"
  }
}
