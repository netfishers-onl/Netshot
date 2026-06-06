import { Stack } from "@chakra-ui/react"
import { SettingGeneralPanel } from "./SettingGeneralPanel"

export function SettingModal() {
  return (
    <Stack h="70dvh" overflow="auto">
      <SettingGeneralPanel />
    </Stack>
  )
}
