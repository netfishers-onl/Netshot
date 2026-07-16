import { Badge, type BadgeProps } from "@chakra-ui/react"
import { forwardRef } from "react"

/** Shared styling base for all badge components: surface variant, md size, icon+label layout. */
const IconBadge = forwardRef<HTMLSpanElement, BadgeProps>((props, ref) => (
  <Badge ref={ref} variant="surface" size="md" display="inline-flex" alignItems="center" gap="1" {...props} />
))

export default IconBadge
