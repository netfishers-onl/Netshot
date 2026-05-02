import { DeviceSoftwareLevel } from "@/types"
import { createOptionHook } from "./createOptionHook"

export const useDeviceLevelOptions = createOptionHook([
  {
    label: "compliance.software.gold",
    value: DeviceSoftwareLevel.GOLD,
  },
  {
    label: "compliance.software.silver",
    value: DeviceSoftwareLevel.SILVER,
  },
  {
    label: "compliance.software.bronze",
    value: DeviceSoftwareLevel.BRONZE,
  },
  {
    label: "compliance.nonCompliant",
    value: DeviceSoftwareLevel.NON_COMPLIANT,
  },
  {
    label: "common.unknownLabel",
    value: DeviceSoftwareLevel.UNKNOWN,
  },
])
