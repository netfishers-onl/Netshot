import { Badge, Icon } from "@chakra-ui/react"
import { LuHammer, LuZap, LuZapOff } from "react-icons/lu"
import { useTranslation } from "react-i18next"
import { DeviceStatus } from "@/types"

type Config = {
  colorPalette: string
  icon: React.ReactElement
  labelKey: string
}

const STATUS_CONFIG: Record<DeviceStatus, Config> = {
  [DeviceStatus.Production]: {
    colorPalette: "green",
    icon: <LuZap />,
    labelKey: "device.status.production",
  },
  [DeviceStatus.Disabled]: {
    colorPalette: "red",
    icon: <LuZapOff />,
    labelKey: "common.disabled",
  },
  [DeviceStatus.PreProduction]: {
    colorPalette: "orange",
    icon: <LuHammer />,
    labelKey: "device.status.preproduction",
  },
}

type DeviceStatusBadgeProps = {
  status: DeviceStatus
}

export default function DeviceStatusBadge({ status }: DeviceStatusBadgeProps) {
  const { t } = useTranslation()
  const config = STATUS_CONFIG[status]

  if (!config) return null

  return (
    <Badge variant="surface" colorPalette={config.colorPalette} size="md" display="inline-flex" alignItems="center" gap="1">
      <Icon size="sm" flexShrink={0}>{config.icon}</Icon>
      {t(config.labelKey)}
    </Badge>
  )
}
