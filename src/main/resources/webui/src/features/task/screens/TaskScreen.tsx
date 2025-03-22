import { Divider, Stack } from "@chakra-ui/react";
import { Outlet } from "react-router";
import { TaskSidebar } from "../components";

export default function TaskScreen() {
  return (
    <Stack direction="row" flex="1" overflow="auto" spacing="0">
      <TaskSidebar />
      <Divider orientation="vertical" />
      <Stack flex="1" overflow="auto">
        <Outlet />
      </Stack>
    </Stack>
  );
}
