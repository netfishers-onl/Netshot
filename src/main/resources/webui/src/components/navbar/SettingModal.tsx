import { Stack } from "@chakra-ui/react"
import { SettingGeneral } from "./SettingGeneral"

export function SettingModal() {
  return (
    <Stack h="70dvh" overflow="auto">
      <SettingGeneral />
    </Stack>
  )
}
