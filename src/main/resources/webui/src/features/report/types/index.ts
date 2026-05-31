import { Option } from "@/types"

export enum ExportMimeType {
  Xlsx = "xlsx",
}

export type PeriodRange = {
  from: Date
  to: Date
}

export type PeriodValue = (from?: Date) => PeriodRange

export enum PeriodType {
  LastHour = "report.period.lastHour",
  Last4Hours = "report.period.last4Hours",
  Last12Hours = "report.period.last12Hours",
  LastDay = "report.period.lastDay",
  SpecificDay = "report.period.specificDay",
}

export type Period = Option<PeriodValue, PeriodType>
