import { SidebarSplitter } from "@/components"
import { Outlet } from "react-router"
import { DiagnosticSidebar } from "../components/sidebar"

export default function DiagnosticScreen() {
  return (
    <SidebarSplitter sidebar={<DiagnosticSidebar />}>
      <Outlet />
    </SidebarSplitter>
  )
}
