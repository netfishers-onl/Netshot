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
    return <Text>{t("trueLabel")}</Text>
  } else if (attribute?.assumption === false) {
    return <Text>{t("falseLabel")}</Text>
  }

  return <Text>{t("nA")}</Text>
}
