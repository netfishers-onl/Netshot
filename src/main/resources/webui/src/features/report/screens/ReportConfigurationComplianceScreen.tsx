import { SidebarSplitter } from "@/components"
import { Outlet } from "react-router"
import { ConfigurationComplianceSidebar } from "../components"

export default function ReportConfigurationComplianceScreen() {
  return (
    <SidebarSplitter sidebar={<ConfigurationComplianceSidebar />}>
      <Outlet />
    </SidebarSplitter>
  )
}
