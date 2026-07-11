import { Badge, type BadgeProps, Icon, Span } from "@chakra-ui/react"
import { LuSquareStack } from "react-icons/lu"
import { Link } from "react-router"

export type DeviceGroupBadgeProps = Omit<BadgeProps, "id"> & {
  id: number
  name: string
}

export default function DeviceGroupBadge(props: DeviceGroupBadgeProps) {
  const { id, name, ...badgeProps } = props

  return (
    <Badge variant="surface" size="md" display="inline-flex" alignItems="center" gap="1" {...badgeProps} asChild>
      <Link to={`/app/devices?group=${id}`}>
        <Icon size="sm" flexShrink={0}>
          <LuSquareStack />
        </Icon>
        <Span minW="0" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
          {name}
        </Span>
      </Link>
    </Badge>
  )
}
