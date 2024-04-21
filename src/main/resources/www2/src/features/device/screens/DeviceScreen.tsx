import { Divider, Stack } from "@chakra-ui/react";
import { Outlet } from "react-router-dom";
import { DeviceSidebar } from "../components";

export default function DeviceScreen() {
  return (
    <Stack direction="row" flex="1" overflow="auto" spacing="0">
      <DeviceSidebar />
      <Divider orientation="vertical" />
      <Stack flex="1" overflow="auto">
        <Outlet />
      </Stack>
    </Stack>
  );
}
