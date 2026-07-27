import { SidebarSplitter } from "@/components";
import { Outlet } from "react-router";
import { AdministrationSidebar } from "../components";

export default function AdministrationScreen() {
  return (
    <SidebarSplitter sidebar={<AdministrationSidebar />}>
      <Outlet />
    </SidebarSplitter>
  );
}
