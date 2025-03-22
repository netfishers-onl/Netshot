import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { Protected } from "@/components";
import Icon from "@/components/Icon";
import { RouterTab, RouterTabs } from "@/components/routerTab";
import { useToast } from "@/hooks";
import { DeviceStatus, Level } from "@/types";
import {
  Button,
  Flex,
  Heading,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Skeleton,
  Spacer,
  Stack,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useNavigate, useParams } from "react-router";
import {
  DeviceDisableButton,
  DeviceEditButton,
  DeviceEnableButton,
  DeviceRemoveButton,
} from "../components";
import DeviceRunScriptButton from "../components/DeviceRunScriptButton";
import DeviceSnapshotButton from "../components/DeviceSnapshotButton";
import { QUERIES } from "../constants";
import DeviceProvider from "../contexts/DeviceProvider";

export default function DeviceDetailScreen() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();

  const {
    data: device,
    isPending,
    refetch,
  } = useQuery({
    queryKey: [QUERIES.DEVICE_DETAIL, +id],
    queryFn: async () => api.device.getById(+id),
  });

  const refresh = useCallback(async () => {
    const toastId = toast.loading({
      title: t("Loading"),
      description: t("Please wait, refresh device data"),
    });
    await refetch();
    toast.close(toastId);
  }, [refetch, toast, t]);

  const isDisabled = useMemo(
    () => device?.status === DeviceStatus.Disabled,
    [device?.status]
  );

  return (
    <DeviceProvider device={device} isLoading={isPending}>
      <Stack spacing="0" flex="1" overflow="auto">
        <Stack spacing="5" px="9" pt="9">
          <Flex alignItems="center">
            <Skeleton isLoaded={!isPending}>
              <Heading as="h1" fontSize="4xl">
                {device?.name ?? "Network device title"}
              </Heading>
            </Skeleton>

            <Spacer />
            <Stack direction="row" spacing="3">
             <Protected minLevel={Level.Operator}>
                <Skeleton isLoaded={!isPending}>
                  <DeviceSnapshotButton
                    devices={[device]}
                    renderItem={(open) => (
                      <Button
                        variant="primary"
                        onClick={open}
                        leftIcon={<Icon name="camera" />}
                      >
                        {t("Take snapshot")}
                      </Button>
                    )}
                  />
                </Skeleton>
              </Protected>

              <Menu>
                <Skeleton isLoaded={!isPending}>
                  <MenuButton
                    as={Button}
                    rightIcon={<Icon name="moreHorizontal" />}
                  >
                    {t("Actions")}
                  </MenuButton>
                </Skeleton>

                <MenuList>
                  {device && (
                    <>
                      <Protected minLevel={Level.ExecureReadWrite}>
                        <DeviceRunScriptButton
                          devices={[device]}
                          renderItem={(open) => (
                            <MenuItem
                              icon={<Icon name="play" />}
                              onClick={open}
                            >
                              {t("Run script")}
                            </MenuItem>
                          )}
                        />
                      </Protected>
                      <Protected minLevel={Level.ReadWrite}>
                        <DeviceEditButton
                          device={device}
                          renderItem={(open) => (
                            <MenuItem
                              icon={<Icon name="edit" />}
                              onClick={open}
                            >
                              {t("Edit")}
                            </MenuItem>
                          )}
                        />
                        {isDisabled ? (
                          <DeviceEnableButton
                            devices={[device]}
                            renderItem={(open) => (
                              <MenuItem
                                icon={<Icon name="zap" />}
                                onClick={open}
                              >
                                {t("Enable")}
                              </MenuItem>
                            )}
                          />
                        ) : (
                          <DeviceDisableButton
                            devices={[device]}
                            renderItem={(open) => (
                              <MenuItem
                                icon={<Icon name="zapOff" />}
                                onClick={open}
                              >
                                {t("Disable")}
                              </MenuItem>
                            )}
                          />
                        )}
                      </Protected>

                      <MenuItem
                        icon={<Icon name="refreshCcw" />}
                        onClick={refresh}
                      >
                        {t("Refresh")}
                      </MenuItem>

                      <Protected minLevel={Level.ReadWrite}>
                        <DeviceRemoveButton
                          devices={[device]}
                          renderItem={(open) => (
                            <MenuItem
                              icon={<Icon name="trash" />}
                              onClick={open}
                            >
                              {t("Remove")}
                            </MenuItem>
                          )}
                        />
                      </Protected>
                    </>
                  )}
                </MenuList>
              </Menu>
            </Stack>
          </Flex>

          <RouterTabs>
            <RouterTab to="general">{t("General")}</RouterTab>
            <RouterTab to="configurations">{t("Configuration")}</RouterTab>
            <RouterTab to="interfaces">{t("Interfaces")}</RouterTab>
            <RouterTab to="modules">{t("Modules")}</RouterTab>
            <RouterTab to="diagnostics">{t("Diagnostics")}</RouterTab>
            <RouterTab to="compliance">{t("Compliance")}</RouterTab>
            <RouterTab to="tasks">{t("Tasks")}</RouterTab>
          </RouterTabs>
        </Stack>
        <Stack flex="1" overflow="auto" p="9">
          <Outlet />
        </Stack>
      </Stack>
    </DeviceProvider>
  );
}
