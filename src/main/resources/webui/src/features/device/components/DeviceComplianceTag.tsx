import { DeviceComplianceResultType } from "@/types"
import { Tag } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

export type DeviceComplianceTagProps = {
  resultType: DeviceComplianceResultType
}

const mapping = {
  [DeviceComplianceResultType.Conforming]: {
    colorPalette: "green",
    label: "Compliant",
  },
  [DeviceComplianceResultType.NonConfirming]: {
    colorPalette: "red",
    label: "Non-compliant",
  },
  [DeviceComplianceResultType.Disabled]: {
    colorPalette: "grey",
    label: "Disabled",
  },
  [DeviceComplianceResultType.Exempted]: {
    colorPalette: "blue",
    label: "Exempted",
  },
  [DeviceComplianceResultType.InvalidRule]: {
    colorPalette: "yellow",
    label: "Invalid rule",
  },
  [DeviceComplianceResultType.NotApplication]: {
    colorPalette: "grey",
    label: "Not applicable",
  },
}

export function DeviceComplianceTag({ resultType }: DeviceComplianceTagProps) {
  const { t } = useTranslation()

  const config = mapping[resultType]

  if (!config) {
    return null
  }

  return (
    <Tag.Root colorPalette={config.colorPalette} size="lg">
      <Tag.Label>{t(config.label)}</Tag.Label>
    </Tag.Root>
  )
}
