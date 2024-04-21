/**
 * Get range of dates between two targets dates
 */
export function getDatesBetween(
  startDate: Date,
  endDate: Date,
  frequency: "h" | "m" | "s" = "m",
  interval = 10
) {
  const dates: Date[] = [];
  let current = new Date(startDate);

  while (current <= endDate) {
    dates.push(new Date(current));

    if (frequency === "h") {
      current.setHours(current.getHours() + interval);
    } else if (frequency === "m") {
      current.setMinutes(current.getMinutes() + interval);
    } else if (frequency === "s") {
      current.setSeconds(current.getSeconds() + interval);
    }
  }

  return dates;
}
