import { DomainSelect, FormControl } from "@/components"
import { FormControlType } from "@/components/FormControl"
import { Select } from "@/components/Select"
import { CredentialSetType, HashingAlgorithm } from "@/types"
import { Field, Group, Stack } from "@chakra-ui/react"
import { useFormContext, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import {
  useDeviceCredentialAuthTypeOptions,
  useDeviceCredentialPrivateKeyTypeOptions,
  useDeviceCredentialTypeOptions,
} from "../hooks"

export type DeviceCredentialForm = {
  name: string
  mgmtDomain: number | null
  community: string
  type: CredentialSetType
  authKey?: string | null
  authType?: HashingAlgorithm
  privKey?: string | null
  privType?: HashingAlgorithm
  username?: string
  password?: string | null
  superPassword?: string | null
  privateKey?: string | null
}

export type AdministrationDeviceCredentialFormProps = {
  freezeType?: boolean
  freezePasswords?: boolean
}

export default function AdministrationDeviceCredentialForm(props: AdministrationDeviceCredentialFormProps) {
  const { freezeType = false, freezePasswords = false } = props
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
      <DomainSelect
        control={form.control}
        name="mgmtDomain"
        label={t("domain")}
        withAny
      />
      <Select
        required
        disabled={freezeType}
        control={form.control}
        name="type"
        options={deviceCredentialTypeOptions.options}
        label={t("type")}
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
          <Field.Root required={!freezePasswords}>
            <Field.Label>
              {t("authKey")}
              {!freezePasswords && <Field.RequiredIndicator />}
            </Field.Label>
            <Group w="full">
              <Select
                required
                fieldProps={{ flex: "1", w: "auto" }}
                control={form.control}
                name="authType"
                options={deviceCredentialAuthTypeOptions.options}
              />
              <FormControl
                flex="2"
                type={FormControlType.Password}
                placeholder={t("eG", { example: t("secretKey") })}
                required={!freezePasswords}
                allowUnchanged={freezePasswords}
                control={form.control}
                name="authKey"
              />
            </Group>
          </Field.Root>
          <Field.Root required={!freezePasswords}>
            <Field.Label>
              {t("privKey")}
              {!freezePasswords && <Field.RequiredIndicator />}
            </Field.Label>
            <Group w="full">
              <Select
                required
                fieldProps={{ flex: "1", w: "auto" }}
                control={form.control}
                name="privType"
                options={deviceCredentialPrivateKeyTypeOptions.options}
              />
              <FormControl
                flex="2"
                type={FormControlType.Password}
                placeholder={t("eG", { example: t("secretKey") })}
                required={!freezePasswords}
                allowUnchanged={freezePasswords}
                control={form.control}
                name="privKey"
              />
            </Group>
          </Field.Root>
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
            required={!freezePasswords}
            allowUnchanged={freezePasswords}
            type={FormControlType.Password}
            label={t("password")}
            placeholder={t("typeYourPassword")}
            control={form.control}
            name="password"
          />
          <FormControl
            required={!freezePasswords}
            allowUnchanged={freezePasswords}
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
            required={!freezePasswords}
            type={FormControlType.LongText}
            label={t("sshPrivateKey")}
            placeholder={t("typeYourPrivateKey")}
            control={form.control}
            name="privateKey"
            helperText={freezePasswords ? t("leaveEmptyToKeepCurrentKey") : undefined}
          />
          <FormControl
            allowUnchanged={freezePasswords}
            type={FormControlType.Password}
            label={t("passphrase")}
            placeholder={t("typeYourPassphrase")}
            control={form.control}
            name="password"
          />
          <FormControl
            required={!freezePasswords}
            allowUnchanged={freezePasswords}
            type={FormControlType.Password}
            label={t("superPassword")}
            placeholder={t("typeYourSuperPassword")}
            control={form.control}
            name="superPassword"
          />
        </>
      )}
      {[CredentialSetType.SNMP_V1, CredentialSetType.SNMP_V2C].includes(
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
