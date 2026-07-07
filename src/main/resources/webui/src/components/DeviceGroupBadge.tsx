import { Badge, Icon } from "@chakra-ui/react"
import { LuSquareStack } from "react-icons/lu"
import { Link } from "react-router"

export type DeviceGroupBadgeProps = {
  id: number
  name: string
}

export default function DeviceGroupBadge(props: DeviceGroupBadgeProps) {
  const { id, name } = props

  return (
    <Badge variant="surface" size="md" display="inline-flex" alignItems="center" gap="1" asChild>
      <Link to={`/app/devices?group=${id}`}>
        <Icon size="sm" flexShrink={0}>
          <LuSquareStack />
        </Icon>
        {name}
      </Link>
    </Badge>
  )
}
