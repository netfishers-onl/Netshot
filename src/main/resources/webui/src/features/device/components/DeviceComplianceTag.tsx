import { DeviceComplianceResultType } from "@/types"
import { Badge, Icon } from "@chakra-ui/react"
import { LuCircleCheck, LuCircleX, LuCircleMinus, LuBan, LuTriangleAlert, LuMinus } from "react-icons/lu"
import { useTranslation } from "react-i18next"

export type DeviceComplianceTagProps = {
  resultType: DeviceComplianceResultType
}

type Config = {
  colorPalette: string
  icon: React.ReactElement
  labelKey: string
}

const mapping: Record<DeviceComplianceResultType, Config> = {
  [DeviceComplianceResultType.Conforming]: {
    colorPalette: "green",
    icon: <LuCircleCheck />,
    labelKey: "compliance.conforming",
  },
  [DeviceComplianceResultType.NonConforming]: {
    colorPalette: "red",
    icon: <LuCircleX />,
    labelKey: "compliance.nonConforming",
  },
  [DeviceComplianceResultType.Disabled]: {
    colorPalette: "grey",
    icon: <LuCircleMinus />,
    labelKey: "common.disabled",
  },
  [DeviceComplianceResultType.Exempted]: {
    colorPalette: "blue",
    icon: <LuBan />,
    labelKey: "policy.rule.exempted",
  },
  [DeviceComplianceResultType.InvalidRule]: {
    colorPalette: "yellow",
    icon: <LuTriangleAlert />,
    labelKey: "policy.rule.invalid",
  },
  [DeviceComplianceResultType.NotApplication]: {
    colorPalette: "grey",
    icon: <LuMinus />,
    labelKey: "compliance.notApplicable",
  },
}

export function DeviceComplianceTag({ resultType }: DeviceComplianceTagProps) {
  const { t } = useTranslation()
  const config = mapping[resultType]

  if (!config) return null

  return (
    <Badge variant="surface" colorPalette={config.colorPalette} size="md" display="inline-flex" alignItems="center" gap="1">
      <Icon size="sm" flexShrink={0}>{config.icon}</Icon>
      {t(config.labelKey)}
    </Badge>
  )
}
