import api, { UpdateDevicePayload } from "@/api"
import { NetshotError } from "@/api/httpClient"
import { Checkbox, DomainSelect } from "@/components"
import FormControl, { FormControlType } from "@/components/FormControl"
import { Select } from "@/components/Select"
import { MUTATIONS, QUERIES } from "@/constants"
import { useFormDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { CredentialSetType, Device, PropsWithRenderItem } from "@/types"
import { Checkbox as NativeCheckbox, Stack } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo } from "react"
import { useForm, useFormContext, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useCredentialSets } from "../api"
import { useDeviceCredentialOptions } from "../hooks"

export type DeviceEditButtonProps = PropsWithRenderItem<{
  device: Device
}>

type Form = {
  name: string
  ipAddress: string
  mgmtDomain: string
  // Override connection settings
  overrideConnectionSetting: boolean
  connectIpAddress: string
  sshPort: string
  telnetPort: string
  credentialType: CredentialSetType
  // netshot SNMP, SSH, Fake SNMP, Fake SSH
  credentialSetIds: number[]
  specificCredentialSet: UpdateDevicePayload["specificCredentialSet"]
  // In case of failure, also try all known credentials
  autoTryCredentials: boolean
  comments: string
}

function DeviceEditForm() {
  const form = useFormContext()
  const { t } = useTranslation()
  const deviceCredentialOptions = useDeviceCredentialOptions()
  const { data: credentialSets, isPending } = useCredentialSets()

  const overrideConnectionSetting = useWatch({
    control: form.control,
    name: "overrideConnectionSetting",
  })

  const credentialType = useWatch({
    control: form.control,
    name: "credentialType",
  })

  const credentialSetIds = useWatch({
    control: form.control,
    name: "credentialSetIds",
  })

  function toggleCredentialSetId(id: number) {
    const ids = [...credentialSetIds] as number[]
    const index = credentialSetIds.findIndex((i) => i === id)

    if (index !== -1) {
      ids.splice(index, 1)
    } else {
      ids.push(id)
    }

    form.setValue("credentialSetIds", ids)
  }

  // When credential type changes reset all relative field
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

  // When override connection setting changes reset all relative field
  useEffect(() => {
    if (overrideConnectionSetting) return

    form.setValue("connectIpAddress", "")
    form.setValue("sshPort", "")
    form.setValue("telnetPort", "")
  }, [overrideConnectionSetting])

  const isSshOrTelnet = [CredentialSetType.SSH, CredentialSetType.Telnet].includes(credentialType)

  return (
    <Stack gap="6">
      <FormControl
        readOnly
        label={t("Name")}
        placeholder={t("Device name")}
        control={form.control}
        name="name"
      />
      <FormControl
        required
        label={t("IP Address")}
        placeholder={t("Device IP address")}
        control={form.control}
        name="ipAddress"
        rules={{
          pattern: {
            value: /(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d{1})\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d?\d{1})/g,
            message: t("This is not a valid IP address"),
          },
        }}
      />
      <DomainSelect control={form.control} name="mgmtDomain" />
      <Checkbox control={form.control} name="overrideConnectionSetting">
        {t("Override connection settings")}
      </Checkbox>
      {overrideConnectionSetting && (
        <>
          <FormControl
            required
            label={t("Connect IP")}
            placeholder={t("e.g. 10.216.5.3")}
            control={form.control}
            name="connectIpAddress"
            rules={{
              pattern: {
                value:
                  /(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d{1})\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d?\d{1})/g,
                message: t("This is not a valid IP address"),
              },
            }}
          />
          <Stack direction="row" gap="4">
            <FormControl
              required
              label={t("SSH port")}
              placeholder={t("e.g. 22")}
              control={form.control}
              name="sshPort"
            />
            <FormControl
              required
              label={t("Telnet port")}
              placeholder={t("e.g. 6753")}
              control={form.control}
              name="telnetPort"
            />
          </Stack>
        </>
      )}
      <Select
        control={form.control}
        name="credentialType"
        options={deviceCredentialOptions.options}
        label={t("Credential")}
        placeholder={t("Select a credential")}
        onSelectItem={onCredentialTypeChange}
      />
      {credentialType === null && !isPending && (
        <>
          <Stack gap="2">
            {credentialSets.map((credentialSet) => (
              <NativeCheckbox.Root
                defaultValue={String(credentialSetIds.includes(credentialSet?.id))}
                onCheckedChange={() => toggleCredentialSetId(credentialSet?.id)}
                key={credentialSet?.id}
                checked={credentialSetIds.includes(credentialSet?.id)}
              >
                <NativeCheckbox.HiddenInput />
                <NativeCheckbox.Control />
                <NativeCheckbox.Label>
                  {credentialSet?.name} ({credentialSet?.type})
                </NativeCheckbox.Label>
              </NativeCheckbox.Root>
            ))}
            <Checkbox control={form.control} name="autoTryCredentials">
              {t("In case of failure, also try all known credentials")}
            </Checkbox>
          </Stack>
        </>
      )}
      {isSshOrTelnet && (
        <>
          <FormControl
            required
            label={t("Username")}
            placeholder={t("e.g. admin")}
            control={form.control}
            name="specificCredentialSet.username"
            autoComplete="nope"
          />
          <FormControl
            required
            type={FormControlType.Password}
            label={t("Password")}
            placeholder={t("Type your password")}
            control={form.control}
            name="specificCredentialSet.password"
            autoComplete="nope"
          />
          <FormControl
            type={FormControlType.Password}
            label={t("Super password")}
            placeholder={t("Type your super password")}
            control={form.control}
            name="specificCredentialSet.superPassword"
            autoComplete="nope"
          />
        </>
      )}
      {credentialType === CredentialSetType.SSHKey && (
        <>
          <FormControl
            required
            label={t("Username")}
            placeholder={t("e.g. admin")}
            control={form.control}
            name="specificCredentialSet.username"
            autoComplete="nope"
          />
          <FormControl
            required
            type={FormControlType.LongText}
            label={t("SSH Private Key")}
            placeholder={t("Type your private key")}
            control={form.control}
            name="specificCredentialSet.privateKey"
            autoComplete="nope"
          />
          <FormControl
            required
            type={FormControlType.Password}
            label={t("Passphrase")}
            placeholder={t("Type your passphrase")}
            control={form.control}
            name="specificCredentialSet.password"
            autoComplete="nope"
          />
          <FormControl
            type={FormControlType.Password}
            label={t("Super password")}
            placeholder={t("Type your super password")}
            control={form.control}
            name="specificCredentialSet.superPassword"
            autoComplete="nope"
          />
        </>
      )}
      <FormControl
        type={FormControlType.LongText}
        label={t("Comments")}
        placeholder={t("Add description about the device")}
        control={form.control}
        name="comments"
      />
    </Stack>
  )
}

