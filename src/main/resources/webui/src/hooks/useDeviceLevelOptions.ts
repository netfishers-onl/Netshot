import { DeviceSoftwareLevel } from "@/types"
import { createOptionHook } from "./createOptionHook"

export const useDeviceLevelOptions = createOptionHook([
  {
    label: "Gold",
    value: DeviceSoftwareLevel.GOLD,
  },
  {
    label: "Silver",
    value: DeviceSoftwareLevel.SILVER,
  },
  {
    label: "Bronze",
    value: DeviceSoftwareLevel.BRONZE,
  },
  {
    label: "Non compliant",
    value: DeviceSoftwareLevel.NON_COMPLIANT,
  },
  {
    label: "Unknown",
    value: DeviceSoftwareLevel.UNKNOWN,
  },
])
