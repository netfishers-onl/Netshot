import { Stack, Tabs } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { SettingGeneral } from "./SettingGeneral"
import { SettingInterface } from "./SettingInterface"

export function SettingModal() {
  const { t } = useTranslation()

  return (
    <Stack h="70dvh" overflow="auto">
      <Tabs.Root
        defaultValue="general"
        size="lg"
        display="flex"
        flexDirection="column"
        flex="1"
        overflow="auto"
      >
        <Tabs.List>
          <Tabs.Trigger value="general">{t("general")}</Tabs.Trigger>
          <Tabs.Trigger value="ui">{t("interface")}</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content
          value="general"
          p="0"
          display="flex"
          flexDirection="column"
          flex="1"
          overflow="auto"
        >
          <SettingGeneral />
        </Tabs.Content>
        <Tabs.Content
          value="ui"
          p="0"
          display="flex"
          flexDirection="column"
          flex="1"
          overflow="auto"
        >
          <SettingInterface />
        </Tabs.Content>
      </Tabs.Root>
    </Stack>
  )
}
