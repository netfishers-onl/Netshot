import api, { CreateDevicePayload } from "@/api"
import { NetshotError } from "@/api/httpClient"
import { DeviceTypeSelect, DomainSelect, Switch } from "@/components"
import FormControl, { FormControlType } from "@/components/FormControl"
import { Select } from "@/components/Select"
import TaskDialog from "@/components/TaskDialog"
import { MUTATIONS } from "@/constants"
import { useCustomDialog, useFormDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { CredentialSetType, DeviceType, PropsWithRenderItem } from "@/types"
import { Separator, Stack } from "@chakra-ui/react"
import { useMutation } from "@tanstack/react-query"
import { useEffect } from "react"
import { useForm, useFormContext, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useDeviceCredentialOptions } from "../hooks"

type Form = {
  ipAddress: string
  domain: string
  autoDiscover: boolean
  deviceType?: DeviceType["name"]
  credentialType?: CredentialSetType
  overrideConnectionSetting?: boolean
  connectIpAddress?: string
  sshPort?: string
  telnetPort?: string
  specificCredentialSet?: CreateDevicePayload["specificCredentialSet"]
}

export type DeviceCreateButtonProps = PropsWithRenderItem

function DeviceCreateForm() {
  const form = useFormContext()
  const { t } = useTranslation()
  const deviceCredentialOptions = useDeviceCredentialOptions()

  const autoDiscover = useWatch({
    control: form.control,
    name: "autoDiscover",
  })

  const overrideConnectionSetting = useWatch({
    control: form.control,
    name: "overrideConnectionSetting",
  })

  const credentialType = useWatch({
    control: form.control,
    name: "credentialType",
  })

  useEffect(() => {
    const { unsubscribe } = form.watch((values) => {
      console.log(values)
    })

    return () => unsubscribe()
  }, [form])

  // When autodiscover changes reset fields
  useEffect(() => {
    form.setValue("credentialType", autoDiscover ? null : deviceCredentialOptions.options[0].value)
    form.setValue("overrideConnectionSetting", false)
    form.setValue("deviceType", null)
  }, [autoDiscover])

  // When credential type changes reset all relative field
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
  }, [credentialType])

  // When override connection setting changes reset all relative field
  useEffect(() => {
    form.setValue("connectIPAddress", "")
    form.setValue("sshPort", "")
    form.setValue("telnetPort", "")
  }, [overrideConnectionSetting])

  return (
    <Stack gap="6">
      <DomainSelect required control={form.control} name="domain" />
      <FormControl
        required
        label={t("ipAddress")}
        placeholder={t("deviceIpAddress")}
        control={form.control}
        name="ipAddress"
        rules={{
          pattern: {
            value: /(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d{1})\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d?\d{1})/g,
            message: t("thisIsNotAValidIpAddress"),
          },
        }}
      />
      <Separator />
      <Switch
        label={t("autodiscover")}
        description={t("automaticallyDiscoverDeviceType")}
        control={form.control}
        name="autoDiscover"
      />
      {!autoDiscover && (
        <>
          <DeviceTypeSelect required control={form.control} name="deviceType" />
          <Separator />
          <Switch
            label={t("overrideConnection")}
            description={t("replaceDefaultConnectionSettings")}
            control={form.control}
            name="overrideConnectionSetting"
          />
          {overrideConnectionSetting && (
            <>
              <FormControl
                required
                label={t("connectIp")}
                placeholder={t("eG", { example: "10.216.5.3" })}
                control={form.control}
                name="connectIpAddress"
                rules={{
                  pattern: {
                    value:
                      /(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d{1})\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d?\d{1})/g,
                    message: t("thisIsNotAValidIpAddress"),
                  },
                }}
              />
              <Stack direction="row" gap="4">
                <FormControl
                  label={t("sshPort")}
                  placeholder={t("eG", { example: "22" })}
                  control={form.control}
                  name="sshPort"
                />
                <FormControl
                  label={t("telnetPort")}
                  placeholder={t("eG", { example: "23" })}
                  control={form.control}
                  name="telnetPort"
                />
              </Stack>
            </>
          )}
          <Separator />
          <Select
            control={form.control}
            name="credentialType"
            options={deviceCredentialOptions.options}
            label={t("credentials")}
            placeholder={t("selectACredential")}
            required
          />
          {[CredentialSetType.SSH, CredentialSetType.Telnet].includes(credentialType) && (
            <>
              <FormControl
                required
                label={t("username")}
                placeholder={t("eG", { example: "admin" })}
                control={form.control}
                name="specificCredentialSet.username"
              />
              <FormControl
                required
                type={FormControlType.Password}
                label={t("password")}
                placeholder={t("typeYourPassword")}
                control={form.control}
                name="specificCredentialSet.password"
              />
              <FormControl
                required
                type={FormControlType.Password}
                label={t("superPassword")}
                placeholder={t("typeYourSuperPassword")}
                control={form.control}
                name="specificCredentialSet.superPassword"
              />
            </>
          )}

          {credentialType === CredentialSetType.SSHKey && (
            <>
              <FormControl
                required
                label={t("username")}
                placeholder={t("eG", { example: "admin" })}
                control={form.control}
                name="specificCredentialSet.username"
              />
              <FormControl
                required
                type={FormControlType.LongText}
                label={t("sshPrivateKey")}
                placeholder={t("typeYourPrivateKey")}
                control={form.control}
                name="specificCredentialSet.privateKey"
              />
              <FormControl
                required
                type={FormControlType.Password}
                label={t("passphrase")}
                placeholder={t("typeYourPassphrase")}
                control={form.control}
                name="specificCredentialSet.password"
              />
              <FormControl
                required
                type={FormControlType.Password}
                label={t("superPassword")}
                placeholder={t("typeYourSuperPassword")}
                control={form.control}
                name="specificCredentialSet.superPassword"
              />
            </>
          )}
        </>
      )}
    </Stack>
  )
}

export default function DeviceCreateButton(props: DeviceCreateButtonProps) {
  const { renderItem } = props
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
      overrideConnectionSetting: false,
      connectIpAddress: "",
      sshPort: "",
      telnetPort: "",
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
      title: t("addDevice"),
      description: <DeviceCreateForm />,
      form,
      async onSubmit(values: Form) {
        let newDevice = {
          deviceType: values?.deviceType,
          autoDiscoveryTask: -1,
          autoDiscover: values.autoDiscover,
          ipAddress: values?.ipAddress,
          domainId: +values?.domain,
        } as CreateDevicePayload

        if (values.overrideConnectionSetting) {
          newDevice = {
            ...newDevice,
            connectIpAddress: values.connectIpAddress,
            sshPort: values.sshPort,
            telnetPort: values.telnetPort,
          }
        }

        if (!values.autoDiscover && values.credentialType !== CredentialSetType.GLOBAL) {
          const { username, password, superPassword } = values.specificCredentialSet

          newDevice.specificCredentialSet = {
            type: values.credentialType,
            username,
            password,
            superPassword,
          }

          if (values.credentialType === CredentialSetType.SSHKey) {
            newDevice.specificCredentialSet = {
              ...newDevice.specificCredentialSet,
              privateKey: values.specificCredentialSet.privateKey,
            }
          }
        }

        const task = await mutation.mutateAsync(newDevice)

        dialogRef.close()

        taskDialog.open(<TaskDialog id={task?.id} />)
      },
      size: "lg",
      submitButton: {
        label: t("add"),
      },
    })
  }

  return renderItem(open)
}
