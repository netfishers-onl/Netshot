import { Button, ButtonGroup, Heading, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

import { Icon, Protected } from "@/components";
import { Level } from "@/types";

import {
  DeviceBulkEditButton,
  DeviceComplianceButton,
  DeviceDiagnosticButton,
  DeviceDisableButton,
  DeviceEnableButton,
  DeviceRemoveButton,
  DeviceSnapshotButton,
} from "../components";
import DeviceRunScriptButton from "../components/DeviceRunScriptButton";
import { useDeviceSidebar } from "../contexts/device-sidebar";

export default function DeviceBulkActionScreen() {
  const ctx = useDeviceSidebar();
  const { t } = useTranslation();

  return (
    <Stack alignItems="center" justifyContent="center" flex="1">
      <Stack spacing="8" w="20%">
        <Stack spacing="3">
          <Heading as="h1" fontSize="4xl">
            {t("Bulk actions")}
          </Heading>
          <Text color="grey.500">
            {t(
              "You've selected {{length}} devices, the following actions apply to all of the selected devices",
              {
                length: ctx.selected.length,
              }
            )}
          </Text>
        </Stack>

        <Stack spacing="2">
          <Protected minLevel={Level.ExecureReadWrite}>
            <DeviceRunScriptButton
              devices={ctx.selected}
              renderItem={(open) => (
                <Button
                  justifyContent="start"
                  leftIcon={<Icon name="play" />}
                  onClick={open}
                >
                  {t("Run script")}
                </Button>
              )}
            />
          </Protected>
          <Protected minLevel={Level.Operator}>
            <DeviceSnapshotButton
              devices={ctx.selected}
              renderItem={(open) => (
                <Button
                  justifyContent="start"
                  leftIcon={<Icon name="camera" />}
                  onClick={open}
                >
                  {t("Take snapshot")}
                </Button>
              )}
            />
          </Protected>
          <Protected minLevel={Level.Operator}>
            <DeviceComplianceButton
              devices={ctx.selected}
              renderItem={(open) => (
                <Button
                  justifyContent="start"
                  leftIcon={<Icon name="checkCircle" />}
                  onClick={open}
                >
                  {t("Check compliance")}
                </Button>
              )}
            />
          </Protected>
          <Protected minLevel={Level.Operator}>
            <DeviceDiagnosticButton
              devices={ctx.selected}
              renderItem={(open) => (
                <Button
                  justifyContent="start"
                  leftIcon={<Icon name="activity" />}
                  onClick={open}
                >
                  {t("Run diagnostics")}
                </Button>
              )}
            />
          </Protected>
          <Protected minLevel={Level.Operator}>
            <DeviceBulkEditButton
              devices={ctx.selected}
              renderItem={(open) => (
                <Button
                  justifyContent="start"
                  leftIcon={<Icon name="edit" />}
                  onClick={open}
                >
                  {t("Edit")}
                </Button>
              )}
            />

            <ButtonGroup isAttached>
              <DeviceEnableButton
                devices={ctx.selected}
                renderItem={(open) => (
                  <Button
                    justifyContent="start"
                    leftIcon={<Icon name="zap" />}
                    onClick={open}
                    flex="1"
                  >
                    {t("Enable")}
                  </Button>
                )}
              />

              <DeviceDisableButton
                devices={ctx.selected}
                renderItem={(open) => (
                  <Button
                    justifyContent="start"
                    leftIcon={<Icon name="zapOff" />}
                    onClick={open}
                    flex="1"
                  >
                    {t("Disable")}
                  </Button>
                )}
              />
            </ButtonGroup>

          </Protected>
          <Protected minLevel={Level.Operator}>
            <DeviceRemoveButton
              devices={ctx.selected}
              renderItem={(open) => (
                <Button
                  justifyContent="start"
                  leftIcon={<Icon name="trash" />}
                  onClick={open}
                >
                  {t("Remove")}
                </Button>
              )}
            />
          </Protected>
        </Stack>
      </Stack>
    </Stack>
  );
}
