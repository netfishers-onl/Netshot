import { Badge, Icon } from "@chakra-ui/react"
import { LuTrophy, LuCircleX } from "react-icons/lu"
import { useTranslation } from "react-i18next"
import { DeviceSoftwareLevel } from "@/types"

type Config = {
  colorPalette: string
  icon: React.ReactElement
  labelKey: string
}

const LEVEL_CONFIG: Record<DeviceSoftwareLevel, Config> = {
  [DeviceSoftwareLevel.GOLD]: {
    colorPalette: "gold",
    icon: <LuTrophy />,
    labelKey: "compliance.software.gold",
  },
  [DeviceSoftwareLevel.SILVER]: {
    colorPalette: "silver",
    icon: <LuTrophy />,
    labelKey: "compliance.software.silver",
  },
  [DeviceSoftwareLevel.BRONZE]: {
    colorPalette: "bronze",
    icon: <LuTrophy />,
    labelKey: "compliance.software.bronze",
  },
  [DeviceSoftwareLevel.NON_COMPLIANT]: {
    colorPalette: "red",
    icon: <LuCircleX />,
    labelKey: "compliance.nonCompliant",
  },
  [DeviceSoftwareLevel.UNKNOWN]: {
    colorPalette: "red",
    icon: <LuCircleX />,
    labelKey: "compliance.nonCompliant",
  },
}

type DeviceSoftwareLevelBadgeProps = {
  level: DeviceSoftwareLevel
}

export default function DeviceSoftwareLevelBadge({ level }: DeviceSoftwareLevelBadgeProps) {
  const { t } = useTranslation()
  const config = LEVEL_CONFIG[level]

  if (!config) return null

  return (
    <Badge variant="surface" colorPalette={config.colorPalette} size="md" display="inline-flex" alignItems="center" gap="1">
      <Icon size="sm" flexShrink={0}>{config.icon}</Icon>
      {t(config.labelKey)}
    </Badge>
  )
}
