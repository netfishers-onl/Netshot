import { DeviceComplianceResultType } from "@/types"
import { Tag } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

export type DeviceComplianceTagProps = {
  resultType: DeviceComplianceResultType
}

const mapping = {
  [DeviceComplianceResultType.Conforming]: {
    colorPalette: "green",
    label: "compliant",
  },
  [DeviceComplianceResultType.NonConfirming]: {
    colorPalette: "red",
    label: "nonCompliant2",
  },
  [DeviceComplianceResultType.Disabled]: {
    colorPalette: "grey",
    label: "disabled",
  },
  [DeviceComplianceResultType.Exempted]: {
    colorPalette: "blue",
    label: "exempted",
  },
  [DeviceComplianceResultType.InvalidRule]: {
    colorPalette: "yellow",
    label: "invalidRule",
  },
  [DeviceComplianceResultType.NotApplication]: {
    colorPalette: "grey",
    label: "notApplicable",
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
