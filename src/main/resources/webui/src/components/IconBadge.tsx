import { Badge, type BadgeProps } from "@chakra-ui/react"
import { type Ref } from "react"

type IconBadgeProps = BadgeProps & { ref?: Ref<HTMLSpanElement> }

/** Shared styling base for all badge components: surface variant, md size, icon+label layout. */
export default function IconBadge({ ref, ...props }: IconBadgeProps) {
  return <Badge ref={ref} variant="surface" size="md" display="inline-flex" alignItems="center" gap="1" {...props} />
}
