import { Navbar } from "@/components";
import { DashboardProvider } from "@/contexts";
import { Stack } from "@chakra-ui/react";
import { Outlet } from "react-router-dom";

export default function MainScreen() {
  return (
    <DashboardProvider>
      <Stack h="100vh" spacing="0">
        <Navbar />
        <Stack as="main" flex="1" overflow="auto">
          <Outlet />
        </Stack>
      </Stack>
    </DashboardProvider>
  );
}
