import { Protected } from "@/components"
import { LuCrosshair, LuPlus } from "react-icons/lu"
import { Level } from "@/types"
import { Button, Menu, Portal, Separator, Stack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { useDeviceSidebarStore } from "../../stores"
import CreateDeviceButton from "../CreateDeviceButton"
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
    <Stack w="300px" overflow="hidden" gap="0">
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
                <LuPlus />
                {t("device.add")}
              </Button>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content>
                  <CreateDeviceButton
                    renderItem={(open) => (
                      <Menu.Item onSelect={open} value="add-simple-device">
                        <LuPlus />
                        {t("device.addSimple")}
                      </Menu.Item>
                    )}
                  />
                  <DeviceScanSubnetButton
                    renderItem={(open) => (
                      <Menu.Item onSelect={open} value="scan-subnets-for-device">
                        <LuCrosshair />
                        {t("task.scanSubnets")}
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
