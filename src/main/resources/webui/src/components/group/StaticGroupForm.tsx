import { Heading, Stack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import StaticGroupList from "./StaticGroupList"

export default function StaticGroupForm() {
  const { t } = useTranslation()

  return (
    <Stack flex="1" gap="5" overflow="auto">
      <Heading as="h4" size="md">
        {t("common.selectedDevices")}
      </Heading>
      <StaticGroupList />
    </Stack>
  )
}
