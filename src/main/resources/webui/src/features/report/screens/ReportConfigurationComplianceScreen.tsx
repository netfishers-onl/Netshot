import { Separator, Stack } from "@chakra-ui/react"
import { Outlet } from "react-router"
import { ConfigurationComplianceSidebar } from "../components"

export default function ReportConfigurationComplianceScreen() {
  return (
    <Stack direction="row" flex="1" overflow="auto" gap="0">
      <ConfigurationComplianceSidebar />
      <Separator orientation="vertical" />
      <Stack flex="1" overflow="auto">
        <Outlet />
      </Stack>
    </Stack>
  )
}
