import api from "@/api"
import { NetshotError } from "@/api/httpClient"
import ScheduleForm, { ScheduleFormType } from "@/components/ScheduleForm"
import TaskDialog from "@/components/TaskDialog"
import { MUTATIONS } from "@/constants"
import { useCustomDialog, useFormDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { Device, PropsWithRenderItem, SimpleDevice, Task, TaskType } from "@/types"
import { Box, Flex, Stack, Text } from "@chakra-ui/react"
import { useMutation } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

export type DeviceComplianceButtonProps = PropsWithRenderItem<{
  devices: SimpleDevice[] | Device[]
}>

export default function DeviceComplianceButton(props: DeviceComplianceButtonProps) {
  const { devices, renderItem } = props
  const { t } = useTranslation()
  const toast = useToast()
  const dialog = useFormDialogWithMutation()
  const taskDialog = useCustomDialog()

  const form = useForm<ScheduleFormType>({
    mode: "onChange",
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
      title: t("runDeviceCompliance"),
      description: (
        <Stack gap="6">
          <Stack gap="3">
            {devices.length > 1 ? (
              <>
                <Flex alignItems="center">
                  <Box w="140px">
                    <Text color="grey.400">{t("devices")}</Text>
                  </Box>
                  <Text>{devices.map((device) => device.name).join(", ")}</Text>
                </Flex>
              </>
            ) : (
              <>
                <Flex alignItems="center">
                  <Box w="140px">
                    <Text color="grey.400">{t("name")}</Text>
                  </Box>
                  <Text>{devices?.[0]?.name ?? "nA"}</Text>
                </Flex>
                <Flex alignItems="center">
                  <Box w="140px">
                    <Text color="grey.400">{t("ipAddress")}</Text>
                  </Box>
                  <Text>{devices?.[0]?.mgmtAddress ?? "nA"}</Text>
                </Flex>
              </>
            )}
          </Stack>
          <ScheduleForm />
        </Stack>
      ),
      form,
      size: "lg",
      async onSubmit(data: ScheduleFormType) {
        const { schedule } = data
        const tasks: Task[] = []

        for await (const device of devices) {
          const task = await mutation.mutateAsync({
            type: TaskType.RunDiagnostic,
            device: device?.id,
            debugEnabled: false,
            dontRunDiagnostics: true,
            dontCheckCompliance: true,
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
        label: t("run"),
      },
    })
  }

  return renderItem(open)
}
