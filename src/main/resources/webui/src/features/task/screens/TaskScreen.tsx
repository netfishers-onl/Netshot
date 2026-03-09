import { Separator, Stack } from "@chakra-ui/react"
import { Outlet } from "react-router"
import { TaskSidebar } from "../components"

export default function TaskScreen() {
  return (
    <Stack direction="row" flex="1" overflow="auto" gap="0">
      <TaskSidebar />
      <Separator orientation="vertical" />
      <Stack flex="1" overflow="auto">
        <Outlet />
      </Stack>
    </Stack>
  )
}
