import { Button, ButtonGroup, Heading, Stack, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { Icon, Protected } from "@/components"
import { Level } from "@/types"

import {
  DeviceBulkEditButton,
  DeviceComplianceButton,
  DeviceDiagnosticButton,
  DeviceDisableButton,
  DeviceEnableButton,
  DeviceRemoveButton,
  DeviceSnapshotButton,
} from "../components"
import DeviceRunScriptButton from "../components/DeviceRunScriptButton"
import { useDeviceSidebarStore } from "../stores"

export default function DeviceBulkActionScreen() {
  const selected = useDeviceSidebarStore((state) => state.selected)
  const { t } = useTranslation()

  return (
    <Stack alignItems="center" justifyContent="center" flex="1">
      <Stack gap="8" w="20%">
        <Stack gap="3">
          <Heading as="h1" fontSize="4xl">
            {t("Bulk actions")}
          </Heading>
          <Text color="grey.500">
            {t(
              "You've selected {{count}} devices, the following actions apply to all of the selected devices",
              {
                count: selected.length,
              }
            )}
          </Text>
        </Stack>

        <Stack gap="2">
          <Protected minLevel={Level.ExecureReadWrite}>
            <DeviceRunScriptButton
              devices={selected}
              renderItem={(open) => (
                <Button justifyContent="start" onClick={open}>
                  <Icon name="play" />
                  {t("Run script")}
                </Button>
              )}
            />
          </Protected>
          <Protected minLevel={Level.Operator}>
            <DeviceSnapshotButton
              devices={selected}
              renderItem={(open) => (
                <Button justifyContent="start" onClick={open}>
                  <Icon name="camera" />
                  {t("Take snapshot")}
                </Button>
              )}
            />
          </Protected>
          <Protected minLevel={Level.Operator}>
            <DeviceComplianceButton
              devices={selected}
              renderItem={(open) => (
                <Button justifyContent="start" onClick={open}>
                  <Icon name="checkCircle" />
                  {t("Check compliance")}
                </Button>
              )}
            />
          </Protected>
          <Protected minLevel={Level.Operator}>
            <DeviceDiagnosticButton
              devices={selected}
              renderItem={(open) => (
                <Button justifyContent="start" onClick={open}>
                  <Icon name="activity" />
                  {t("Run diagnostics")}
                </Button>
              )}
            />
          </Protected>
          <Protected minLevel={Level.Operator}>
            <DeviceBulkEditButton
              devices={selected}
              renderItem={(open) => (
                <Button justifyContent="start" onClick={open}>
                  <Icon name="edit" />
                  {t("Edit")}
                </Button>
              )}
            />

            <ButtonGroup attached>
              <DeviceEnableButton
                devices={selected}
                renderItem={(open) => (
                  <Button justifyContent="start" onClick={open} flex="1">
                    <Icon name="zap" />
                    {t("Enable")}
                  </Button>
                )}
              />

              <DeviceDisableButton
                devices={selected}
                renderItem={(open) => (
                  <Button justifyContent="start" onClick={open} flex="1">
                    <Icon name="zapOff" />
                    {t("Disable")}
                  </Button>
                )}
              />
            </ButtonGroup>
          </Protected>
          <Protected minLevel={Level.Operator}>
            <DeviceRemoveButton
              devices={selected}
              renderItem={(open) => (
                <Button justifyContent="start" onClick={open}>
                  <Icon name="trash" />
                  {t("Remove")}
                </Button>
              )}
            />
          </Protected>
        </Stack>
      </Stack>
    </Stack>
  )
}
