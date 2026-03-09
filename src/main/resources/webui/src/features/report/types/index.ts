import { Option } from "@/types"

export enum ExportMimeType {
  Xls = "xlsx",
}

export type PeriodRange = {
  from: Date
  to: Date
}

export type PeriodValue = (from?: Date) => PeriodRange

export enum PeriodType {
  LastHour = "Last hour",
  Last4Hours = "Last 4 hours",
  Last12Hours = "Last 12 hours",
  LastDay = "Last day",
  SpecificDay = "Specific day",
}

export type Period = Option<PeriodValue, PeriodType>
