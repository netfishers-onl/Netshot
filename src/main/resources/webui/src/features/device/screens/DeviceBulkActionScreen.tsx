import { Icon, Protected } from "@/components";
import { Level } from "@/types";
import { Button, Heading, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
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
import { useDeviceSidebar } from "../contexts/DeviceSidebarProvider";

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
          <Protected
            roles={[
              Level.Admin,
              Level.Operator,
              Level.ReadWriteCommandOnDevice,
            ]}
          >
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
          <Protected
            roles={[
              Level.Admin,
              Level.Operator,
              Level.ReadWriteCommandOnDevice,
              Level.ReadWrite,
            ]}
          >
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
          <Protected
            roles={[
              Level.Admin,
              Level.Operator,
              Level.ReadWriteCommandOnDevice,
            ]}
          >
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
          <Protected
            roles={[
              Level.Admin,
              Level.Operator,
              Level.ReadWriteCommandOnDevice,
            ]}
          >
            <DeviceDiagnosticButton
              devices={ctx.selected}
              renderItem={(open) => (
                <Button
                  justifyContent="start"
                  leftIcon={<Icon name="tool" />}
                  onClick={open}
                >
                  {t("Run diagnostics")}
                </Button>
              )}
            />
          </Protected>
          <Protected
            roles={[
              Level.Admin,
              Level.Operator,
              Level.ReadWriteCommandOnDevice,
              Level.ReadWrite,
            ]}
          >
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

            <DeviceEnableButton
              devices={ctx.selected}
              renderItem={(open) => (
                <Button
                  justifyContent="start"
                  leftIcon={<Icon name="power" />}
                  onClick={open}
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
                  leftIcon={<Icon name="power" />}
                  onClick={open}
                >
                  {t("Disable")}
                </Button>
              )}
            />
          </Protected>
          <Protected
            roles={[
              Level.Admin,
              Level.Operator,
              Level.ReadWriteCommandOnDevice,
              Level.ReadWrite,
            ]}
          >
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
