import i18n from "@/i18n";
import { endOfDay, startOfDay, subHours } from "date-fns";
import { ExportMimeType, Period, PeriodType } from "../types";

export const QUERIES = {
  CONFIG_CHANGE: "config-change",
  REPORT_CONFIG_CHANGE_LIST: "report-config-change-list",
  REPORT_CONFIG_CHANGE_OVER_LAST_DAY: "report-config-change-over-last-day",
  SOFTWARE_COMPLIANCE: "software-compliance",
  SOFTWARE_COMPLIANCE_DEVICES: "software-compliance-devices",
  DEVICE_ACCESS_FAILURE: "device-access-failure",
  DEVICE_HARDWARE_STATUS: "device-hardware-status",
  DEVICE_CONFIG: "device-config",
  DEVICE_CURRENT_CONFIG: "device-current-config",
  CONFIGURATION_COMPLIANCE_STAT: "configuration-compliance-stat",
};

export const EXPORT_MIMES_TYPES_OPTIONS = [
  {
    label: i18n.t("xls"),
    value: ExportMimeType.Xls,
  },
];

export const PERIODS: Period[] = [
  {
    label: PeriodType.LastHour,
    value() {
      const current = new Date();

      return {
        to: new Date(),
        from: subHours(current, 1),
      };
    },
  },
  {
    label: PeriodType.Last4Hours,
    value() {
      const current = new Date();

      return {
        to: new Date(),
        from: subHours(current, 4),
      };
    },
  },
  {
    label: PeriodType.Last12Hours,
    value() {
      const current = new Date();

      return {
        to: new Date(),
        from: subHours(current, 12),
      };
    },
  },
  {
    label: PeriodType.LastDay,
    value() {
      const current = new Date();

      return {
        to: new Date(),
        from: subHours(current, 24),
      };
    },
  },
  {
    label: PeriodType.SpecificDay,
    value(from: Date) {
      return {
        to: endOfDay(from),
        from: startOfDay(from),
      };
    },
  },
];
