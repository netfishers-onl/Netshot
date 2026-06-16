import { Button, ButtonGroup, Heading, Stack, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { Protected } from "@/components"
import { LuActivity, LuCamera, LuCircleCheck, LuSquarePen, LuPlay, LuTrash, LuZap, LuZapOff } from "react-icons/lu"
import { Level } from "@/types"

import {
  BulkEditDeviceTrigger,
  DeviceComplianceTrigger,
  DeviceDiagnosticTrigger,
  DisableDeviceTrigger,
  EnableDeviceTrigger,
  RemoveDeviceTrigger,
  DeviceSnapshotTrigger,
} from "../components"
import OpenDeviceScriptTrigger from "../components/OpenDeviceScriptTrigger"
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
            <OpenDeviceScriptTrigger devices={selected}>
              <Button justifyContent="start">
                <LuPlay />
                {t("script.run")}
              </Button>
            </OpenDeviceScriptTrigger>
          </Protected>
          <Protected minLevel={Level.Operator}>
            <DeviceSnapshotTrigger devices={selected}>
              <Button justifyContent="start">
                <LuCamera />
                {t("device.snapshot.take")}
              </Button>
            </DeviceSnapshotTrigger>
          </Protected>
          <Protected minLevel={Level.Operator}>
            <DeviceComplianceTrigger devices={selected}>
              <Button justifyContent="start">
                <LuCircleCheck />
                {t("compliance.check")}
              </Button>
            </DeviceComplianceTrigger>
          </Protected>
          <Protected minLevel={Level.Operator}>
            <DeviceDiagnosticTrigger devices={selected}>
              <Button justifyContent="start">
                <LuActivity />
                {t("diagnostic.run")}
              </Button>
            </DeviceDiagnosticTrigger>
          </Protected>
          <Protected minLevel={Level.Operator}>
            <BulkEditDeviceTrigger devices={selected}>
              <Button justifyContent="start">
                <LuSquarePen />
                {t("common.edit")}
              </Button>
            </BulkEditDeviceTrigger>

            <ButtonGroup attached>
              <EnableDeviceTrigger devices={selected}>
                <Button justifyContent="start" flex="1">
                  <LuZap />
                  {t("common.enable")}
                </Button>
              </EnableDeviceTrigger>

              <DisableDeviceTrigger devices={selected}>
                <Button justifyContent="start" flex="1">
                  <LuZapOff />
                  {t("common.disable")}
                </Button>
              </DisableDeviceTrigger>
            </ButtonGroup>
          </Protected>
          <Protected minLevel={Level.Operator}>
            <RemoveDeviceTrigger devices={selected}>
              <Button justifyContent="start">
                <LuTrash />
                {t("common.remove")}
              </Button>
            </RemoveDeviceTrigger>
          </Protected>
        </Stack>
      </Stack>
    </Stack>
  )
}
