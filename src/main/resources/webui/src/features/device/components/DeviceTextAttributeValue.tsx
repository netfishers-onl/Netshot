import { DeviceTextAttribute } from "@/types"
import { Steps, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next"

type DeviceTextAttributeValueProps = {
  attribute: DeviceTextAttribute
}

export function DeviceTextAttributeValue(props: DeviceTextAttributeValueProps) {
  const { attribute } = props
  const { t } = useTranslation()

  return <Text>{attribute?.text ?? t("N/A")}</Text>
}
