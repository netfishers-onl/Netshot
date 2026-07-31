import api, { UpdateDevicePayload } from "@/api"
import { NetshotError } from "@/api/httpClient"
import { Checkbox } from "@/components"
import { DomainSelect } from "@/features/administration/components"
import DeviceTypeSelect from "./DeviceTypeSelect"
import DeviceAccessOverridesFields, { AccessOverrideFormValue } from "./DeviceAccessOverridesFields"
import FormControl, { FormControlType, PASSWORD_UNCHANGED } from "@/components/FormControl"
import { Select } from "@/components/Select"
import { MUTATIONS, QUERIES } from "@/constants"
import { useFormDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { CredentialSetType, Device } from "@/types"
import validators from "@/utils/validators"
import { Checkbox as NativeCheckbox, Separator, Stack } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo } from "react"
import { useForm, useFormContext, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import React from "react"
import Slot from "@/components/Slot"
import { useCredentialSets } from "../api"
import { useDeviceCredentialSetOptions, useDeviceTypeOptions } from "../hooks"

export type EditDeviceTriggerProps = { device: Device; children: React.ReactElement<Record<string, unknown>> } & Record<string, unknown>

type Form = {
  name: string
  deviceType: string
  ipAddress: string
  mgmtDomain: string
  accessOverrides: AccessOverrideFormValue[]
  credentialType: CredentialSetType
  credentialSetIds: number[]
  specificCredentialSet: UpdateDevicePayload["specificCredentialSet"] | null
  autoTryCredentials: boolean
  comments: string
}

function DeviceEditForm({ freezePasswords = false }: { freezePasswords?: boolean }) {
  const form = useFormContext()
  const { t } = useTranslation()
  const deviceCredentialSetOptions = useDeviceCredentialSetOptions()
  const { data: credentialSets, isPending } = useCredentialSets()
  const { getOptionByDriver } = useDeviceTypeOptions()

  const deviceType = useWatch({ control: form.control, name: "deviceType" })
  const credentialType = useWatch({ control: form.control, name: "credentialType" })
  const credentialSetIds = useWatch({ control: form.control, name: "credentialSetIds" })

  const selectedDeviceType = getOptionByDriver(deviceType)?.value

  function toggleCredentialSetId(id: number) {
    const ids = [...credentialSetIds] as number[]
    const index = credentialSetIds.findIndex((i) => i === id)
    if (index !== -1) { ids.splice(index, 1) } else { ids.push(id) }
    form.setValue("credentialSetIds", ids)
  }

  function onCredentialTypeChange(type: CredentialSetType) {
    if (type === CredentialSetType.SSH || credentialType === CredentialSetType.Telnet) {
      form.setValue("specificCredentialSet.username", "")
      form.setValue("specificCredentialSet.password", "")
      form.setValue("specificCredentialSet.superPassword", "")
      return
    } else if (type === CredentialSetType.SSHKey) {
      form.setValue("specificCredentialSet.username", "")
      form.setValue("specificCredentialSet.privateKey", "")
      form.setValue("specificCredentialSet.password", "")
      form.setValue("specificCredentialSet.superPassword", "")
    } else {
      form.setValue("specificCredentialSet", null)
    }
  }

  const isSshOrTelnet = [CredentialSetType.SSH, CredentialSetType.Telnet].includes(credentialType)

  return (
    <Stack gap="6">
      <FormControl readOnly label={t("common.name")} placeholder={t("device.name")} control={form.control} name="name" />
      <DeviceTypeSelect disabled label={t("device.type")} control={form.control} name="deviceType" />
      <DomainSelect control={form.control} name="mgmtDomain" />
      <FormControl required label={t("device.mgmtAddress")} placeholder={t("common.eG", { example: "10.216.5.3, 2001:db8::1, router1.example.com" })} control={form.control} name="ipAddress" rules={validators.hostOrIp()} />
      {selectedDeviceType && Object.keys(selectedDeviceType.accessDefinitions ?? {}).length > 0 && (
        <>
          <Separator />
          <DeviceAccessOverridesFields control={form.control} accessDefinitions={selectedDeviceType.accessDefinitions} />
          <Separator />
        </>
      )}
      <Select control={form.control} name="credentialType" options={deviceCredentialSetOptions.options} label={t("credential.label")} placeholder={t("credential.select")} onSelectItem={onCredentialTypeChange} />
      {credentialType === null && !isPending && (
        <Stack gap="2">
          {(credentialSets ?? []).map((credentialSet) => (
            <NativeCheckbox.Root onCheckedChange={() => toggleCredentialSetId(credentialSet?.id)} key={credentialSet?.id} checked={credentialSetIds.includes(credentialSet?.id)}>
              <NativeCheckbox.HiddenInput />
              <NativeCheckbox.Control />
              <NativeCheckbox.Label>{credentialSet?.name} ({credentialSet?.type})</NativeCheckbox.Label>
            </NativeCheckbox.Root>
          ))}
          <Checkbox control={form.control} name="autoTryCredentials">{t("device.inCaseOfFailureTryAllCredentials")}</Checkbox>
        </Stack>
      )}
      {isSshOrTelnet && (
        <>
          <FormControl required label={t("user.username")} placeholder={t("common.eG", { example: "admin" })} control={form.control} name="specificCredentialSet.username" autoComplete="nope" />
          <FormControl required={!freezePasswords} allowUnchanged={freezePasswords} type={FormControlType.Password} label={t("auth.password")} placeholder={t("auth.typeYourPassword")} control={form.control} name="specificCredentialSet.password" autoComplete="nope" />
          <FormControl allowUnchanged={freezePasswords} type={FormControlType.Password} label={t("network.superPassword")} placeholder={t("network.typeSuperPassword")} control={form.control} name="specificCredentialSet.superPassword" autoComplete="nope" />
        </>
      )}
      {credentialType === CredentialSetType.SSHKey && (
        <>
          <FormControl required label={t("user.username")} placeholder={t("common.eG", { example: "admin" })} control={form.control} name="specificCredentialSet.username" autoComplete="nope" />
          <FormControl required={!freezePasswords} type={FormControlType.LongText} label={t("network.sshPrivateKey")} placeholder={t("network.typePrivateKey")} control={form.control} name="specificCredentialSet.privateKey" autoComplete="nope" helperText={freezePasswords ? t("auth.leaveEmptyToKeepCurrentKey") : undefined} />
          <FormControl required={!freezePasswords} allowUnchanged={freezePasswords} type={FormControlType.Password} label={t("network.passphrase")} placeholder={t("network.typePassphrase")} control={form.control} name="specificCredentialSet.password" autoComplete="nope" />
          <FormControl allowUnchanged={freezePasswords} type={FormControlType.Password} label={t("network.superPassword")} placeholder={t("network.typeSuperPassword")} control={form.control} name="specificCredentialSet.superPassword" autoComplete="nope" />
        </>
      )}
      <FormControl type={FormControlType.LongText} rows={4} label={t("common.comments")} placeholder={t("device.addDescription")} control={form.control} name="comments" />
    </Stack>
  )
}

export default function EditDeviceTrigger({ device, children, ...rest }: EditDeviceTriggerProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const queryClient = useQueryClient()
  const deviceCredentialSetOptions = useDeviceCredentialSetOptions()
  const dialog = useFormDialogWithMutation()

  const defaultValues = useMemo(() => {
    const credentialType = device?.specificCredentialSet
      ? device?.specificCredentialSet?.type
      : deviceCredentialSetOptions.options[0].value

    const accessOverrides = (device?.accessOverrides ?? []).map((override) => ({
      accessName: override.accessName,
      protocol: "",
      defaultPort: 0,
      address: override.address ?? "",
      port: override.port?.toString() ?? "",
    })) as AccessOverrideFormValue[]

    let values = {
      name: device?.name,
      deviceType: device?.driver,
      ipAddress: device?.mgmtAddress,
      mgmtDomain: device?.mgmtDomain?.id?.toString(),
      accessOverrides,
      autoTryCredentials: device?.autoTryCredentials,
      credentialSetIds: device?.credentialSetIds ?? [],
      credentialType,
      comments: device?.comments ?? "",
      specificCredentialSet: null,
    } as Form

    if (device?.specificCredentialSet) {
      values = {
        ...values,
        specificCredentialSet: {
          username: device.specificCredentialSet.username,
          privateKey: PASSWORD_UNCHANGED,
          password: PASSWORD_UNCHANGED,
          superPassword: PASSWORD_UNCHANGED,
        },
      }
    }

    return values
  }, [device, deviceCredentialSetOptions.options])

  const form = useForm<Form>({ mode: "onChange", defaultValues })

  useEffect(() => { form.reset(defaultValues) }, [defaultValues, form])

  const mutation = useMutation({
    mutationKey: MUTATIONS.DEVICE_UPDATE,
    mutationFn: async (payload: Partial<UpdateDevicePayload>) => api.device.update(device?.id, payload),
    onError(err: NetshotError) { toast.error(err) },
  })

  const open = () => {
    const dialogRef = dialog.open(MUTATIONS.DEVICE_UPDATE, {
      title: t("device.edit"),
      description: <DeviceEditForm freezePasswords={Boolean(device?.specificCredentialSet)} />,
      form,
      size: "lg",
      async onSubmit(values: Form) {
        const updatedDevice: Partial<UpdateDevicePayload> = {
          comments: values?.comments,
          ipAddress: values?.ipAddress,
          mgmtDomain: +values?.mgmtDomain,
          credentialSetIds: values?.credentialSetIds,
          autoTryCredentials: values?.autoTryCredentials,
        }

        updatedDevice.accessOverrides = (values.accessOverrides ?? [])
          .filter((override) => override.address || override.port)
          .map((override) => ({
            accessName: override.accessName,
            address: override.address || undefined,
            port: override.port ? Number(override.port) : undefined,
          }))

        if (values.credentialType !== CredentialSetType.GLOBAL) {
          const { username, password, superPassword } = values.specificCredentialSet ?? {}
          updatedDevice.specificCredentialSet = { type: values.credentialType, username: username! }
          if (password !== PASSWORD_UNCHANGED) updatedDevice.specificCredentialSet.password = password ?? undefined
          if (superPassword !== PASSWORD_UNCHANGED) updatedDevice.specificCredentialSet.superPassword = superPassword ?? undefined
          if (values.credentialType === CredentialSetType.SSHKey) {
            const privateKey = values.specificCredentialSet?.privateKey
            if (privateKey !== PASSWORD_UNCHANGED && privateKey !== "") updatedDevice.specificCredentialSet.privateKey = privateKey ?? undefined
          }
        }

        await mutation.mutateAsync(updatedDevice)
        dialogRef.close()
        form.reset()

        toast.success({ title: t("common.success"), description: t("device.successfullyModified", { device: device?.name }) })
        queryClient.invalidateQueries({ queryKey: [QUERIES.DEVICE_DETAIL, +device?.id] })
      },
      onCancel() { form.reset() },
      submitButton: { label: t("common.applyChanges") },
    })
  }

  return <Slot onTrigger={open} {...rest}>{children}</Slot>
}
