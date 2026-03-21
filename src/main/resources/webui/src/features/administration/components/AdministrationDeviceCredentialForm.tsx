import { FormControl } from "@/components"
import { FormControlType } from "@/components/FormControl"
import { Select } from "@/components/Select"
import { CredentialSetType, HashingAlgorithm } from "@/types"
import { Stack } from "@chakra-ui/react"
import { useFormContext, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import {
  useDeviceCredentialAuthTypeOptions,
  useDeviceCredentialPrivateKeyTypeOptions,
  useDeviceCredentialTypeOptions,
} from "../hooks"

export type DeviceCredentialForm = {
  name: string
  mgmtDomain: number
  community: string
  type: CredentialSetType
  authKey?: string
  authType?: HashingAlgorithm
  privKey?: string
  privType?: HashingAlgorithm
  username?: string
  password?: string
  superPassword?: string
  publicKey?: string
  privateKey?: string
}

export default function AdministrationDeviceCredentialForm() {
  const form = useFormContext<DeviceCredentialForm>()
  const { t } = useTranslation()
  const deviceCredentialTypeOptions = useDeviceCredentialTypeOptions()
  const deviceCredentialAuthTypeOptions = useDeviceCredentialAuthTypeOptions()
  const deviceCredentialPrivateKeyTypeOptions = useDeviceCredentialPrivateKeyTypeOptions()

  const type = useWatch({
    control: form.control,
    name: "type",
  })

  return (
    <Stack gap="6">
      <FormControl
        label={t("name")}
        placeholder={t("eG", { example: t("credentialName") })}
        required
        control={form.control}
        name="name"
      />
      {/* <DomainSelect required control={form.control} name="mgmtDomain" label={t("domain")} withAny /> */}
      <Select
        required
        control={form.control}
        name="type"
        options={deviceCredentialTypeOptions.options}
        label={t("protocol")}
        placeholder={t("selectAProtocol")}
      />
      {type === CredentialSetType.SNMP_V3 && (
        <>
          <FormControl
            label={t("username")}
            placeholder={t("eG", { example: "admin" })}
            required
            control={form.control}
            name="username"
          />
          <Select
            control={form.control}
            name="authType"
            options={deviceCredentialAuthTypeOptions.options}
            label={t("authType")}
            placeholder={t("selectAnAuthType")}
          />
          <FormControl
            type={FormControlType.Password}
            label={t("authKey")}
            placeholder={t("eG", { example: t("secretKey") })}
            required
            control={form.control}
            name="authKey"
          />
          <Select
            control={form.control}
            name="privType"
            options={deviceCredentialPrivateKeyTypeOptions.options}
            label={t("privType")}
            placeholder={t("selectAPrivType")}
          />
          <FormControl
            type={FormControlType.Password}
            label={t("key")}
            placeholder={t("eG", { example: t("secretKey") })}
            required
            control={form.control}
            name="privKey"
          />
        </>
      )}
      {[CredentialSetType.SSH, CredentialSetType.Telnet].includes(type) && (
        <>
          <FormControl
            required
            label={t("username")}
            placeholder={t("eG", { example: "admin" })}
            control={form.control}
            name="username"
          />
          <FormControl
            required
            type={FormControlType.Password}
            label={t("password")}
            placeholder={t("typeYourPassword")}
            control={form.control}
            name="password"
          />
          <FormControl
            required
            type={FormControlType.Password}
            label={t("superPassword")}
            placeholder={t("typeYourSuperPassword")}
            control={form.control}
            name="superPassword"
          />
        </>
      )}
      {type === CredentialSetType.SSHKey && (
        <>
          <FormControl
            required
            label={t("username")}
            placeholder={t("eG", { example: "admin" })}
            control={form.control}
            name="username"
          />
          <FormControl
            required
            type={FormControlType.LongText}
            label={t("rsaPublicKey")}
            placeholder={t("typeYourPublicKey")}
            control={form.control}
            name="publicKey"
          />
          <FormControl
            required
            type={FormControlType.LongText}
            label={t("sshPrivateKey")}
            placeholder={t("typeYourPrivateKey")}
            control={form.control}
            name="privateKey"
          />
          <FormControl
            required
            type={FormControlType.Password}
            label={t("passphrase")}
            placeholder={t("typeYourPassphrase")}
            control={form.control}
            name="password"
          />
          <FormControl
            required
            type={FormControlType.Password}
            label={t("superPassword")}
            placeholder={t("typeYourSuperPassword")}
            control={form.control}
            name="superPassword"
          />
        </>
      )}
      {[CredentialSetType.SNMP_V1, CredentialSetType.SNMP_V2, CredentialSetType.SNMP_V2C].includes(
        type
      ) && (
        <FormControl
          label={t("community")}
          placeholder={t("eG", { example: "public" })}
          required
          control={form.control}
          name="community"
        />
      )}
    </Stack>
  )
}
