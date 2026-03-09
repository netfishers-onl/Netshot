import {
  DeviceAttribute,
  DeviceAttributeDefinition,
  DeviceAttributeType,
  DeviceBinaryAttribute,
  DeviceNumericAttribute,
  DeviceTextAttribute,
} from "@/types"
import { Steps, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next"
import { DeviceBinaryAttributeValue } from "./DeviceBinaryAttributeValue"
import { DeviceNumericAttributeValue } from "./DeviceNumericAttributeValue"
import { DeviceTextAttributeValue } from "./DeviceTextAttributeValue"

type DeviceAttributeValueProps = {
  attribute: DeviceAttribute
  definition: DeviceAttributeDefinition
}

export function DeviceAttributeValue(props: DeviceAttributeValueProps) {
  const { attribute, definition } = props
  const { t } = useTranslation()

  switch (definition.type) {
    case DeviceAttributeType.Numeric:
      return (
        <DeviceNumericAttributeValue
          attribute={attribute as DeviceNumericAttribute}
        />
      )
    case DeviceAttributeType.Text:
      return (
        <DeviceTextAttributeValue
          attribute={attribute as DeviceTextAttribute}
        />
      )
    case DeviceAttributeType.Binary:
      return (
        <DeviceBinaryAttributeValue
          attribute={attribute as DeviceBinaryAttribute}
        />
      )
    default:
      return <Text>{t("Unsupported attribute")}</Text>
  }
}
