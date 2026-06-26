import { Protected } from "@/components"
import { LuCamera, LuSquarePen, LuChevronDown, LuPlay, LuRefreshCcw, LuTrash, LuZap, LuZapOff } from "react-icons/lu"
import { RouterTab, RouterTabs } from "@/components/routerTab"
import { useToast } from "@/hooks"
import { DeviceStatus, DeviceType, Level } from "@/types"
import { Box, Button, Flex, Group, Heading, Icon, IconButton, Menu, Portal, Skeleton, Spacer, Stack } from "@chakra-ui/react"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Outlet, useParams } from "react-router"
import { useDevice, useDeviceTypes } from "../api"
import {
  DeviceNetworkClassIcon,
  DisableDeviceTrigger,
  EditDeviceTrigger,
  EnableDeviceTrigger,
  RemoveDeviceTrigger,
} from "../components"
import OpenDeviceScriptTrigger from "../components/OpenDeviceScriptTrigger"
import DeviceSnapshotTrigger from "../components/DeviceSnapshotTrigger"
import DeviceProvider from "../contexts/DeviceProvider"

export default function DeviceDetailScreen() {
  const { id } = useParams()
  const { t } = useTranslation()
  const toast = useToast()

  const { data: device, isPending, refetch } = useDevice(+id)
  const { data: deviceTypes, isPending: isDeviceTypePending } = useDeviceTypes()

  const refresh = useCallback(async () => {
    const toastId = toast.loading({
      title: t("common.loading"),
      description: t("device.pleaseWaitRefreshing"),
    })
    await refetch()
    toast.close(toastId)
  }, [refetch, toast, t])

  const isDisabled = useMemo(() => device?.status === DeviceStatus.Disabled, [device?.status])

  const deviceType = useMemo<DeviceType>(() => {
    return deviceTypes?.find((t) => t.name === device?.driver)
  }, [device?.driver, deviceTypes])

  return (
    <DeviceProvider device={device} type={deviceType} isLoading={isPending || isDeviceTypePending}>
      <Stack gap="0" flex="1" overflow="auto">
        <Stack gap="5" px="9" pt="9">
          <Flex alignItems="center">
            <Skeleton loading={isPending}>
              <Stack direction="row" alignItems="center" gap="3">
                {device?.networkClass && (
                  <DeviceNetworkClassIcon networkClass={device.networkClass} size="2xl" />
                )}
                <Heading as="h1" fontSize="4xl">
                  {device?.name ?? t("common.networkDeviceTitle")}
                </Heading>
              </Stack>
            </Skeleton>

            <Spacer />
            <Stack direction="row" gap="3">
              <Protected minLevel={Level.Operator}>
                <Skeleton loading={isPending}>
                  <DeviceSnapshotTrigger devices={[device]}>
                    <Button variant="primary">
                      <LuCamera />
                      {t("device.snapshot.take")}
                    </Button>
                  </DeviceSnapshotTrigger>
                </Skeleton>
              </Protected>

              <Protected minLevel={Level.ReadWrite}>
                <Skeleton loading={isPending}>
                  <Menu.Root positioning={{ placement: "bottom-end" }}>
                    <Group attached>
                      <EditDeviceTrigger device={device}>
                        <Button>
                          <LuSquarePen />
                          {t("common.edit")}
                        </Button>
                      </EditDeviceTrigger>
                      <Menu.Trigger asChild>
                        <IconButton>
                          <LuChevronDown />
                        </IconButton>
                      </Menu.Trigger>
                    </Group>

                    <Portal>
                      <Menu.Positioner>
                        <Menu.Content>
                          {device && (
                            <>
                              <Protected minLevel={Level.ExecureReadWrite}>
                                <OpenDeviceScriptTrigger devices={[device]}>
                                  <Menu.Item value="run-script">
                                    <LuPlay />
                                    {t("script.run")}
                                  </Menu.Item>
                                </OpenDeviceScriptTrigger>
                              </Protected>
                              {isDisabled ? (
                                <EnableDeviceTrigger devices={[device]}>
                                  <Menu.Item value="enable">
                                    <LuZap />
                                    {t("common.enable")}
                                  </Menu.Item>
                                </EnableDeviceTrigger>
                              ) : (
                                <DisableDeviceTrigger devices={[device]}>
                                  <Menu.Item value="disable">
                                    <LuZapOff />
                                    {t("common.disable")}
                                  </Menu.Item>
                                </DisableDeviceTrigger>
                              )}

                              <Menu.Item onSelect={refresh} value="refresh">
                                <LuRefreshCcw />
                                {t("common.refresh")}
                              </Menu.Item>

                              <RemoveDeviceTrigger devices={[device]}>
                                <Menu.Item value="remove" color="fg.error" _hover={{ bg: "bg.error", color: "fg.error" }}>
                                  <LuTrash />
                                  {t("common.remove")}
                                </Menu.Item>
                              </RemoveDeviceTrigger>
                            </>
                          )}
                        </Menu.Content>
                      </Menu.Positioner>
                    </Portal>
                  </Menu.Root>
                </Skeleton>
              </Protected>
            </Stack>
          </Flex>

          <RouterTabs>
            <RouterTab to="general">{t("common.general")}</RouterTab>
            <RouterTab to="configurations">{t("device.config.label")}</RouterTab>
            <RouterTab to="interfaces">{t("device.interface.list")}</RouterTab>
            <RouterTab to="modules">{t("device.module.list")}</RouterTab>
            <RouterTab to="diagnostics">{t("diagnostic.list")}</RouterTab>
            <RouterTab to="compliance">{t("compliance.label")}</RouterTab>
            <RouterTab to="tasks">{t("task.list")}</RouterTab>
          </RouterTabs>
        </Stack>
        <Stack flex="1" overflow="auto" p="9">
          <Outlet />
        </Stack>
      </Stack>
    </DeviceProvider>
  )
}
