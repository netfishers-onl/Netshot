import { Box, Flex, Stack, Text } from "@chakra-ui/react"
import { useMutation } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import api from "@/api"
import { NetshotError } from "@/api/httpClient"
import { Checkbox } from "@/components"
import ScheduleForm, { ScheduleFormType } from "@/components/ScheduleForm"
import TaskDialog from "@/components/TaskDialog"
import { MUTATIONS } from "@/constants"
import { useCustomDialog, useFormDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { Device, PropsWithRenderItem, SimpleDevice, Task, TaskType } from "@/types"

export type DeviceSnapshotButtonProps = PropsWithRenderItem<{
  devices: SimpleDevice[] | Device[]
}>

type SnapshotForm = {
  runDiagnostic: boolean
  checkCompliance: boolean
  debugEnabled: boolean
} & ScheduleFormType

export default function DeviceSnapshotButton(props: DeviceSnapshotButtonProps) {
  const { devices, renderItem } = props
  const { t } = useTranslation()
  const toast = useToast()
  const dialog = useFormDialogWithMutation()
  const taskDialog = useCustomDialog()

  const form = useForm<SnapshotForm>({
    mode: "onChange",
    defaultValues: {
      runDiagnostic: true,
      checkCompliance: true,
      debugEnabled: false,
    },
  })

  const mutation = useMutation({
    mutationKey: MUTATIONS.TASK_CREATE,
    mutationFn: api.task.create,
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  const open = () => {
    const dialogRef = dialog.open(MUTATIONS.TASK_CREATE, {
      title: t("Take device snapshot"),
      description: (
        <Stack gap="6">
          <Stack gap="3">
            {devices.length > 1 ? (
              <>
                <Flex>
                  <Box flex="0 0 80px">
                    <Text color="grey.400">{t("Devices")}</Text>
                  </Box>
                  <Text>
                    {devices.map((device: SimpleDevice | Device) => device.name).join(", ")}
                  </Text>
                </Flex>
              </>
            ) : (
              <>
                <Flex alignItems="center">
                  <Box flex="0 0 80px">
                    <Text color="grey.400">{t("Name")}</Text>
                  </Box>
                  <Text>{devices?.[0]?.name ?? "N/A"}</Text>
                </Flex>
                <Flex alignItems="center">
                  <Box flex="0 0 80px">
                    <Text color="grey.400">{t("IP Address")}</Text>
                  </Box>
                  <Text>{devices?.[0]?.mgmtAddress ?? "N/A"}</Text>
                </Flex>
              </>
            )}
          </Stack>
          <Stack gap="3">
            <Checkbox control={form.control} name="runDiagnostic">
              {t("Run the device diagnostics after the snapshot")}
            </Checkbox>
            <Checkbox control={form.control} name="checkCompliance">
              {t("Check device compliance after the snapshot")}
            </Checkbox>
            <Checkbox control={form.control} name="debugEnabled">
              {t("Enable full trace of the CLI session (only for troubleshooting)")}
            </Checkbox>
          </Stack>
          <ScheduleForm />
        </Stack>
      ),
      form,
      size: "lg",
      async onSubmit(values: SnapshotForm) {
        const { schedule } = values
        const tasks: Task[] = []

        for (const device of devices) {
          const task = await mutation.mutateAsync({
            type: TaskType.TakeSnapshot,
            device: device?.id,
            debugEnabled: values.debugEnabled,
            dontRunDiagnostics: !values.runDiagnostic,
            dontCheckCompliance: !values.checkCompliance,
            ...schedule,
          })

          tasks.push(task)
        }

        dialogRef.close()

        if (tasks.length === 1) {
          taskDialog.open(<TaskDialog id={tasks[0].id} />)
        }
      },
      submitButton: {
        label: t("Take snapshot"),
      },
    })
  }

  return renderItem(open)
}
