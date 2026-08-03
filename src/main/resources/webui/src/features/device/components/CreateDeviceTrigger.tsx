import api, { CreateDevicePayload } from "@/api"
import { NetshotError } from "@/api/httpClient"
import { Switch } from "@/components"
import { DomainSelect } from "@/features/administration/components"
import DeviceTypeSelect from "./DeviceTypeSelect"
import DeviceAccessFields, { buildAccessesPayload, DeviceAccessFormValue } from "./DeviceAccessFields"
import FormControl from "@/components/FormControl"
import { TaskDialog } from "@/features/task/components"
import { MUTATIONS } from "@/constants"
import { useCustomDialog, useFormDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { DeviceType } from "@/types"
import validators from "@/utils/validators"
import { Separator, Stack } from "@chakra-ui/react"
import { useMutation } from "@tanstack/react-query"
import { useForm, useFormContext, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import React from "react"
import Slot from "@/components/Slot"
import { useCredentialSets } from "../api"
import { useDeviceTypeOptions } from "../hooks"

type Form = {
  ipAddress: string
  domain: string | null
  autoDiscover: boolean
  deviceType?: DeviceType["name"] | null
  accesses?: DeviceAccessFormValue[]
}

export type CreateDeviceTriggerProps = { children: React.ReactElement<Record<string, unknown>> } & Record<string, unknown>

function DeviceCreateForm() {
  const form = useFormContext()
  const { t } = useTranslation()
  const { getOptionByDriver } = useDeviceTypeOptions()

  const autoDiscover = useWatch({ control: form.control, name: "autoDiscover" })
  const deviceType = useWatch({ control: form.control, name: "deviceType" })

  const selectedDeviceType = getOptionByDriver(deviceType)?.value

  return (
    <Stack gap="6">
      <DomainSelect required control={form.control} name="domain" />
      <FormControl
        required
        label={t("device.mgmtAddress")}
        placeholder={t("common.eG", { example: "10.216.5.3, 2001:db8::1, router1.example.com" })}
        control={form.control}
        name="ipAddress"
        rules={validators.hostOrIp()}
      />
      <Separator />
      <Switch label={t("device.autodiscover")} description={t("device.automaticallyDiscoverType")} control={form.control} name="autoDiscover" />
      {!autoDiscover && (
        <>
          <DeviceTypeSelect required label={t("device.type")} control={form.control} name="deviceType" />
          {selectedDeviceType && Object.keys(selectedDeviceType.accessDefinitions ?? {}).length > 0 && (
            <>
              <Separator />
              <DeviceAccessFields control={form.control} accessDefinitions={selectedDeviceType.accessDefinitions} />
            </>
          )}
        </>
      )}
    </Stack>
  )
}

export default function CreateDeviceTrigger({ children, ...rest }: CreateDeviceTriggerProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const dialog = useFormDialogWithMutation()
  const taskDialog = useCustomDialog()
  const { data: credentialSets } = useCredentialSets()

  const form = useForm<Form>({
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      ipAddress: "",
      domain: null,
      autoDiscover: true,
      accesses: [],
      deviceType: null,
    },
  })

  const mutation = useMutation({
    mutationKey: MUTATIONS.DEVICE_CREATE,
    mutationFn: async (payload: CreateDevicePayload) => api.device.create(payload),
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  const open = () => {
    form.reset()

    const dialogRef = dialog.open(MUTATIONS.DEVICE_CREATE, {
      title: t("device.add"),
      description: <DeviceCreateForm />,
      form,
      async onSubmit(values: Form) {
        const newDevice = {
          deviceType: values?.deviceType,
          autoDiscoveryTask: -1,
          autoDiscover: values.autoDiscover,
          ipAddress: values?.ipAddress,
          domainId: +(values?.domain ?? 0),
        } as CreateDevicePayload

        const accesses = buildAccessesPayload(values.accesses, credentialSets)
        if (accesses.length > 0) {
          newDevice.accesses = accesses
        }

        const task = await mutation.mutateAsync(newDevice)

        dialogRef.close()

        taskDialog.open(<TaskDialog id={task!.id} />)
      },
      size: "lg",
      submitButton: {
        label: t("common.create"),
      },
    })
  }

  return <Slot onTrigger={open} {...rest}>{children}</Slot>
}
