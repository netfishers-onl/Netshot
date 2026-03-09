import { Steps, Stack, Separator } from "@chakra-ui/react";
import { Outlet } from "react-router";
import { Sidebar } from "../components";

export default function AdministrationScreen() {
  return (
    <Stack direction="row" flex="1" overflow="auto" gap="0">
      <Sidebar />
      <Separator orientation="vertical" />
      <Stack flex="1" overflow="auto">
        <Outlet />
      </Stack>
    </Stack>
  );
}
