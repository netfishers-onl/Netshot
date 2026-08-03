import { useDeviceCredentialSetAuthTypeOptions, useDeviceCredentialSetPrivateKeyTypeOptions } from "@/features/administration/hooks"
import FormControl, { FormControlType } from "@/components/FormControl"
import { Select } from "@/components/Select"
import Switch from "@/components/Switch"
import { CredentialSet, CredentialSetType, DeviceAccess, DeviceAccessDefinition, DeviceTypeProtocol, HashingAlgorithm } from "@/types"
import { Collapsible, Field, Group, Separator, Stack, Text } from "@chakra-ui/react"
import { useEffect, useMemo, useState } from "react"
import { Control, useFieldArray, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { LuChevronRight } from "react-icons/lu"
import { useCredentialSets } from "../api"

export type DeviceAccessCredentialMode = "none" | "global" | "specific"
export type SshAuthMethod = "password" | "key"

/** Sentinel `globalCredentialSetId` value meaning "try every eligible credential set" instead of a specific pick. */
export const TRY_ALL_CREDENTIALS_VALUE = "__try_all__"

export type DeviceAccessFormValue = {
  accessName: string
  protocol: string
  defaultPort: number
  overrideConnection: boolean
  address: string
  port: string
  mode: DeviceAccessCredentialMode
  globalCredentialSetId: string
  sshAuthMethod: SshAuthMethod
  username: string
  password: string | null
  superPassword: string | null
  privateKey: string | null
  community: string
  authType?: HashingAlgorithm
  authKey?: string | null
  privType?: HashingAlgorithm
  privKey?: string | null
}

export type DeviceAccessFieldsProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>
  accessDefinitions: Record<string, DeviceAccessDefinition> | undefined
}

/** Known protocol acronyms, kept fully (or conventionally) cased when humanizing an access/group name. */
const ACCESS_NAME_ACRONYMS: Record<string, string> = {
  ssh: "SSH",
  telnet: "Telnet",
  http: "HTTP",
  https: "HTTPS",
  snmp: "SNMP",
  snmpv1: "SNMPv1",
  snmpv2c: "SNMPv2c",
  snmpv3: "SNMPv3",
}

