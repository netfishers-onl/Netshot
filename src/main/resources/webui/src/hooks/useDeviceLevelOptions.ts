import { DeviceSoftwareLevel } from "@/types"
import { createOptionHook } from "./createOptionHook"

export const useDeviceLevelOptions = createOptionHook([
  {
    label: "gold",
    value: DeviceSoftwareLevel.GOLD,
  },
  {
    label: "silver",
    value: DeviceSoftwareLevel.SILVER,
  },
  {
    label: "bronze",
    value: DeviceSoftwareLevel.BRONZE,
  },
  {
    label: "nonCompliant",
    value: DeviceSoftwareLevel.NON_COMPLIANT,
  },
  {
    label: "unknown3",
    value: DeviceSoftwareLevel.UNKNOWN,
  },
])
