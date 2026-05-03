import { DomainSelect, FormControl } from "@/components"
import { FormControlType } from "@/components/FormControl"
import { Select } from "@/components/Select"
import { CredentialSetType, HashingAlgorithm } from "@/types"
import { Field, Group, Stack } from "@chakra-ui/react"
import { useFormContext, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import {
  useDeviceCredentialSetAuthTypeOptions,
  useDeviceCredentialSetPrivateKeyTypeOptions,
  useDeviceCredentialSetTypeOptions,
} from "../hooks"

export type DeviceCredentialSetForm = {
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

export type AdministrationDeviceCredentialSetFormProps = {
  freezeType?: boolean
  freezePasswords?: boolean
}

export default function AdministrationDeviceCredentialSetForm(props: AdministrationDeviceCredentialSetFormProps) {
  const { freezeType = false, freezePasswords = false } = props
  const form = useFormContext<DeviceCredentialSetForm>()
  const { t } = useTranslation()
  const deviceCredentialSetTypeOptions = useDeviceCredentialSetTypeOptions()
  const deviceCredentialSetAuthTypeOptions = useDeviceCredentialSetAuthTypeOptions()
  const deviceCredentialSetPrivateKeyTypeOptions = useDeviceCredentialSetPrivateKeyTypeOptions()

  const type = useWatch({
    control: form.control,
    name: "type",
  })

  return (
    <Stack gap="6">
      <FormControl
        label={t("common.name")}
        placeholder={t("common.eG", { example: t("credential.namePlaceholder") })}
        required
        control={form.control}
        name="name"
      />
      <DomainSelect
        control={form.control}
        name="mgmtDomain"
        label={t("domain.label")}
        withAny
      />
      <Select
        required
        disabled={freezeType}
        control={form.control}
        name="type"
        options={deviceCredentialSetTypeOptions.options}
        label={t("common.type")}
        placeholder={t("network.selectProtocol")}
      />
      {type === CredentialSetType.SNMP_V3 && (
        <>
          <FormControl
            label={t("user.username")}
            placeholder={t("common.eG", { example: "admin" })}
            required
            control={form.control}
            name="username"
          />
          <Field.Root required={!freezePasswords}>
            <Field.Label>
              {t("network.authKey")}
              {!freezePasswords && <Field.RequiredIndicator />}
            </Field.Label>
            <Group w="full">
              <Select
                required
                fieldProps={{ flex: "1", w: "auto" }}
                control={form.control}
                name="authType"
                options={deviceCredentialSetAuthTypeOptions.options}
              />
              <FormControl
                flex="2"
                type={FormControlType.Password}
                placeholder={t("common.eG", { example: t("credential.secretKey") })}
                required={!freezePasswords}
                allowUnchanged={freezePasswords}
                control={form.control}
                name="authKey"
              />
            </Group>
          </Field.Root>
          <Field.Root required={!freezePasswords}>
            <Field.Label>
              {t("network.privKey")}
              {!freezePasswords && <Field.RequiredIndicator />}
            </Field.Label>
            <Group w="full">
              <Select
                required
                fieldProps={{ flex: "1", w: "auto" }}
                control={form.control}
                name="privType"
                options={deviceCredentialSetPrivateKeyTypeOptions.options}
              />
              <FormControl
                flex="2"
                type={FormControlType.Password}
                placeholder={t("common.eG", { example: t("credential.secretKey") })}
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
            label={t("user.username")}
            placeholder={t("common.eG", { example: "admin" })}
            control={form.control}
            name="username"
          />
          <FormControl
            required={!freezePasswords}
            allowUnchanged={freezePasswords}
            type={FormControlType.Password}
            label={t("auth.password")}
            placeholder={t("auth.typeYourPassword")}
            control={form.control}
            name="password"
          />
          <FormControl
            required={!freezePasswords}
            allowUnchanged={freezePasswords}
            type={FormControlType.Password}
            label={t("network.superPassword")}
            placeholder={t("network.typeSuperPassword")}
            control={form.control}
            name="superPassword"
          />
        </>
      )}
      {type === CredentialSetType.SSHKey && (
        <>
          <FormControl
            required
            label={t("user.username")}
            placeholder={t("common.eG", { example: "admin" })}
            control={form.control}
            name="username"
          />
          <FormControl
            required={!freezePasswords}
            type={FormControlType.LongText}
            label={t("network.sshPrivateKey")}
            placeholder={t("network.typePrivateKey")}
            control={form.control}
            name="privateKey"
            helperText={freezePasswords ? t("auth.leaveEmptyToKeepCurrentKey") : undefined}
          />
          <FormControl
            allowUnchanged={freezePasswords}
            type={FormControlType.Password}
            label={t("network.passphrase")}
            placeholder={t("network.typePassphrase")}
            control={form.control}
            name="password"
          />
          <FormControl
            required={!freezePasswords}
            allowUnchanged={freezePasswords}
            type={FormControlType.Password}
            label={t("network.superPassword")}
            placeholder={t("network.typeSuperPassword")}
            control={form.control}
            name="superPassword"
          />
        </>
      )}
      {[CredentialSetType.SNMP_V1, CredentialSetType.SNMP_V2C].includes(
        type
      ) && (
        <FormControl
          label={t("common.community")}
          placeholder={t("common.eG", { example: "public" })}
          required
          control={form.control}
          name="community"
        />
      )}
    </Stack>
  )
}
