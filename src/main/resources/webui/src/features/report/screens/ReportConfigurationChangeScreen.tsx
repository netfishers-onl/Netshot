import { Heading, Stack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { ConfigurationChangeList, ConfigurationChart } from "../components"

export default function ReportConfigurationChangeScreen() {
  const { t } = useTranslation()

  return (
    <Stack gap="8" p="9" flex="1" overflow="auto">
      <Stack direction="row">
        <Heading as="h1" fontSize="4xl">
          {t("device.config.changes")}
        </Heading>
      </Stack>
      <ConfigurationChart />
      <ConfigurationChangeList />
    </Stack>
  )
}
