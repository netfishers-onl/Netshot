import { DeviceNumericAttribute } from "@/types"
import { Steps, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next"

type DeviceNumericAttributeValueProps = {
  attribute: DeviceNumericAttribute
}

export function DeviceNumericAttributeValue(
  props: DeviceNumericAttributeValueProps
) {
  const { attribute } = props
  const { t } = useTranslation()

  return <Text>{attribute?.number ?? t("N/A")}</Text>
}
