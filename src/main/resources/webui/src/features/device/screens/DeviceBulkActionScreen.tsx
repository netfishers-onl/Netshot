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
            {t("common.bulkActions")}
          </Heading>
          <Text color="grey.500">
            {t("device.youVeSelected", { count: selected.length })}
          </Text>
        </Stack>

        <Stack gap="2">
          <Protected minLevel={Level.ExecureReadWrite}>
            <DeviceRunScriptButton
              devices={selected}
              renderItem={(open) => (
                <Button justifyContent="start" onClick={open}>
                  <Icon name="play" />
                  {t("script.run")}
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
                  {t("device.snapshot.take")}
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
                  {t("compliance.check")}
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
                  {t("diagnostic.run")}
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
                  {t("common.edit")}
                </Button>
              )}
            />

            <ButtonGroup attached>
              <DeviceEnableButton
                devices={selected}
                renderItem={(open) => (
                  <Button justifyContent="start" onClick={open} flex="1">
                    <Icon name="zap" />
                    {t("common.enable")}
                  </Button>
                )}
              />

              <DeviceDisableButton
                devices={selected}
                renderItem={(open) => (
                  <Button justifyContent="start" onClick={open} flex="1">
                    <Icon name="zapOff" />
                    {t("common.disable")}
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
                  {t("common.remove")}
                </Button>
              )}
            />
          </Protected>
        </Stack>
      </Stack>
    </Stack>
  )
}
