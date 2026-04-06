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
            {t("bulkActions")}
          </Heading>
          <Text color="grey.500">
            {t(
              "youVeSelectedDevicesTheFollowingActionsApplyToAllOfTheSelect",
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
                  {t("runScript")}
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
                  {t("takeSnapshot")}
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
                  {t("checkCompliance")}
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
                  {t("runDiagnostics")}
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
                  {t("edit")}
                </Button>
              )}
            />

            <ButtonGroup attached>
              <DeviceEnableButton
                devices={selected}
                renderItem={(open) => (
                  <Button justifyContent="start" onClick={open} flex="1">
                    <Icon name="zap" />
                    {t("enable")}
                  </Button>
                )}
              />

              <DeviceDisableButton
                devices={selected}
                renderItem={(open) => (
                  <Button justifyContent="start" onClick={open} flex="1">
                    <Icon name="zapOff" />
                    {t("disable")}
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
                  {t("remove")}
                </Button>
              )}
            />
          </Protected>
        </Stack>
      </Stack>
    </Stack>
  )
}
