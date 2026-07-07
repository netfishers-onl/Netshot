import { Separator, Stack } from "@chakra-ui/react"
import { Outlet } from "react-router"
import { ComplianceSidebar } from "../components/sidebar"

export default function ComplianceScreen() {
  return (
    <Stack direction="row" flex="1" overflow="auto" gap="0">
      <ComplianceSidebar />
      <Separator orientation="vertical" />
      <Stack flex="1" overflow="auto">
        <Outlet />
      </Stack>
    </Stack>
  )
}
