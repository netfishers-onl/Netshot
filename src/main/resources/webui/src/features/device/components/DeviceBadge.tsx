import { BadgeProps, Icon } from "@chakra-ui/react"
import { forwardRef, type ReactNode } from "react"
import { LuSquircle } from "react-icons/lu"
import { DeviceNetworkClass } from "@/types"
import IconBadge from "@/components/IconBadge"
import DeviceNetworkClassIcon from "./DeviceNetworkClassIcon"

type DeviceBadgeProps = Omit<BadgeProps, "children"> & {
  /** Omit when the device's class isn't known here, rather than detected as unknown: shows a generic device icon. */
  networkClass?: DeviceNetworkClass
  children?: ReactNode
}

const DeviceBadge = forwardRef<HTMLSpanElement, DeviceBadgeProps>(
  ({ networkClass, children, ...rest }, ref) => (
    <IconBadge ref={ref} {...rest}>
      {networkClass ? (
        <DeviceNetworkClassIcon networkClass={networkClass} size="sm" flexShrink={0} />
      ) : (
        <Icon size="sm" flexShrink={0}>
          <LuSquircle />
        </Icon>
      )}
      {children}
    </IconBadge>
  )
)

export default DeviceBadge
