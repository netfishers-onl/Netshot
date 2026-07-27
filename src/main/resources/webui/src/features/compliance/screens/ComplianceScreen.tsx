import { SidebarSplitter } from "@/components"
import { Outlet } from "react-router"
import { ComplianceSidebar } from "../components/sidebar"

export default function ComplianceScreen() {
  return (
    <SidebarSplitter sidebar={<ComplianceSidebar />}>
      <Outlet />
    </SidebarSplitter>
  )
}
