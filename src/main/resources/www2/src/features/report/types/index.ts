export enum ExportMimeType {
  Xls = ".xls",
}

export type PeriodRange = {
  from: Date;
  to: Date;
};

export enum PeriodType {
  LastHour = "Last hour",
  Last4Hours = "Last 4 hours",
  Last12Hours = "Last 12 hours",
  LastDay = "Last day",
  SpecificDay = "Specific day",
}

export type Period = {
  label: PeriodType;
  value?: (from?: Date) => PeriodRange;
};
