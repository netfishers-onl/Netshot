import { Badge, Icon } from "@chakra-ui/react"
import { LuShieldCheck, LuShieldAlert, LuShieldOff } from "react-icons/lu"
import { useTranslation } from "react-i18next"

type DeviceHardwareComplianceBadgeProps = {
  eol: boolean
  eos: boolean
}

export default function DeviceHardwareComplianceBadge({ eol, eos }: DeviceHardwareComplianceBadgeProps) {
  const { t } = useTranslation()

  if (eol) {
    return (
      <Badge variant="surface" colorPalette="red" size="md" display="inline-flex" alignItems="center" gap="1">
        <Icon size="sm" flexShrink={0}><LuShieldOff /></Icon>
        {t("compliance.hardware.endOfLife")}
      </Badge>
    )
  }

  if (eos) {
    return (
      <Badge variant="surface" colorPalette="orange" size="md" display="inline-flex" alignItems="center" gap="1">
        <Icon size="sm" flexShrink={0}><LuShieldAlert /></Icon>
        {t("compliance.hardware.endOfSale")}
      </Badge>
    )
  }

  return (
    <Badge variant="surface" colorPalette="green" size="md" display="inline-flex" alignItems="center" gap="1">
      <Icon size="sm" flexShrink={0}><LuShieldCheck /></Icon>
      {t("common.upToDate")}
    </Badge>
  )
}
