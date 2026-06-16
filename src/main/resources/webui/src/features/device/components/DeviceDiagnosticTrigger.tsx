import api from "@/api"
import { NetshotError } from "@/api/httpClient"
import { Checkbox } from "@/components"
import ScheduleForm, { ScheduleFormType } from "@/components/ScheduleForm"
import TaskDialog from "@/components/TaskDialog"
import { MUTATIONS } from "@/constants"
import { useCustomDialog, useFormDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { Device, SimpleDevice, Task, TaskType } from "@/types"
import { Box, Flex, Separator, Stack, Text } from "@chakra-ui/react"
import { useMutation } from "@tanstack/react-query"
import { FormProvider, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import React from "react"

export type DeviceDiagnosticTriggerProps = { devices: SimpleDevice[] | Device[]; children: React.ReactElement<any> } & Record<string, unknown>

type Form = { checkCompliance: boolean } & ScheduleFormType

export default function DeviceDiagnosticTrigger({ devices, children, ...rest }: DeviceDiagnosticTriggerProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const dialog = useFormDialogWithMutation()
  const taskDialog = useCustomDialog()

  const form = useForm<Form>({
    mode: "onChange",
    defaultValues: { checkCompliance: true },
  })

  const mutation = useMutation({
    mutationKey: MUTATIONS.TASK_CREATE,
    mutationFn: api.task.create,
    onError(err: NetshotError) { toast.error(err) },
  })

  const open = () => {
    const dialogRef = dialog.open(MUTATIONS.TASK_CREATE, {
      title: t("device.runDiagnostics"),
      description: (
        <FormProvider {...form}>
          <Stack gap="6">
            <Stack gap="3">
              {devices.length > 1 ? (
                <Flex alignItems="center">
                  <Box w="140px"><Text color="grey.400">{t("device.devices")}</Text></Box>
                  <Text>{devices.map((device) => device.name).join(", ")}</Text>
                </Flex>
              ) : (
                <>
                  <Flex alignItems="center">
                    <Box w="140px"><Text color="grey.400">{t("common.name")}</Text></Box>
                    <Text>{devices?.[0]?.name ?? "nA"}</Text>
                  </Flex>
                  <Flex alignItems="center">
                    <Box w="140px"><Text color="grey.400">{t("device.interface.ipAddress")}</Text></Box>
                    <Text>{devices?.[0]?.mgmtAddress ?? "nA"}</Text>
                  </Flex>
                </>
              )}
            </Stack>
            <Separator />
            <Stack gap="3">
              <Checkbox control={form.control} name="checkCompliance">
                {t("device.checkComplianceAfterSnapshot")}
              </Checkbox>
            </Stack>
            <ScheduleForm />
          </Stack>
        </FormProvider>
      ),
      form,
      size: "lg",
      async onSubmit(data: Form) {
        const { schedule } = data
        const tasks: Task[] = []

        for await (const device of devices) {
          const task = await mutation.mutateAsync({
            type: TaskType.RunDiagnostic,
            device: device?.id,
            debugEnabled: false,
            dontRunDiagnostics: true,
            dontCheckCompliance: !data.checkCompliance,
            ...schedule,
          })
          tasks.push(task)
        }

        dialogRef.close()

        if (tasks.length === 1) {
          taskDialog.open(<TaskDialog id={tasks[0].id} />)
        }
      },
      submitButton: { label: t("common.run") },
    })
  }

  return React.cloneElement(children, { onClick: open, onSelect: open, ...rest })
}
