import api, { UpdateDevicePayload } from "@/api"
import { NetshotError } from "@/api/httpClient"
import { DomainSelect } from "@/features/administration/components"
import { MUTATIONS } from "@/constants"
import { useFormDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { Option, SimpleDevice } from "@/types"
import { Alert, Stack } from "@chakra-ui/react"
import { useMutation } from "@tanstack/react-query"
import { useForm, useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"
import React from "react"
import Slot from "@/components/Slot"

type Form = {
  mgmtDomain: Option<number>
}

export type BulkEditDeviceTriggerProps = { devices: SimpleDevice[]; children: React.ReactElement<Record<string, unknown>> } & Record<string, unknown>

function DeviceBulkEditForm() {
  const form = useFormContext()

  return (
    <Stack gap="6" px="6">
      <DomainSelect control={form.control} name="mgmtDomain" />
    </Stack>
  )
}

export default function BulkEditDeviceTrigger({ devices, children, ...rest }: BulkEditDeviceTriggerProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const dialog = useFormDialogWithMutation()

  const form = useForm<Form>({
    mode: "onChange",
    defaultValues: {},
  })

  const edit = useMutation({
    mutationKey: MUTATIONS.DEVICE_UPDATE,
    mutationFn: async (payload: Partial<UpdateDevicePayload>) =>
      api.device.update(payload.id!, payload),
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  const open = () => {
    const dialogRef = dialog.open(MUTATIONS.DEVICE_UPDATE, {
      title: t("device.editMultiple"),
      description: (
        <>
          <Stack px="6" mb="6">
            <Alert.Root status="info" bg="blue.50">
              <Alert.Description color="blue.900">
                {t("theModificationsWillBeAppliedToDevices", {
                  count: devices?.length,
                })}
              </Alert.Description>
            </Alert.Root>
          </Stack>
          <DeviceBulkEditForm />
        </>
      ),
      form,
      isLoading: edit.isPending,
      size: "lg",
      variant: "floating",
      async onSubmit(data: Form) {
        for await (const device of devices) {
          await edit.mutateAsync({
            id: device?.id,
            mgmtDomain: data?.mgmtDomain?.value,
          } as Partial<UpdateDevicePayload>)
        }

        dialogRef.close()

        toast.success({
          title: t("common.success"),
          description: t("devicesHaveBeenSuccessfullyModified", {
            count: devices?.length,
          }),
        })

        form.reset()
      },
      submitButton: {
        label: t("common.applyChanges"),
      },
    })
  }

  return <Slot onTrigger={open} {...rest}>{children}</Slot>
}
