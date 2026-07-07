import { Separator, Stack } from "@chakra-ui/react"
import { Outlet } from "react-router"
import { DiagnosticSidebar } from "../components/sidebar"

export default function DiagnosticScreen() {
  return (
    <Stack direction="row" flex="1" overflow="auto" gap="0">
      <DiagnosticSidebar />
      <Separator orientation="vertical" />
      <Stack flex="1" overflow="auto">
        <Outlet />
      </Stack>
    </Stack>
  )
}
