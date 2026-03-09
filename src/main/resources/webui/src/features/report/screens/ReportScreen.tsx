import { Steps, Stack, Separator } from "@chakra-ui/react";
import { Outlet } from "react-router";
import { ReportSidebar } from "../components";

export default function ReportScreen() {
  return (
    <Stack direction="row" flex="1" overflow="auto" gap="0">
      <ReportSidebar />
      <Separator orientation="vertical" />
      <Stack flex="1" overflow="auto">
        <Outlet />
      </Stack>
    </Stack>
  );
}
