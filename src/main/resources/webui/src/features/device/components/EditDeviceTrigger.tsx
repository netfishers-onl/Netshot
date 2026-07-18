import api, { UpdateDevicePayload } from "@/api"
import { NetshotError } from "@/api/httpClient"
import { Checkbox, DeviceTypeSelect, DomainSelect } from "@/components"
import FormControl, { FormControlType, PASSWORD_UNCHANGED } from "@/components/FormControl"
import { Select } from "@/components/Select"
import { MUTATIONS, QUERIES } from "@/constants"
import { useFormDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { CredentialSetType, Device } from "@/types"
import { Checkbox as NativeCheckbox, Stack } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo } from "react"
import { useForm, useFormContext, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import React from "react"
import Slot from "@/components/Slot"
import { useCredentialSets } from "../api"
import { useDeviceCredentialSetOptions } from "../hooks"

export type EditDeviceTriggerProps = { device: Device; children: React.ReactElement<Record<string, unknown>> } & Record<string, unknown>

type Form = {
  name: string
  deviceType: string
  ipAddress: string
  mgmtDomain: string
  overrideConnectionSetting: boolean
  connectIpAddress: string
  sshPort: string
  telnetPort: string
  credentialType: CredentialSetType
  credentialSetIds: number[]
  specificCredentialSet: UpdateDevicePayload["specificCredentialSet"]
  autoTryCredentials: boolean
  comments: string
}

function DeviceEditForm({ freezePasswords = false }: { freezePasswords?: boolean }) {
  const form = useFormContext()
  const { t } = useTranslation()
  const deviceCredentialSetOptions = useDeviceCredentialSetOptions()
  const { data: credentialSets, isPending } = useCredentialSets()

  const overrideConnectionSetting = useWatch({ control: form.control, name: "overrideConnectionSetting" })
  const credentialType = useWatch({ control: form.control, name: "credentialType" })
  const credentialSetIds = useWatch({ control: form.control, name: "credentialSetIds" })

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

  useEffect(() => {
    if (overrideConnectionSetting) return
    form.setValue("connectIpAddress", "")
    form.setValue("sshPort", "")
    form.setValue("telnetPort", "")
  }, [overrideConnectionSetting, form])

  const isSshOrTelnet = [CredentialSetType.SSH, CredentialSetType.Telnet].includes(credentialType)

  return (
    <Stack gap="6">
      <FormControl readOnly label={t("common.name")} placeholder={t("device.name")} control={form.control} name="name" />
      <DeviceTypeSelect disabled label={t("device.type")} control={form.control} name="deviceType" />
      <DomainSelect control={form.control} name="mgmtDomain" />
      <FormControl required label={t("device.interface.ipAddress")} placeholder={t("device.ipAddress")} control={form.control} name="ipAddress" rules={{ pattern: { value: /(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d{1})\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d?\d{1})/g, message: t("common.thisIsNotAValidIpAddress") } }} />
      <Checkbox control={form.control} name="overrideConnectionSetting">{t("device.overrideConnectionSettings")}</Checkbox>
      {overrideConnectionSetting && (
        <>
          <FormControl required label={t("device.connectIp")} placeholder={t("common.eG", { example: "10.216.5.3" })} control={form.control} name="connectIpAddress" rules={{ pattern: { value: /(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d{1})\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d?\d{1})/g, message: t("common.thisIsNotAValidIpAddress") } }} />
          <Stack direction="row" gap="4">
            <FormControl required label={t("network.sshPort")} placeholder={t("common.eG", { example: "22" })} control={form.control} name="sshPort" />
            <FormControl required label={t("network.telnetPort")} placeholder={t("common.eG", { example: "6753" })} control={form.control} name="telnetPort" />
          </Stack>
        </>
      )}
      <Select control={form.control} name="credentialType" options={deviceCredentialSetOptions.options} label={t("credential.label")} placeholder={t("credential.select")} onSelectItem={onCredentialTypeChange} />
      {credentialType === null && !isPending && (
        <Stack gap="2">
          {credentialSets.map((credentialSet) => (
            <NativeCheckbox.Root defaultValue={String(credentialSetIds.includes(credentialSet?.id))} onCheckedChange={() => toggleCredentialSetId(credentialSet?.id)} key={credentialSet?.id} checked={credentialSetIds.includes(credentialSet?.id)}>
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

    const overrideConnectionSetting = Boolean(device?.connectAddress && device?.sshPort && device?.telnetPort)

    let values = {
      name: device?.name,
      deviceType: device?.driver,
      ipAddress: device?.mgmtAddress,
      mgmtDomain: device?.mgmtDomain?.id?.toString(),
      overrideConnectionSetting,
      connectIpAddress: device?.connectAddress ?? "",
      sshPort: device?.sshPort?.toString() ?? "",
      telnetPort: device?.telnetPort?.toString() ?? "",
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
        let updatedDevice: Partial<UpdateDevicePayload> = {
          comments: values?.comments,
          ipAddress: values?.ipAddress,
          mgmtDomain: +values?.mgmtDomain,
          credentialSetIds: values?.credentialSetIds,
          autoTryCredentials: values?.autoTryCredentials,
        }

        if (values.overrideConnectionSetting) {
          updatedDevice = { ...updatedDevice, connectIpAddress: values?.connectIpAddress, sshPort: values?.sshPort, telnetPort: values?.telnetPort }
        }

        if (values.credentialType !== CredentialSetType.GLOBAL) {
          const { username, password, superPassword } = values.specificCredentialSet
          updatedDevice.specificCredentialSet = { type: values.credentialType, username }
          if (password !== PASSWORD_UNCHANGED) updatedDevice.specificCredentialSet.password = password ?? undefined
          if (superPassword !== PASSWORD_UNCHANGED) updatedDevice.specificCredentialSet.superPassword = superPassword ?? undefined
          if (values.credentialType === CredentialSetType.SSHKey) {
            const privateKey = values.specificCredentialSet.privateKey
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
