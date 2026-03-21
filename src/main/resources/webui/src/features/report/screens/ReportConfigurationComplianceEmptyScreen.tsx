import { EmptyResult } from "@/components"
import { Stack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

export default function ReportConfigurationComplianceEmptyScreen() {
  const { t } = useTranslation()

  return (
    <Stack flex="1" alignItems="center" justifyContent="center">
      <EmptyResult
        title={t("selectGroupToBegin")}
        description={t("hereYouCanVisualizeDeviceComplianceStatusPerGroup")}
      />
    </Stack>
  )
}
