import { Badge, Icon } from "@chakra-ui/react"
import { LuCircleCheck, LuCircleX } from "react-icons/lu"
import { useTranslation } from "react-i18next"

type DeviceConfigComplianceBadgeProps = {
  compliant: boolean
}

export default function DeviceConfigComplianceBadge({ compliant }: DeviceConfigComplianceBadgeProps) {
  const { t } = useTranslation()

  return (
    <Badge
      variant="surface"
      colorPalette={compliant ? "green" : "red"}
      size="md"
      display="inline-flex"
      alignItems="center"
      gap="1"
    >
      <Icon size="sm" flexShrink={0}>
        {compliant ? <LuCircleCheck /> : <LuCircleX />}
      </Icon>
      {t(compliant ? "compliance.compliant" : "compliance.nonCompliant")}
    </Badge>
  )
}
