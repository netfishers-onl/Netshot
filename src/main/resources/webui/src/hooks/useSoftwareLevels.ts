import { DeviceSoftwareLevel } from "@/types"
import { createOptionHook } from "./createOptionHook"

type SoftwareLevelInfo = {
  label: string
  color: string
  isCompliant: boolean
}

const LEVELS: Record<DeviceSoftwareLevel, SoftwareLevelInfo> = {
  [DeviceSoftwareLevel.GOLD]: {
    label: "compliance.software.gold",
    color: "gold",
    isCompliant: true,
  },
  [DeviceSoftwareLevel.SILVER]: {
    label: "compliance.software.silver",
    color: "silver",
    isCompliant: true,
  },
  [DeviceSoftwareLevel.BRONZE]: {
    label: "compliance.software.bronze",
    color: "bronze",
    isCompliant: true,
  },
  [DeviceSoftwareLevel.NON_COMPLIANT]: {
    label: "compliance.nonCompliant",
    color: "black",
    isCompliant: false,
  },
  [DeviceSoftwareLevel.UNKNOWN]: {
    label: "common.unknownLabel",
    color: "black",
    isCompliant: false,
  },
}

const useLevelOptions = createOptionHook(
  Object.entries(LEVELS).filter(([, v]) => v.isCompliant).map(([key, value]) => ({
    label: value.label,
    value: key,
  })))

export function useSoftwareLevels() {
  const { options } = useLevelOptions()

  function getInfo(level: DeviceSoftwareLevel): SoftwareLevelInfo {
    return LEVELS[level]
  }

  function getColor(level: DeviceSoftwareLevel): string {
    return LEVELS[level]?.color ?? "grey"
  }

  function getDefault(): DeviceSoftwareLevel {
    return DeviceSoftwareLevel.GOLD
  }

  return {
    options,
    getInfo,
    getColor,
    getDefault,
  }
}
