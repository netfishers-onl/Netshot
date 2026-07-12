import { TaskStatus, TaskType } from "@/types";

export const QUERIES = {
  TASK_LIVE_ROWS: "task:live-rows",
  TASK_COMPLETED_ROWS: "task:completed-rows",
  TASK_STATS: "task:stats",
  TASK_SUMMARY: "task:summary",
};

/** Completed (final) statuses — windowed by time, drawn on the histogram. */
export const FINAL_STATUS_KEYS = [TaskStatus.Success, TaskStatus.Failure, TaskStatus.Cancelled];

/** Live (in-flight) statuses — always shown, unaffected by the time range. */
export const LIVE_STATUS_KEYS = [TaskStatus.Running, TaskStatus.Waiting, TaskStatus.Scheduled];

/** All statuses filterable from the Tasks screen (NEW is transient, excluded). */
export const FILTERABLE_STATUS_KEYS = [...FINAL_STATUS_KEYS, ...LIVE_STATUS_KEYS];

export const TASK_TYPE_KEYS = Object.values(TaskType);

export type TimeRangePreset = {
  label: string;
  ms: number | null;
};

export const TIME_RANGE_PRESETS: TimeRangePreset[] = [
  { label: "task.timeRange.last15Minutes", ms: 15 * 60000 },
  { label: "task.timeRange.last1Hour", ms: 3600000 },
  { label: "task.timeRange.last6Hours", ms: 6 * 3600000 },
  { label: "task.timeRange.last24Hours", ms: 24 * 3600000 },
  { label: "task.timeRange.last7Days", ms: 7 * 86400000 },
  { label: "task.timeRange.last30Days", ms: 30 * 86400000 },
  { label: "task.timeRange.last90Days", ms: 90 * 86400000 },
  { label: "task.timeRange.allTime", ms: null },
];

export const DEFAULT_TIME_RANGE_PRESET = "task.timeRange.last90Days";

export const HISTOGRAM_BUCKET_COUNT = 48;
