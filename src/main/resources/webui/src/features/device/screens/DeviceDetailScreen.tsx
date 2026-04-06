import { Protected } from "@/components"
import Icon from "@/components/Icon"
import { RouterTab, RouterTabs } from "@/components/routerTab"
import { useToast } from "@/hooks"
import { DeviceStatus, DeviceType, Level } from "@/types"
import { Button, Flex, Heading, Menu, Portal, Skeleton, Spacer, Stack } from "@chakra-ui/react"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Outlet, useParams } from "react-router"
import { useDevice, useDeviceTypes } from "../api"
import {
  DeviceDisableButton,
  DeviceEditButton,
  DeviceEnableButton,
  DeviceRemoveButton,
} from "../components"
import DeviceRunScriptButton from "../components/DeviceRunScriptButton"
import DeviceSnapshotButton from "../components/DeviceSnapshotButton"
import DeviceProvider from "../contexts/DeviceProvider"

export default function DeviceDetailScreen() {
  const { id } = useParams()
  const { t } = useTranslation()
  const toast = useToast()

  const { data: device, isPending, refetch } = useDevice(+id)
  const { data: deviceTypes, isPending: isDeviceTypePending } = useDeviceTypes()

  const refresh = useCallback(async () => {
    const toastId = toast.loading({
      title: t("loading"),
      description: t("pleaseWaitRefreshingDeviceData"),
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
              <Heading as="h1" fontSize="4xl">
                {device?.name ?? "Network device title"}
              </Heading>
            </Skeleton>

            <Spacer />
            <Stack direction="row" gap="3">
              <Protected minLevel={Level.Operator}>
                <Skeleton loading={isPending}>
                  <DeviceSnapshotButton
                    devices={[device]}
                    renderItem={(open) => (
                      <Button variant="primary" onClick={open}>
                        <Icon name="camera" />
                        {t("takeSnapshot")}
                      </Button>
                    )}
                  />
                </Skeleton>
              </Protected>

              <Menu.Root>
                <Skeleton loading={isPending}>
                  <Menu.Trigger asChild>
                    <Button>
                      {t("actions")}
                      <Icon name="moreHorizontal" />
                    </Button>
                  </Menu.Trigger>
                </Skeleton>

                <Portal>
                  <Menu.Positioner>
                    <Menu.Content>
                      {device && (
                        <>
                          <Protected minLevel={Level.ExecureReadWrite}>
                            <DeviceRunScriptButton
                              devices={[device]}
                              renderItem={(open) => (
                                <Menu.Item onSelect={open} value="run-script">
                                  <Icon name="play" />
                                  {t("runScript")}
                                </Menu.Item>
                              )}
                            />
                          </Protected>
                          <Protected minLevel={Level.ReadWrite}>
                            <DeviceEditButton
                              device={device}
                              renderItem={(open) => (
                                <Menu.Item onSelect={open} value="edit">
                                  <Icon name="edit" />
                                  {t("edit")}
                                </Menu.Item>
                              )}
                            />
                            {isDisabled ? (
                              <Protected minLevel={Level.ReadWrite}>
                                <DeviceEnableButton
                                  devices={[device]}
                                  renderItem={(open) => (
                                    <Menu.Item onSelect={open} value="enable">
                                      <Icon name="zap" />
                                      {t("enable")}
                                    </Menu.Item>
                                  )}
                                />
                              </Protected>
                            ) : (
                              <DeviceDisableButton
                                devices={[device]}
                                renderItem={(open) => (
                                  <Menu.Item onSelect={open} value="disable">
                                    <Icon name="zapOff" />
                                    {t("disable")}
                                  </Menu.Item>
                                )}
                              />
                            )}
                          </Protected>

                          <Menu.Item onSelect={refresh} value="resfresh">
                            <Icon name="refreshCcw" />
                            {t("refresh")}
                          </Menu.Item>

                          <Protected minLevel={Level.ReadWrite}>
                            <DeviceRemoveButton
                              devices={[device]}
                              renderItem={(open) => (
                                <Menu.Item onSelect={open} value="remove">
                                  <Icon name="trash" />
                                  {t("remove")}
                                </Menu.Item>
                              )}
                            />
                          </Protected>
                        </>
                      )}
                    </Menu.Content>
                  </Menu.Positioner>
                </Portal>
              </Menu.Root>
            </Stack>
          </Flex>

          <RouterTabs>
            <RouterTab to="general">{t("general")}</RouterTab>
            <RouterTab to="configurations">{t("configuration")}</RouterTab>
            <RouterTab to="interfaces">{t("interfaces")}</RouterTab>
            <RouterTab to="modules">{t("modules")}</RouterTab>
            <RouterTab to="diagnostics">{t("diagnostics")}</RouterTab>
            <RouterTab to="compliance">{t("compliance")}</RouterTab>
            <RouterTab to="tasks">{t("tasks")}</RouterTab>
          </RouterTabs>
        </Stack>
        <Stack flex="1" overflow="auto" p="9">
          <Outlet />
        </Stack>
      </Stack>
    </DeviceProvider>
  )
}
