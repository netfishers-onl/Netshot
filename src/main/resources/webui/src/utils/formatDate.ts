import { format as nativeFormat } from "date-fns";

export function formatDate(
  date: string | number,
  format = "yyyy-MM-dd HH:mm:ss"
) {
  return nativeFormat(new Date(date), format);
}

export function getDateFromUnix(unix: number) {
  return new Date(formatDate(unix)).toISOString().substring(0, 10);
}
