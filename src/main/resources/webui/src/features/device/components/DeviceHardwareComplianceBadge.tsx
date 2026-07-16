import { BadgeProps, Icon } from "@chakra-ui/react"
import { forwardRef } from "react"
import { LuShieldCheck, LuShieldAlert, LuShieldOff } from "react-icons/lu"
import { useTranslation } from "react-i18next"
import IconBadge from "@/components/IconBadge"

type Config = {
  colorPalette: string
  icon: React.ReactElement
  labelKey: string
}

export const DEVICE_HARDWARE_COMPLIANCE_CONFIG: Record<"endOfLife" | "endOfSale" | "upToDate", Config> = {
  endOfLife: {
    colorPalette: "red",
    icon: <LuShieldOff />,
    labelKey: "compliance.hardware.endOfLife",
  },
  endOfSale: {
    colorPalette: "orange",
    icon: <LuShieldAlert />,
    labelKey: "compliance.hardware.endOfSale",
  },
  upToDate: {
    colorPalette: "green",
    icon: <LuShieldCheck />,
    labelKey: "common.upToDate",
  },
}

type DeviceHardwareComplianceBadgeProps = BadgeProps & {
  eol: boolean
  eos: boolean
}

const DeviceHardwareComplianceBadge = forwardRef<HTMLSpanElement, DeviceHardwareComplianceBadgeProps>(
  ({ eol, eos, ...rest }, ref) => {
    const { t } = useTranslation()
    const config = DEVICE_HARDWARE_COMPLIANCE_CONFIG[eol ? "endOfLife" : eos ? "endOfSale" : "upToDate"]

    return (
      <IconBadge ref={ref} colorPalette={config.colorPalette} {...rest}>
        <Icon size="sm" flexShrink={0}>{config.icon}</Icon>
        {t(config.labelKey)}
      </IconBadge>
    )
  }
)

export default DeviceHardwareComplianceBadge
