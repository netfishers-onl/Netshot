import { Divider, Stack } from "@chakra-ui/react";
import { Outlet } from "react-router-dom";
import { DeviceSidebar } from "../components";
import DeviceSidebarProvider, {
  DeviceSidebarContext,
} from "../contexts/DeviceSidebarProvider";
import DeviceBulkActionScreen from "./DeviceBulkActionScreen";

export default function DeviceScreen() {
  return (
    <DeviceSidebarProvider>
      <Stack direction="row" flex="1" overflow="auto" spacing="0">
        <DeviceSidebar />
        <Divider orientation="vertical" />
        <Stack flex="1" overflow="auto">
          <DeviceSidebarContext.Consumer>
            {({ selected }) => (
              <>
                {selected?.length > 1 ? <DeviceBulkActionScreen /> : <Outlet />}
              </>
            )}
          </DeviceSidebarContext.Consumer>
        </Stack>
      </Stack>
    </DeviceSidebarProvider>
  );
}
