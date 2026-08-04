import api, { UpdateDevicePayload } from "@/api"
import { NetshotError } from "@/api/httpClient"
import { DomainSelect } from "@/features/administration/components"
import DeviceTypeSelect from "./DeviceTypeSelect"
import DeviceAccessFields, { buildAccessesPayload, DeviceAccessFormValue, TRY_ALL_CREDENTIALS_VALUE } from "./DeviceAccessFields"
import FormControl, { FormControlType, PASSWORD_UNCHANGED } from "@/components/FormControl"
import { MUTATIONS, QUERIES } from "@/constants"
import { useFormDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { CredentialSetType, Device } from "@/types"
import validators from "@/utils/validators"
import { Alert, Separator, Stack } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo } from "react"
import { useForm, useFormContext, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import React from "react"
import Slot from "@/components/Slot"
import { useCredentialSets } from "../api"
import { useDeviceTypeOptions } from "../hooks"

export type EditDeviceTriggerProps = { device: Device; children: React.ReactElement<Record<string, unknown>> } & Record<string, unknown>

type Form = {
  name: string
  deviceType: string
  ipAddress: string
  mgmtDomain: string
  accesses: DeviceAccessFormValue[]
  comments: string
}

function DeviceEditForm() {
  const form = useFormContext()
  const { t } = useTranslation()
  const { isPending, getOptionByDriver } = useDeviceTypeOptions()

  const deviceType = useWatch({ control: form.control, name: "deviceType" })

  const selectedDeviceType = getOptionByDriver(deviceType)?.value
  const isDriverMissing = !isPending && Boolean(deviceType) && !selectedDeviceType

  return (
    <Stack gap="6">
      <FormControl readOnly label={t("common.name")} placeholder={t("device.name")} control={form.control} name="name" />
      {isDriverMissing ? (
        <Alert.Root variant="warning">
          <Alert.Indicator />
          <Alert.Title>
            {t("device.driverNotLoaded", { driver: deviceType })}
          </Alert.Title>
        </Alert.Root>
      ) : (
        <DeviceTypeSelect disabled label={t("device.type")} control={form.control} name="deviceType" />
      )}
      <DomainSelect control={form.control} name="mgmtDomain" />
      <FormControl required label={t("device.mgmtAddress")} placeholder={t("common.eG", { example: "10.216.5.3, 2001:db8::1, router1.example.com" })} control={form.control} name="ipAddress" rules={validators.hostOrIp()} />
      {selectedDeviceType && Object.keys(selectedDeviceType.accessDefinitions ?? {}).length > 0 && (
        <>
          <Separator />
          <DeviceAccessFields control={form.control} accessDefinitions={selectedDeviceType.accessDefinitions} />
          <Separator />
        </>
      )}
      <FormControl type={FormControlType.LongText} autosize rows={2} label={t("common.comments")} placeholder={t("device.addDescription")} control={form.control} name="comments" />
    </Stack>
  )
}

export default function EditDeviceTrigger({ device, children, ...rest }: EditDeviceTriggerProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const queryClient = useQueryClient()
  const { data: credentialSets } = useCredentialSets()
  const { getOptionByDriver } = useDeviceTypeOptions()
  const dialog = useFormDialogWithMutation()

  const defaultValues = useMemo(() => {
    // Enumerate every access the driver declares (not just the ones with an
    // existing row) so an access with no row - "never used", see
    // `AccessManager` - correctly defaults to "none" instead of being
    // silently re-enabled as "global"/auto-try just because the edit form
    // was reopened.
    const accessDefinitions = getOptionByDriver(device?.driver ?? null)?.value?.accessDefinitions ?? {}
    const existingByName = new Map((device?.accesses ?? []).map((access) => [access.accessName, access]))
    const accesses = Object.entries(accessDefinitions).map(([accessName, def]) => {
      const access = existingByName.get(accessName)
      return {
        accessName,
        protocol: def.protocol,
        defaultPort: def.defaultPort,
        overrideConnection: Boolean(access?.address) || Boolean(access?.port),
        address: access?.address ?? "",
        port: access?.port?.toString() ?? "",
        mode: !access
          ? "none"
          : access.specificCredentialSet
            ? "specific"
            : "global",
        globalCredentialSetId: access?.globalCredentialSet?.id?.toString() ?? TRY_ALL_CREDENTIALS_VALUE,
        sshAuthMethod: access?.specificCredentialSet?.type === CredentialSetType.SSHKey ? "key" : "password",
        username: access?.specificCredentialSet?.username ?? "",
        password: access?.specificCredentialSet ? PASSWORD_UNCHANGED : "",
        superPassword: access?.specificCredentialSet ? PASSWORD_UNCHANGED : "",
        privateKey: access?.specificCredentialSet?.type === CredentialSetType.SSHKey ? PASSWORD_UNCHANGED : "",
        community: access?.specificCredentialSet ? PASSWORD_UNCHANGED : "",
        authType: access?.specificCredentialSet?.authType,
        authKey: access?.specificCredentialSet ? PASSWORD_UNCHANGED : "",
        privType: access?.specificCredentialSet?.privType,
        privKey: access?.specificCredentialSet ? PASSWORD_UNCHANGED : "",
      }
    }) as DeviceAccessFormValue[]

    return {
      name: device?.name,
      deviceType: device?.driver,
      ipAddress: device?.mgmtAddress,
      mgmtDomain: device?.mgmtDomain?.id?.toString(),
      accesses,
      comments: device?.comments ?? "",
    } as Form
  }, [device, getOptionByDriver])

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
      description: <DeviceEditForm />,
      form,
      size: "lg",
      async onSubmit(values: Form) {
        const updatedDevice: Partial<UpdateDevicePayload> = {
          comments: values?.comments,
          ipAddress: values?.ipAddress,
          mgmtDomain: +values?.mgmtDomain,
        }

        updatedDevice.accesses = buildAccessesPayload(values.accesses, credentialSets)

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
