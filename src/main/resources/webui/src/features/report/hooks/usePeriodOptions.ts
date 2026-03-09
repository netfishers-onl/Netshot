import { createOptionHook } from "@/hooks"
import { endOfDay, startOfDay, subHours } from "date-fns"
import { PeriodType } from "../types"

export const usePeriodOptions = createOptionHook([
  {
    label: PeriodType.LastHour,
    value() {
      const current = new Date()

      return {
        to: new Date(),
        from: subHours(current, 1),
      }
    },
  },
  {
    label: PeriodType.Last4Hours,
    value() {
      const current = new Date()

      return {
        to: new Date(),
        from: subHours(current, 4),
      }
    },
  },
  {
    label: PeriodType.Last12Hours,
    value() {
      const current = new Date()

      return {
        to: new Date(),
        from: subHours(current, 12),
      }
    },
  },
  {
    label: PeriodType.LastDay,
    value() {
      const current = new Date()

      return {
        to: new Date(),
        from: subHours(current, 24),
      }
    },
  },
  {
    label: PeriodType.SpecificDay,
    value(from: Date) {
      return {
        to: endOfDay(from),
        from: startOfDay(from),
      }
    },
  },
])
