import { createOptionHook } from "@/hooks"
import { fromDate, getLocalTimeZone, now } from "@internationalized/date"
import { PeriodType } from "../types"

export const usePeriodOptions = createOptionHook([
  {
    label: PeriodType.LastHour,
    value() {
      const tz = getLocalTimeZone()
      return {
        to: now(tz).toDate(),
        from: now(tz).subtract({ hours: 1 }).toDate(),
      }
    },
  },
  {
    label: PeriodType.Last4Hours,
    value() {
      const tz = getLocalTimeZone()
      return {
        to: now(tz).toDate(),
        from: now(tz).subtract({ hours: 4 }).toDate(),
      }
    },
  },
  {
    label: PeriodType.Last12Hours,
    value() {
      const tz = getLocalTimeZone()
      return {
        to: now(tz).toDate(),
        from: now(tz).subtract({ hours: 12 }).toDate(),
      }
    },
  },
  {
    label: PeriodType.LastDay,
    value() {
      const tz = getLocalTimeZone()
      return {
        to: now(tz).toDate(),
        from: now(tz).subtract({ hours: 24 }).toDate(),
      }
    },
  },
  {
    label: PeriodType.SpecificDay,
    value(from: Date) {
      const tz = getLocalTimeZone()
      const zdt = fromDate(from, tz)
      return {
        from: zdt.set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toDate(),
        to: zdt.set({ hour: 23, minute: 59, second: 59, millisecond: 999 }).toDate(),
      }
    },
  },
])
