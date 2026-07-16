import { BadgeProps, Icon } from "@chakra-ui/react"
import { forwardRef } from "react"
import { LuHammer, LuZap, LuZapOff } from "react-icons/lu"
import { useTranslation } from "react-i18next"
import { DeviceStatus } from "@/types"
import IconBadge from "@/components/IconBadge"

type Config = {
  colorPalette: string
  icon: React.ReactElement
  labelKey: string
}

export const DEVICE_STATUS_CONFIG: Record<DeviceStatus, Config> = {
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

type DeviceStatusBadgeProps = BadgeProps & {
  status: DeviceStatus
}

const DeviceStatusBadge = forwardRef<HTMLSpanElement, DeviceStatusBadgeProps>(
  ({ status, ...rest }, ref) => {
    const { t } = useTranslation()
    const config = DEVICE_STATUS_CONFIG[status]

    if (!config) return null

    return (
      <IconBadge ref={ref} colorPalette={config.colorPalette} {...rest}>
        <Icon size="sm" flexShrink={0}>{config.icon}</Icon>
        {t(config.labelKey)}
      </IconBadge>
    )
  }
)

export default DeviceStatusBadge
