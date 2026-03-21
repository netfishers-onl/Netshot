import { Protected } from "@/components"
import Icon from "@/components/Icon"
import { Level } from "@/types"
import { Button, Menu, Portal, Separator, Stack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { useDeviceSidebarStore } from "../../stores"
import DeviceCreateButton from "../DeviceCreateButton"
import DeviceScanSubnetButton from "../DeviceScanSubnetButton"
import DeviceSidebarGroup from "./DeviceSidebarGroup"
import DeviceSidebarList from "./DeviceSidebarList"
import DeviceSidebarListToolbar from "./DeviceSidebarListToolbar"
import DeviceSidebarSearch from "./DeviceSidebarSearch"
import DeviceSidebarSearchList from "./DeviceSidebarSearchList"

export default function DeviceSidebar() {
  const { t } = useTranslation()
  const query = useDeviceSidebarStore((state) => state.query)

  return (
    <Stack w="300px" overflow="auto" gap="0">
      <DeviceSidebarSearch />
      <Separator />
      {query ? null : (
        <>
          <DeviceSidebarGroup />
          <Separator />
        </>
      )}

      <DeviceSidebarListToolbar />
      <Separator />
      {query ? <DeviceSidebarSearchList /> : <DeviceSidebarList />}

      <Protected minLevel={Level.Operator}>
        <Separator />
        <Stack p="6">
          <Menu.Root positioning={{ sameWidth: true }}>
            <Menu.Trigger asChild>
              <Button>
                <Icon name="plus" />
                {t("addDevice")}
              </Button>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content>
                  <DeviceCreateButton
                    renderItem={(open) => (
                      <Menu.Item onSelect={open} value="add-simple-device">
                        <Icon name="plus" />
                        {t("addSimpleDevice")}
                      </Menu.Item>
                    )}
                  />
                  <DeviceScanSubnetButton
                    renderItem={(open) => (
                      <Menu.Item onSelect={open} value="scan-subnets-for-device">
                        <Icon name="crosshair" />
                        {t("scanSubnetsForDevices")}
                      </Menu.Item>
                    )}
                  />
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
        </Stack>
      </Protected>
    </Stack>
  )
}
