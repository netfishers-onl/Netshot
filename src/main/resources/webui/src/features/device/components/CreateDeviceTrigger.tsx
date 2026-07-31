import api, { CreateDevicePayload } from "@/api"
import { NetshotError } from "@/api/httpClient"
import { Switch } from "@/components"
import { DomainSelect } from "@/features/administration/components"
import DeviceTypeSelect from "./DeviceTypeSelect"
import DeviceAccessOverridesFields, { AccessOverrideFormValue } from "./DeviceAccessOverridesFields"
import FormControl, { FormControlType } from "@/components/FormControl"
import { Select } from "@/components/Select"
import { TaskDialog } from "@/features/task/components"
import { MUTATIONS } from "@/constants"
import { useCustomDialog, useFormDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { CredentialSetType, DeviceType } from "@/types"
import validators from "@/utils/validators"
import { Separator, Stack } from "@chakra-ui/react"
import { useMutation } from "@tanstack/react-query"
import { useEffect } from "react"
import { useForm, useFormContext, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import React from "react"
import Slot from "@/components/Slot"
import { useDeviceCredentialSetOptions, useDeviceTypeOptions } from "../hooks"

type Form = {
  ipAddress: string
  domain: string | null
  autoDiscover: boolean
  deviceType?: DeviceType["name"] | null
  credentialType?: CredentialSetType | null
  accessOverrides?: AccessOverrideFormValue[]
  specificCredentialSet?: CreateDevicePayload["specificCredentialSet"] | null
}

export type CreateDeviceTriggerProps = { children: React.ReactElement<Record<string, unknown>> } & Record<string, unknown>

function DeviceCreateForm() {
  const form = useFormContext()
  const { t } = useTranslation()
  const deviceCredentialSetOptions = useDeviceCredentialSetOptions()
  const { getOptionByDriver } = useDeviceTypeOptions()

  const autoDiscover = useWatch({ control: form.control, name: "autoDiscover" })
  const deviceType = useWatch({ control: form.control, name: "deviceType" })
  const credentialType = useWatch({ control: form.control, name: "credentialType" })

  const selectedDeviceType = getOptionByDriver(deviceType)?.value

  useEffect(() => {
    form.setValue("credentialType", autoDiscover ? null : deviceCredentialSetOptions.options[0].value)
    form.setValue("deviceType", null)
  }, [autoDiscover, deviceCredentialSetOptions.options, form])

  useEffect(() => {
    if (credentialType === CredentialSetType.SSH || credentialType === CredentialSetType.Telnet) {
      form.setValue("specificCredentialSet.username", "")
      form.setValue("specificCredentialSet.password", "")
      form.setValue("specificCredentialSet.superPassword", "")
      return
    } else if (credentialType === CredentialSetType.SSHKey) {
      form.setValue("specificCredentialSet.username", "")
      form.setValue("specificCredentialSet.privateKey", "")
      form.setValue("specificCredentialSet.password", "")
      form.setValue("specificCredentialSet.superPassword", "")
    } else {
      form.setValue("specificCredentialSet", null)
    }
  }, [credentialType, form])

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
          <DeviceTypeSelect required control={form.control} name="deviceType" />
          {selectedDeviceType && Object.keys(selectedDeviceType.accessDefinitions ?? {}).length > 0 && (
            <>
              <Separator />
              <DeviceAccessOverridesFields control={form.control} accessDefinitions={selectedDeviceType.accessDefinitions} />
            </>
          )}
          <Separator />
          <Select control={form.control} name="credentialType" options={deviceCredentialSetOptions.options} label={t("credential.list")} placeholder={t("credential.select")} required />
          {[CredentialSetType.SSH, CredentialSetType.Telnet].includes(credentialType) && (
            <>
              <FormControl required label={t("user.username")} placeholder={t("common.eG", { example: "admin" })} control={form.control} name="specificCredentialSet.username" />
              <FormControl required type={FormControlType.Password} label={t("auth.password")} placeholder={t("auth.typeYourPassword")} control={form.control} name="specificCredentialSet.password" />
              <FormControl required type={FormControlType.Password} label={t("network.superPassword")} placeholder={t("network.typeSuperPassword")} control={form.control} name="specificCredentialSet.superPassword" />
            </>
          )}
          {credentialType === CredentialSetType.SSHKey && (
            <>
              <FormControl required label={t("user.username")} placeholder={t("common.eG", { example: "admin" })} control={form.control} name="specificCredentialSet.username" />
              <FormControl required type={FormControlType.LongText} label={t("network.sshPrivateKey")} placeholder={t("network.typePrivateKey")} control={form.control} name="specificCredentialSet.privateKey" />
              <FormControl required type={FormControlType.Password} label={t("network.passphrase")} placeholder={t("network.typePassphrase")} control={form.control} name="specificCredentialSet.password" />
              <FormControl required type={FormControlType.Password} label={t("network.superPassword")} placeholder={t("network.typeSuperPassword")} control={form.control} name="specificCredentialSet.superPassword" />
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

  const form = useForm<Form>({
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      ipAddress: "",
      domain: null,
      autoDiscover: true,
      accessOverrides: [],
      deviceType: null,
      credentialType: null,
      specificCredentialSet: null,
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

        const accessOverrides = (values.accessOverrides ?? [])
          .filter((override) => override.address || override.port)
          .map((override) => ({
            accessName: override.accessName,
            address: override.address || undefined,
            port: override.port ? Number(override.port) : undefined,
          }))
        if (accessOverrides.length > 0) {
          newDevice.accessOverrides = accessOverrides
        }

        if (!values.autoDiscover && values.credentialType !== CredentialSetType.GLOBAL) {
          const { username, password, superPassword } = values.specificCredentialSet ?? {}

          newDevice.specificCredentialSet = {
            type: values.credentialType!,
            username: username!,
            password: password!,
            superPassword: superPassword!,
          }

          if (values.credentialType === CredentialSetType.SSHKey) {
            newDevice.specificCredentialSet = {
              ...newDevice.specificCredentialSet,
              privateKey: values.specificCredentialSet?.privateKey,
            }
          }
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
