import { BadgeProps, Icon, Span } from "@chakra-ui/react"
import { forwardRef } from "react"
import { LuSquareStack } from "react-icons/lu"
import { Link } from "react-router"
import IconBadge from "@/components/IconBadge"

export type DeviceGroupBadgeProps = Omit<BadgeProps, "id"> & {
  id: number
  name: string
}

const DeviceGroupBadge = forwardRef<HTMLSpanElement, DeviceGroupBadgeProps>(
  ({ id, name, ...rest }, ref) => (
    <IconBadge ref={ref} {...rest} asChild>
      <Link to={`/app/devices?group=${id}`}>
        <Icon size="sm" flexShrink={0}>
          <LuSquareStack />
        </Icon>
        <Span minW="0" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
          {name}
        </Span>
      </Link>
    </IconBadge>
  )
)

export default DeviceGroupBadge
