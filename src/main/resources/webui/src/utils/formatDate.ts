import { CalendarDate, fromAbsolute, fromDate, getLocalTimeZone, toCalendarDate, toZoned, type DateValue } from "@internationalized/date";

const pad = (n: number) => String(n).padStart(2, "0");

export function startOfDay(date: number | Date): number {
  const tz = getLocalTimeZone()
  const zdt = date instanceof Date ? fromDate(date, tz) : fromAbsolute(date, tz)
  return zdt.set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toDate().getTime()
}

export function endOfDay(date: number | Date): number {
  const tz = getLocalTimeZone()
  const zdt = date instanceof Date ? fromDate(date, tz) : fromAbsolute(date, tz)
  return zdt.set({ hour: 23, minute: 59, second: 59, millisecond: 999 }).toDate().getTime()
}

/** Converts a CalendarDate to a unix timestamp (ms). */
export function calendarDateToTimestamp(date: DateValue): number {
  return toZoned(date as CalendarDate, getLocalTimeZone()).toDate().getTime()
}

/** Converts a unix timestamp (ms) to a DateValue array suitable for DatePicker.Root value. */
export function numberToCalendarDates(timestamp: number | undefined | null): DateValue[] {
  if (timestamp == null || !Number.isFinite(timestamp)) return [];
  return [toCalendarDate(fromAbsolute(timestamp, getLocalTimeZone()))];
}

