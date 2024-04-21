import { Divider, Stack } from "@chakra-ui/react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/sidebar";

export default function ComplianceScreen() {
  return (
    <Stack direction="row" flex="1" overflow="auto" spacing="0">
      <Sidebar />
      <Divider orientation="vertical" />
      <Stack flex="1" overflow="auto">
        <Outlet />
      </Stack>
    </Stack>
  );
}
