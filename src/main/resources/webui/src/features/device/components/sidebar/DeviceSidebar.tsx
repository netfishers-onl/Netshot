import { AddGroupTrigger, Protected } from "@/components"
import { LuChevronUp, LuCrosshair, LuGrid2X2Plus, LuPlus, LuWorkflow } from "react-icons/lu"
import { Level } from "@/types"
import { Button, Group, IconButton, Menu, Portal, Separator, Stack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import AddTaskTrigger from "@/features/task/components/AddTaskTrigger"
import { useDeviceSidebarStore } from "../../stores"
import CreateDeviceTrigger from "../CreateDeviceTrigger"
import DeviceScanSubnetTrigger from "../DeviceScanSubnetTrigger"
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
      <DeviceSidebarListToolbar />
      <Separator />
      {query ? <DeviceSidebarSearchList /> : <DeviceSidebarList />}

      <Protected minLevel={Level.Operator}>
        <Separator />
        <Stack p="6">
          <Menu.Root positioning={{ placement: "top" }}>
            <Group attached w="full">
              <CreateDeviceTrigger>
                <Button flex="1">
                  <LuPlus />
                  {t("device.add")}
                </Button>
              </CreateDeviceTrigger>
              <Menu.Trigger asChild>
                <IconButton aria-label={t("common.actions")}>
                  <LuChevronUp />
                </IconButton>
              </Menu.Trigger>
            </Group>
            <Portal>
              <Menu.Positioner>
                <Menu.Content>
                  <DeviceScanSubnetTrigger>
                    <Menu.Item value="scan-subnets-for-device">
                      <LuCrosshair />
                      {t("task.scanSubnets")}
                    </Menu.Item>
                  </DeviceScanSubnetTrigger>
                  <AddTaskTrigger>
                    <Menu.Item value="run-new-group-task">
                      <LuWorkflow />
                      {t("task.runNewGroupTask")}
                    </Menu.Item>
                  </AddTaskTrigger>
                  <AddGroupTrigger>
                    <Menu.Item value="add-group">
                      <LuGrid2X2Plus />
                      {t("group.add")}
                    </Menu.Item>
                  </AddGroupTrigger>
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
        </Stack>
      </Protected>
    </Stack>
  )
}
