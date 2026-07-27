import { SidebarSplitter } from "@/components";
import { Outlet } from "react-router";
import { ReportSidebar } from "../components";

export default function ReportScreen() {
  return (
    <SidebarSplitter sidebar={<ReportSidebar />}>
      <Outlet />
    </SidebarSplitter>
  );
}
