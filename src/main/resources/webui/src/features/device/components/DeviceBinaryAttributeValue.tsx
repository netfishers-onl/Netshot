import { DeviceBinaryAttribute } from "@/types"
import { Steps, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next"

type DeviceBinaryAttributeValueProps = {
  attribute: DeviceBinaryAttribute
}

export function DeviceBinaryAttributeValue(
  props: DeviceBinaryAttributeValueProps
) {
  const { attribute } = props
  const { t } = useTranslation()

  if (attribute?.assumption === true) {
    return <Text>{t("true2")}</Text>
  } else if (attribute?.assumption === false) {
    return <Text>{t("false2")}</Text>
  }

  return <Text>{t("nA")}</Text>
}
