import { DeviceSoftwareLevel } from "@/types";

/**
 * Get the correct color for software level
 */
export function getSoftwareLevelColor(softwareLevel: DeviceSoftwareLevel) {
  if (softwareLevel === DeviceSoftwareLevel.GOLD) {
    return "yellow.500";
  } else if (softwareLevel === DeviceSoftwareLevel.SILVER) {
    return "grey.200";
  } else if (softwareLevel === DeviceSoftwareLevel.BRONZE) {
    return "bronze.500";
  } else if (softwareLevel === DeviceSoftwareLevel.NON_COMPLIANT) {
    return "red.400";
  } else {
    return "purple.200";
  }
}
