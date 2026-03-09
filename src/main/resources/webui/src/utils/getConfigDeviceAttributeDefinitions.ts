import { DeviceAttributeDefinition, DeviceAttributeLevel } from "@/types"

export function getConfigDeviceAttributeDefinitions(attributes: DeviceAttributeDefinition[]) {
  if (!attributes?.length) {
    return []
  }

  return attributes.filter((attribute) => attribute.level === DeviceAttributeLevel.Config)
}
