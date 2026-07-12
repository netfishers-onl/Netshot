import { Badge, type BadgeProps, Icon } from "@chakra-ui/react"
import { type ReactNode } from "react"
import { LuSquircle } from "react-icons/lu"
import { DeviceNetworkClass } from "@/types"
import DeviceNetworkClassIcon from "./DeviceNetworkClassIcon"

type DeviceBadgeProps = Omit<BadgeProps, "children"> & {
  /** Omit when the device's class isn't known here, rather than detected as unknown: shows a generic device icon. */
  networkClass?: DeviceNetworkClass
  children?: ReactNode
}

export default function DeviceBadge({ networkClass, children, ...badgeProps }: DeviceBadgeProps) {
  return (
    <Badge variant="surface" size="md" display="inline-flex" alignItems="center" gap="1" {...badgeProps}>
      {networkClass ? (
        <DeviceNetworkClassIcon networkClass={networkClass} size="sm" flexShrink={0} />
      ) : (
        <Icon size="sm" flexShrink={0}>
          <LuSquircle />
        </Icon>
      )}
      {children}
    </Badge>
  )
}
