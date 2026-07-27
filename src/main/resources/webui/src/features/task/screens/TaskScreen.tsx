import { SidebarSplitter } from "@/components"
import { Outlet } from "react-router"
import TaskSidebar from "../components/TaskSidebar"

export default function TaskScreen() {
  return (
    <SidebarSplitter sidebar={<TaskSidebar />}>
      <Outlet />
    </SidebarSplitter>
  )
}
