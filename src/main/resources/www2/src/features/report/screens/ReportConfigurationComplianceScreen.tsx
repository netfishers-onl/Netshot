import { Divider, Stack } from "@chakra-ui/react";
import { Outlet } from "react-router-dom";
import { ConfigurationComplianceSidebar } from "../components";
import ConfigurationComplianceProvider from "../contexts/ConfigurationComplianceSidebarProvider";

export default function ReportConfigurationComplianceScreen() {
  return (
    <ConfigurationComplianceProvider>
      <Stack direction="row" flex="1" overflow="auto" spacing="0">
        <ConfigurationComplianceSidebar />
        <Divider orientation="vertical" />
        <Stack flex="1" overflow="auto">
          <Outlet />
        </Stack>
      </Stack>
    </ConfigurationComplianceProvider>
  );
}
