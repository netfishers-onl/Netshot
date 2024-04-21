import { Divider, Stack } from "@chakra-ui/react";
import { Outlet } from "react-router-dom";
import { ReportSidebar } from "../components";

export default function ReportScreen() {
  return (
    <Stack direction="row" flex="1" overflow="auto" spacing="0">
      <ReportSidebar />
      <Divider orientation="vertical" />
      <Stack flex="1" overflow="auto">
        <Outlet />
      </Stack>
    </Stack>
  );
}
