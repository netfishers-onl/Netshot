import {
  GroupedHardwareSupportStat,
  HardwareSupportStat,
  HardwareSupportStatType,
} from "@/types";

export function groupStatByDate(stats: HardwareSupportStat[]) {
  if (!Array.isArray(stats)) {
    return [];
  }

  const output: GroupedHardwareSupportStat[] = [];

  for (const stat of stats) {
    const item = output.find((item) => item.date === stat.eoxDate);

    if (item) {
      item.eos +=
        stat.type === HardwareSupportStatType.Eos ? stat.deviceCount : 0;
      item.eol +=
        stat.type === HardwareSupportStatType.Eol ? stat.deviceCount : 0;
    } else {
      output.push({
        date: stat.eoxDate,
        eos: stat.type === HardwareSupportStatType.Eos ? stat.deviceCount : 0,
        eol: stat.type === HardwareSupportStatType.Eol ? stat.deviceCount : 0,
      });
    }
  }

  return output.sort((a, b) => a.date - b.date);
}
