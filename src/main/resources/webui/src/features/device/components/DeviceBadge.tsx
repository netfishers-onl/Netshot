import { Badge, type BadgeProps } from "@chakra-ui/react"
import { type ReactNode } from "react"
import { DeviceNetworkClass } from "@/types"
import DeviceNetworkClassIcon from "./DeviceNetworkClassIcon"

type DeviceBadgeProps = Omit<BadgeProps, "children"> & {
  networkClass: DeviceNetworkClass
  children?: ReactNode
}

export default function DeviceBadge({ networkClass, children, ...badgeProps }: DeviceBadgeProps) {
  return (
    <Badge variant="surface" size="md" display="inline-flex" alignItems="center" gap="1" {...badgeProps}>
      <DeviceNetworkClassIcon networkClass={networkClass} size="sm" flexShrink={0} />
      {children}
    </Badge>
  )
}
