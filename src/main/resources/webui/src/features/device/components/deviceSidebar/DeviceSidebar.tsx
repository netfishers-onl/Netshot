import { Protected } from "@/components";
import Icon from "@/components/Icon";
import { Level } from "@/types";
import {
  Button,
  Divider,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Stack,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { DeviceSidebarContext } from "../../contexts/device-sidebar";
import DeviceCreateButton from "../DeviceCreateButton";
import DeviceScanSubnetButton from "../DeviceScanSubnetButton";
import DeviceSidebarGroup from "./DeviceSidebarGroup";
import DeviceSidebarList from "./DeviceSidebarList";
import DeviceSidebarListToolbar from "./DeviceSidebarListToolbar";
import DeviceSidebarSearch from "./DeviceSidebarSearch";
import DeviceSidebarSearchList from "./DeviceSidebarSearchList";

export default function DeviceSidebar() {
  const { t } = useTranslation();

  return (
    <Stack w="300px" overflow="auto" spacing="0">
      <DeviceSidebarContext.Consumer>
        {({ query }) => (
          <>
            <DeviceSidebarSearch />
            <Divider />
            {query ? null : (
              <>
                <DeviceSidebarGroup />
                <Divider />
              </>
            )}

            <DeviceSidebarListToolbar />
            <Divider />
            {query ? <DeviceSidebarSearchList /> : <DeviceSidebarList />}

            <Protected minLevel={Level.Operator}>
              <Divider />
              <Stack p="6">
                <Menu matchWidth>
                  <MenuButton as={Button} leftIcon={<Icon name="plus" />}>
                    {t("Add device")}
                  </MenuButton>
                  <MenuList>
                    <DeviceCreateButton
                      renderItem={(open) => (
                        <MenuItem icon={<Icon name="plus" />} onClick={open}>
                          {t("Add simple device")}
                        </MenuItem>
                      )}
                    />
                    <DeviceScanSubnetButton
                      renderItem={(open) => (
                        <MenuItem icon={<Icon name="wifi" />} onClick={open}>
                          {t("Scan subnets for devices")}
                        </MenuItem>
                      )}
                    />
                  </MenuList>
                </Menu>
              </Stack>
            </Protected>
          </>
        )}
      </DeviceSidebarContext.Consumer>
    </Stack>
  );
}
