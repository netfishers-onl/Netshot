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
        label={t("Name")}
        placeholder={t("E.g. {{example}}", { example: t("credential name") })}
        required
        control={form.control}
        name="name"
      />
      {/* <DomainSelect required control={form.control} name="mgmtDomain" label={t("Domain")} withAny /> */}
      <Select
        required
        control={form.control}
        name="type"
        options={deviceCredentialTypeOptions.options}
        label={t("Protocol")}
        placeholder={t("Select a protocol")}
      />
      {type === CredentialSetType.SNMP_V3 && (
        <>
          <FormControl
            label={t("Username")}
            placeholder={t("E.g. {{example}}", { example: "admin" })}
            required
            control={form.control}
            name="username"
          />
          <Select
            control={form.control}
            name="authType"
            options={deviceCredentialAuthTypeOptions.options}
            label={t("Auth type")}
            placeholder={t("Select an auth type")}
          />
          <FormControl
            type={FormControlType.Password}
            label={t("Auth key")}
            placeholder={t("E.g. {{example}}", { example: t("secret key") })}
            required
            control={form.control}
            name="authKey"
          />
          <Select
            control={form.control}
            name="privType"
            options={deviceCredentialPrivateKeyTypeOptions.options}
            label={t("Priv type")}
            placeholder={t("Select a priv type")}
          />
          <FormControl
            type={FormControlType.Password}
            label={t("Key")}
            placeholder={t("E.g. {{example}}", { example: t("secret key") })}
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
            label={t("Username")}
            placeholder={t("E.g. {{example}}", { example: "admin" })}
            control={form.control}
            name="username"
          />
          <FormControl
            required
            type={FormControlType.Password}
            label={t("Password")}
            placeholder={t("Type your password")}
            control={form.control}
            name="password"
          />
          <FormControl
            required
            type={FormControlType.Password}
            label={t("Super password")}
            placeholder={t("Type your super password")}
            control={form.control}
            name="superPassword"
          />
        </>
      )}
      {type === CredentialSetType.SSHKey && (
        <>
          <FormControl
            required
            label={t("Username")}
            placeholder={t("E.g. {{example}}", { example: "admin" })}
            control={form.control}
            name="username"
          />
          <FormControl
            required
            type={FormControlType.LongText}
            label={t("RSA Public Key")}
            placeholder={t("Type your public key")}
            control={form.control}
            name="publicKey"
          />
          <FormControl
            required
            type={FormControlType.LongText}
            label={t("SSH Private Key")}
            placeholder={t("Type your private key")}
            control={form.control}
            name="privateKey"
          />
          <FormControl
            required
            type={FormControlType.Password}
            label={t("Passphrase")}
            placeholder={t("Type your passphrase")}
            control={form.control}
            name="password"
          />
          <FormControl
            required
            type={FormControlType.Password}
            label={t("Super password")}
            placeholder={t("Type your super password")}
            control={form.control}
            name="superPassword"
          />
        </>
      )}
      {[CredentialSetType.SNMP_V1, CredentialSetType.SNMP_V2, CredentialSetType.SNMP_V2C].includes(
        type
      ) && (
        <FormControl
          label={t("Community")}
          placeholder={t("E.g. {{example}}", { example: "public" })}
          required
          control={form.control}
          name="community"
        />
      )}
    </Stack>
  )
}
