import { LightConfig } from "@/types"
import { fromAbsolute, ZonedDateTime } from "@internationalized/date"

export type ConfigChangeDayBin = {
  from: number
  to: number
  count: number
}

function startOfDay(t: number, timezone: string): ZonedDateTime {
  return fromAbsolute(t, timezone).set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
}

/**
 * Buckets configuration changes into one bin per calendar day covering [from, to],
 * in the given IANA timezone. Steps day-by-day with zoned-date arithmetic (rather
 * than fixed 24h increments) so DST transitions don't shift bin boundaries off
 * local midnight.
 */
export function bucketConfigChangesByDay(
  changes: LightConfig[],
  from: number,
  to: number,
  timezone: string
): ConfigChangeDayBin[] {
  const lastDay = startOfDay(Math.max(from, to - 1), timezone)

  const bins: ConfigChangeDayBin[] = []
  let cursor = startOfDay(from, timezone)
  while (cursor.compare(lastDay) <= 0) {
    const binFrom = cursor.toDate().getTime()
    cursor = cursor.add({ days: 1 })
    const binTo = cursor.toDate().getTime()
    bins.push({ from: binFrom, to: binTo, count: 0 })
  }

  for (const change of changes) {
    const bin = bins.find((b) => change.changeDate >= b.from && change.changeDate < b.to)
    if (bin) bin.count += 1
  }

  return bins
}