export default function DeviceEditButton(props: DeviceEditButtonProps) {
  const { device, renderItem } = props
  const { t } = useTranslation()
  const toast = useToast()
  const queryClient = useQueryClient()
  const deviceCredentialOptions = useDeviceCredentialOptions()
  const dialog = useFormDialogWithMutation()

  const defaultValues = useMemo(() => {
    const credentialType = device?.specificCredentialSet
      ? device?.specificCredentialSet?.type
      : deviceCredentialOptions.getFirst().value

    const overrideConnectionSetting = Boolean(
      device?.connectAddress && device?.sshPort && device?.telnetPort
    )

    let values = {
      name: device?.name,
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
          privateKey: device.specificCredentialSet.privateKey,
          password: device.specificCredentialSet.password,
          superPassword: device.specificCredentialSet.superPassword,
        },
      }
    }

    return values
  }, [device])

  const form = useForm<Form>({
    mode: "onChange",
    defaultValues,
  })

  const mutation = useMutation({
    mutationKey: MUTATIONS.DEVICE_UPDATE,
    mutationFn: async (payload: Partial<UpdateDevicePayload>) =>
      api.device.update(device?.id, payload),
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  const open = () => {
    const dialogRef = dialog.open(MUTATIONS.DEVICE_UPDATE, {
      title: t("Edit device"),
      description: <DeviceEditForm />,
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
          updatedDevice = {
            ...updatedDevice,
            connectIpAddress: values?.connectIpAddress,
            sshPort: values?.sshPort,
            telnetPort: values?.telnetPort,
          }
        }

        if (values.credentialType !== CredentialSetType.GLOBAL) {
          const { username, password, superPassword } = values.specificCredentialSet

          updatedDevice.specificCredentialSet = {
            type: values.credentialType,
            username,
            password,
            superPassword,
          }

          if (values.credentialType === CredentialSetType.SSHKey) {
            updatedDevice.specificCredentialSet = {
              ...updatedDevice.specificCredentialSet,
              privateKey: values.specificCredentialSet.privateKey,
            }
          }
        }

        await mutation.mutateAsync(updatedDevice)

        dialogRef.close()

        toast.success({
          title: t("Success"),
          description: t("Device {{device}} has been successfully modified", {
            device: device?.name,
          }),
        })
        queryClient.invalidateQueries({
          queryKey: [QUERIES.DEVICE_DETAIL, +device?.id],
        })
      },
      submitButton: {
        label: t("Apply changes"),
      },
    })
  }

  return renderItem(open)
}
