import { DeviceSoftwareLevel } from "@/types";

/**
 * Get the correct color for software level
 */
export function getSoftwareLevelColor(softwareLevel: DeviceSoftwareLevel) {
  if (softwareLevel === DeviceSoftwareLevel.GOLD) {
    return "yellow";
  } else if (softwareLevel === DeviceSoftwareLevel.SILVER) {
    return "grey";
  } else if (softwareLevel === DeviceSoftwareLevel.BRONZE) {
    return "bronze";
  } else if (softwareLevel === DeviceSoftwareLevel.NON_COMPLIANT) {
    return "red";
  } else {
    return "purple";
  }
}