/** Turns an access's camelCase JS key (e.g. "alternateSsh") into a readable label ("Alternate SSH"). */
function humanizeAccessName(name: string): string {
  const spaced = name.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
  return spaced
    .split(" ")
    .map((word) => ACCESS_NAME_ACRONYMS[word.toLowerCase()] ?? word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

/** The credential type for a "define specific credentials" row, keyed by the access's protocol (SSH may instead resolve to SSH Key, see `sshAuthMethod`). */
export function getSpecificCredentialType(protocol: string): CredentialSetType | undefined {
  switch (protocol) {
    case DeviceTypeProtocol.Ssh:
      return CredentialSetType.SSH
    case DeviceTypeProtocol.Telnet:
      return CredentialSetType.Telnet
    case DeviceTypeProtocol.Http:
    case DeviceTypeProtocol.Https:
      return CredentialSetType.HTTP
    case DeviceTypeProtocol.SnmpV1:
      return CredentialSetType.SNMP_V1
    case DeviceTypeProtocol.SnmpV2c:
      return CredentialSetType.SNMP_V2C
    case DeviceTypeProtocol.SnmpV3:
      return CredentialSetType.SNMP_V3
    default:
      return undefined
  }
}

/** Same as {@link getSpecificCredentialType}, but for an SSH access, honors the row's password-vs-key choice. */
function getEffectiveSpecificCredentialType(protocol: string, sshAuthMethod: SshAuthMethod): CredentialSetType | undefined {
  if (protocol === DeviceTypeProtocol.Ssh && sshAuthMethod === "key") {
    return CredentialSetType.SSHKey
  }
  return getSpecificCredentialType(protocol)
}

/** Global credential sets compatible with an access's protocol (SSH accesses also accept SSH-key sets). */
function getCompatibleCredentialTypes(protocol: string): CredentialSetType[] {
  if (protocol === DeviceTypeProtocol.Ssh) {
    return [CredentialSetType.SSH, CredentialSetType.SSHKey]
  }
  const type = getSpecificCredentialType(protocol)
  return type ? [type] : []
}

export type SpecificCredentialFieldsProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>
  namePrefix: string
  type: CredentialSetType
  /** True when editing an access that already has a stored secret - shows the lock icon and preserves it unless explicitly changed. */
  allowUnchanged: boolean
}

/** Renders exactly the fields relevant to one credential type, nested under `namePrefix`. */
export function SpecificCredentialFields({ control, namePrefix, type, allowUnchanged }: SpecificCredentialFieldsProps) {
  const { t } = useTranslation()
  const authTypeOptions = useDeviceCredentialSetAuthTypeOptions()
  const privateKeyTypeOptions = useDeviceCredentialSetPrivateKeyTypeOptions()

  if (type === CredentialSetType.SSH || type === CredentialSetType.Telnet) {
    return (
      <>
        <FormControl
          required
          label={t("user.username")}
          placeholder={t("common.eG", { example: "admin" })}
          control={control}
          name={`${namePrefix}.username`}
        />
        <FormControl
          required={!allowUnchanged}
          allowUnchanged={allowUnchanged}
          type={FormControlType.Password}
          label={t("auth.password")}
          placeholder={t("auth.typeYourPassword")}
          control={control}
          name={`${namePrefix}.password`}
        />
        <FormControl
          allowUnchanged={allowUnchanged}
          type={FormControlType.Password}
          label={t("network.superPassword")}
          placeholder={t("network.typeSuperPassword")}
          control={control}
          name={`${namePrefix}.superPassword`}
        />
      </>
    )
  }
  if (type === CredentialSetType.SSHKey) {
    return (
      <>
        <FormControl
          required
          label={t("user.username")}
          placeholder={t("common.eG", { example: "admin" })}
          control={control}
          name={`${namePrefix}.username`}
        />
        <FormControl
          required={!allowUnchanged}
          allowUnchanged={allowUnchanged}
          autosize
          rows={2}
          type={FormControlType.LongText}
          label={t("network.sshPrivateKey")}
          placeholder={t("network.typePrivateKey")}
          control={control}
          name={`${namePrefix}.privateKey`}
        />
        <FormControl
          allowUnchanged={allowUnchanged}
          type={FormControlType.Password}
          label={t("network.passphrase")}
          placeholder={t("network.typePassphrase")}
          control={control}
          name={`${namePrefix}.password`}
        />
        <FormControl
          allowUnchanged={allowUnchanged}
          type={FormControlType.Password}
          label={t("network.superPassword")}
          placeholder={t("network.typeSuperPassword")}
          control={control}
          name={`${namePrefix}.superPassword`}
        />
      </>
    )
  }
  if (type === CredentialSetType.HTTP) {
    return (
      <>
        <FormControl
          label={t("user.username")}
          placeholder={t("common.eG", { example: "admin" })}
          control={control}
          name={`${namePrefix}.username`}
        />
        <FormControl
          required={!allowUnchanged}
          allowUnchanged={allowUnchanged}
          type={FormControlType.Password}
          label={t("auth.password")}
          placeholder={t("auth.typeYourPassword")}
          control={control}
          name={`${namePrefix}.password`}
        />
      </>
    )
  }
  if (type === CredentialSetType.SNMP_V1 || type === CredentialSetType.SNMP_V2C) {
    return (
      <FormControl
        required
        label={t("common.community")}
        placeholder={t("common.eG", { example: "public" })}
        control={control}
        name={`${namePrefix}.community`}
      />
    )
  }
  if (type === CredentialSetType.SNMP_V3) {
    return (
      <>
        <FormControl
          required
          label={t("user.username")}
          placeholder={t("common.eG", { example: "admin" })}
          control={control}
          name={`${namePrefix}.username`}
        />
        <Field.Root required={!allowUnchanged}>
          <Field.Label>
            {t("network.authKey")}
            {!allowUnchanged && <Field.RequiredIndicator />}
          </Field.Label>
          <Group w="full">
            <Select
              required
              fieldProps={{ flex: "1", w: "auto" }}
              control={control}
              name={`${namePrefix}.authType`}
              options={authTypeOptions.options}
            />
            <FormControl
              flex="2"
              type={FormControlType.Password}
              allowUnchanged={allowUnchanged}
              placeholder={t("common.eG", { example: t("credential.secretKey") })}
              control={control}
              name={`${namePrefix}.authKey`}
            />
          </Group>
        </Field.Root>
        <Field.Root required={!allowUnchanged}>
          <Field.Label>
            {t("network.privKey")}
            {!allowUnchanged && <Field.RequiredIndicator />}
          </Field.Label>
          <Group w="full">
            <Select
              required
              fieldProps={{ flex: "1", w: "auto" }}
              control={control}
              name={`${namePrefix}.privType`}
              options={privateKeyTypeOptions.options}
            />
            <FormControl
              flex="2"
              type={FormControlType.Password}
              allowUnchanged={allowUnchanged}
              placeholder={t("common.eG", { example: t("credential.secretKey") })}
              control={control}
              name={`${namePrefix}.privKey`}
            />
          </Group>
        </Field.Root>
      </>
    )
  }
  return null
}

const CREDENTIAL_MODE_OPTIONS = [
  { label: "device.accessCredentialsNone", description: "device.accessCredentialsNoneDescription", value: "none" },
  { label: "device.accessCredentialsGlobal", description: "device.accessCredentialsGlobalDescription", value: "global" },
  { label: "device.accessCredentialsSpecific", description: "device.accessCredentialsSpecificDescription", value: "specific" },
] as const

const SSH_AUTH_METHOD_OPTIONS = [
  { label: "auth.password", value: "password" },
  { label: "network.sshPrivateKey", value: "key" },
] as const

/** Formats an overridden address/port pair for the row's collapsed summary, e.g. "10.216.5.3:2222", "10.216.5.3", ":2222". */
function formatConnectionOverride(address: string, port: string): string {
  if (address && port) {
    return `${address}:${port}`
  }
  return address || (port ? `:${port}` : "")
}

function AccessRowSummary({
  mode,
  globalCredentialSetId,
  globalCredentialSetName,
  overrideConnection,
  address,
  port,
}: {
  mode: DeviceAccessCredentialMode
  globalCredentialSetId?: string
  globalCredentialSetName?: string
  overrideConnection: boolean
  address: string
  port: string
}) {
  const { t } = useTranslation()
  const credentialsSummary = (() => {
    if (mode === "none") {
      return t("device.accessCredentialsNone")
    }
    if (mode === "specific") {
      return t("device.accessCredentialsSpecific")
    }
    // mode === "global"
    if (!globalCredentialSetId || globalCredentialSetId === TRY_ALL_CREDENTIALS_VALUE) {
      return t("device.tryAllKnownCredentials")
    }
    return globalCredentialSetName || t("device.accessCredentialsGlobal")
  })()

  const connectionOverrideSummary = mode !== "none" && overrideConnection
    ? formatConnectionOverride(address, port)
    : ""

  return connectionOverrideSummary
    ? `${credentialsSummary} · ${connectionOverrideSummary}`
    : credentialsSummary
}

function AccessRow({
  control,
  index,
  value,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>
  index: number
  value: DeviceAccessFormValue
}) {
  const { t } = useTranslation()
  const { data: credentialSets, isPending: isLoadingCredentialSets } = useCredentialSets()

  const mode = useWatch({ control, name: `accesses.${index}.mode` }) as DeviceAccessCredentialMode
  const overrideConnection = useWatch({ control, name: `accesses.${index}.overrideConnection` }) as boolean
  const address = useWatch({ control, name: `accesses.${index}.address` }) as string
  const port = useWatch({ control, name: `accesses.${index}.port` }) as string
  const globalCredentialSetId = useWatch({ control, name: `accesses.${index}.globalCredentialSetId` }) as string
  const sshAuthMethod = useWatch({ control, name: `accesses.${index}.sshAuthMethod` }) as SshAuthMethod

  // Captured once when the row is created: true only if this access already had a stored
  // secret to preserve (edit mode), so the lock-icon "unchanged" UX only appears then.
  const [allowUnchanged] = useState(
    () => value.password === null || value.privateKey === null || value.superPassword === null
      || value.authKey === null || value.privKey === null
  )

  const compatibleTypes = useMemo(() => getCompatibleCredentialTypes(value.protocol), [value.protocol])
  const effectiveSpecificType = getEffectiveSpecificCredentialType(value.protocol, sshAuthMethod)
  const isSsh = value.protocol === DeviceTypeProtocol.Ssh

  const globalCredentialSetOptions = useMemo(
    () => [
      {
        label: t("device.tryAllKnownCredentials"),
        description: t("device.tryAllKnownCredentialsDescription"),
        value: TRY_ALL_CREDENTIALS_VALUE,
      },
      ...(credentialSets ?? [])
        .filter((cs) => compatibleTypes.includes(cs.type))
        .map((cs) => ({ label: cs.name, value: String(cs.id) })),
    ],
    [credentialSets, compatibleTypes, t]
  )

  const globalCredentialSetName = useMemo(
    () => (credentialSets ?? []).find((cs) => String(cs.id) === globalCredentialSetId)?.name,
    [credentialSets, globalCredentialSetId]
  )

  const [isOpen, setIsOpen] = useState(false)

  return (
    <Collapsible.Root open={isOpen} onOpenChange={(details) => setIsOpen(details.open)}>
      <Collapsible.Trigger
        cursor="pointer"
        paddingY="3"
        display="flex"
        gap="2"
        alignItems="center"
        fontWeight="medium"
        w="full"
      >
        <Collapsible.Indicator transition="transform 0.2s" _open={{ transform: "rotate(90deg)" }}>
          <LuChevronRight />
        </Collapsible.Indicator>
        <Stack direction="row" justifyContent="space-between" alignItems="center" flex="1">
          <Text fontSize="sm" fontWeight="medium">{humanizeAccessName(value.accessName)}</Text>
          {!isOpen && (
            <Text fontSize="sm" color="fg.muted">
              <AccessRowSummary
                mode={mode}
                globalCredentialSetId={globalCredentialSetId}
                globalCredentialSetName={globalCredentialSetName}
                overrideConnection={overrideConnection}
                address={address}
                port={port}
              />
            </Text>
          )}
        </Stack>
      </Collapsible.Trigger>
      <Collapsible.Content>
        <Stack direction="column" gap="4" px="4" pb="3">
          <Select
            label={t("device.accessCredentials")}
            control={control}
            name={`accesses.${index}.mode`}
            options={CREDENTIAL_MODE_OPTIONS.map((option) => ({
              label: t(option.label),
              description: t(option.description),
              value: option.value,
            }))}
          />
          {mode !== "none" && (
            <>
              {mode === "global" && (
                <Select
                  required
                  isLoading={isLoadingCredentialSets}
                  label={t("device.selectCredentialSet")}
                  placeholder={t("device.selectCredentialSet")}
                  control={control}
                  name={`accesses.${index}.globalCredentialSetId`}
                  options={globalCredentialSetOptions}
                />
              )}
              {mode === "specific" && (
                <>
                  {isSsh && (
                    <Select
                      label={t("device.sshAuthMethod")}
                      control={control}
                      name={`accesses.${index}.sshAuthMethod`}
                      options={SSH_AUTH_METHOD_OPTIONS.map((option) => ({ label: t(option.label), value: option.value }))}
                    />
                  )}
                  {effectiveSpecificType && (
                    <SpecificCredentialFields
                      control={control}
                      namePrefix={`accesses.${index}`}
                      type={effectiveSpecificType}
                      allowUnchanged={allowUnchanged}
                    />
                  )}
                </>
              )}
              <Switch
                control={control}
                name={`accesses.${index}.overrideConnection`}
                label={t("device.overrideConnection")}
                description={t("device.overrideConnectionSettings")}
              />
              {overrideConnection && (
                <Stack direction="row" gap="3" align="flex-end">
                  <FormControl
                    flex="3"
                    label={t("device.connectIp")}
                    placeholder={t("common.eG", { example: "10.216.5.3" })}
                    control={control}
                    name={`accesses.${index}.address`}
                  />
                  <FormControl
                    flex="1"
                    type={FormControlType.Number}
                    label={t("network.port")}
                    placeholder={String(value.defaultPort)}
                    control={control}
                    name={`accesses.${index}.port`}
                    min={1}
                    max={65535}
                    rules={{
                      min: { value: 1, message: t("network.invalidPort") },
                      max: { value: 65535, message: t("network.invalidPort") },
                    }}
                  />
                </Stack>
              )}
            </>
          )}
        </Stack>
      </Collapsible.Content>
    </Collapsible.Root>
  )
}

/** Falls back to "" only for a genuinely absent value, preserving the PASSWORD_UNCHANGED (null) sentinel as-is. */
function preserveSecret(value: string | null | undefined): string | null {
  return value === undefined ? "" : value
}

/**
 * Renders one collapsible row per access declared by the selected device
 * driver (e.g. "ssh", "telnet", or any other access a custom driver might
 * declare, such as an HTTP access): an optional address/port override, plus
 * a per-access credential choice (none/disabled / a global account - either
 * a specific pick or "try all known credentials" / a specific account
 * defined just for this access). Backed by an `accesses` field array on the
 * form, kept in sync with the driver's access definitions.
 */
export default function DeviceAccessFields({ control, accessDefinitions }: DeviceAccessFieldsProps) {
  const { t } = useTranslation()
  const { fields, replace } = useFieldArray({ control, name: "accesses" })

  const accessNamesKey = Object.keys(accessDefinitions ?? {}).sort().join(",")

  useEffect(() => {
    const defs = Object.values(accessDefinitions ?? {})
    replace(
      defs.map((def) => {
        const existing = (fields as unknown as DeviceAccessFormValue[]).find((f) => f.accessName === def.name)
        return {
          accessName: def.name,
          protocol: def.protocol,
          defaultPort: def.defaultPort,
          overrideConnection: existing?.overrideConnection ?? false,
          address: existing?.address ?? "",
          port: existing?.port ?? "",
          mode: existing?.mode ?? "global",
          globalCredentialSetId: existing?.globalCredentialSetId ?? TRY_ALL_CREDENTIALS_VALUE,
          sshAuthMethod: existing?.sshAuthMethod ?? "password",
          username: existing?.username ?? "",
          // `existing?.field ?? ""` would collapse PASSWORD_UNCHANGED (null) into
          // "", losing the lock-icon "unchanged" state on every sync - `null` must
          // be preserved as-is, only actual `undefined` (no existing row) falls to "".
          password: preserveSecret(existing?.password),
          superPassword: preserveSecret(existing?.superPassword),
          privateKey: preserveSecret(existing?.privateKey),
          community: existing?.community ?? "",
          authType: existing?.authType,
          authKey: preserveSecret(existing?.authKey),
          privType: existing?.privType,
          privKey: preserveSecret(existing?.privKey),
        }
      })
    )
    // Only re-sync when the set of accesses actually changes (e.g. device type
    // switched), not on every render - otherwise in-progress input gets wiped.
    // eslint-disable-next-line @eslint-react/exhaustive-deps
  }, [accessNamesKey])

  if (!accessDefinitions || Object.keys(accessDefinitions).length === 0) {
    return null
  }

  // Group definitions in first-seen order, then sort each group's rows by
  // priority (descending) - mirrors the backend's own group/priority model.
  const indexByName = new Map(
    (fields as unknown as DeviceAccessFormValue[]).map((f, index) => [f.accessName, index])
  )
  const groupOrder: string[] = []
  const defsByGroup = new Map<string, DeviceAccessDefinition[]>()
  Object.values(accessDefinitions).forEach((def) => {
    if (!defsByGroup.has(def.group)) {
      defsByGroup.set(def.group, [])
      groupOrder.push(def.group)
    }
    defsByGroup.get(def.group)?.push(def)
  })

  return (
    <Stack gap="5">
      {groupOrder.map((group) => {
        const groupLabel = t(`device.accessGroup${group.charAt(0).toUpperCase()}${group.slice(1)}`, {
          defaultValue: humanizeAccessName(group),
        })
        return (
          <Stack key={group} gap="1">
            <Text fontWeight="medium">
              {t("device.connectionOverridesPerAccess")} - {groupLabel}
            </Text>
            <Stack gap="0" separator={<Separator />}>
              {(defsByGroup.get(group) ?? [])
                .slice()
                .sort((a, b) => b.priority - a.priority)
                .map((def) => {
                  const index = indexByName.get(def.name)
                  if (index === undefined) {
                    return null
                  }
                  return (
                    <AccessRow
                      key={fields[index].id}
                      control={control}
                      index={index}
                      value={fields[index] as unknown as DeviceAccessFormValue}
                    />
                  )
                })}
            </Stack>
          </Stack>
        )
      })}
    </Stack>
  )
}

/** Passes a secret field through, unless it's empty or the "unchanged" sentinel (`PASSWORD_UNCHANGED` = null) from an edit form - in which case it's omitted, preserving the existing stored value. */
function secret(value: string | null | undefined): string | undefined {
  return value || undefined
}

function buildSpecificCredentialPayload(access: DeviceAccessFormValue): CredentialSet | undefined {
  const type = getEffectiveSpecificCredentialType(access.protocol, access.sshAuthMethod)
  if (!type) {
    return undefined
  }
  switch (type) {
    case CredentialSetType.SSH:
    case CredentialSetType.Telnet:
      return {
        type,
        username: access.username,
        password: secret(access.password),
        superPassword: secret(access.superPassword),
      } as CredentialSet
    case CredentialSetType.SSHKey:
      return {
        type,
        username: access.username,
        privateKey: secret(access.privateKey),
        password: secret(access.password),
        superPassword: secret(access.superPassword),
      } as CredentialSet
    case CredentialSetType.HTTP:
      return {
        type,
        username: access.username || undefined,
        password: secret(access.password),
      } as CredentialSet
    case CredentialSetType.SNMP_V1:
    case CredentialSetType.SNMP_V2C:
      return { type, community: access.community } as CredentialSet
    case CredentialSetType.SNMP_V3:
      return {
        type,
        username: access.username,
        authType: access.authType,
        authKey: secret(access.authKey),
        privType: access.privType,
        privKey: secret(access.privKey),
      } as CredentialSet
    default:
      return undefined
  }
}

/**
 * Shapes the `accesses` field array of a device create/edit form into the
 * REST payload. An access with no row at all is never used (see
 * `AccessManager`), so a `none` row is simply omitted here entirely - the
 * backend removes any existing row for it (see `Device.replaceAccesses`). A
 * `global` mode with a specific pick resolves to `{id, type}` (looked up
 * from the fetched credential set list), a `global` mode left on "try all
 * known credentials" is sent as a bare `{accessName}` (falls through to the
 * domain's auto-try pool), and a `specific` pin builds the inline credential
 * object for that access's family (honoring the SSH password-vs-key choice).
 */
export function buildAccessesPayload(
  accesses: DeviceAccessFormValue[] | undefined,
  credentialSets: CredentialSet[] | null | undefined
): DeviceAccess[] {
  const result: DeviceAccess[] = []
  for (const access of accesses ?? []) {
    if (access.mode === "none") {
      continue
    }
    const entry: DeviceAccess = { accessName: access.accessName }
    if (access.overrideConnection && access.address) {
      entry.address = access.address
    }
    if (access.overrideConnection && access.port) {
      entry.port = Number(access.port)
    }
    if (access.mode === "global" && access.globalCredentialSetId
        && access.globalCredentialSetId !== TRY_ALL_CREDENTIALS_VALUE) {
      const credentialSet = (credentialSets ?? []).find((cs) => String(cs.id) === access.globalCredentialSetId)
      if (credentialSet) {
        entry.globalCredentialSet = { id: credentialSet.id, type: credentialSet.type } as CredentialSet
      }
    }
    else if (access.mode === "specific") {
      const specific = buildSpecificCredentialPayload(access)
      if (specific) {
        entry.specificCredentialSet = specific
      }
    }
    result.push(entry)
  }
  return result
}
