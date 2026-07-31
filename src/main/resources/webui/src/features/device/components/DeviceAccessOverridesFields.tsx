import FormControl, { FormControlType } from "@/components/FormControl"
import { DeviceAccessDefinition } from "@/types"
import { Stack, Text } from "@chakra-ui/react"
import { useEffect } from "react"
import { Control, useFieldArray } from "react-hook-form"
import { useTranslation } from "react-i18next"

export type AccessOverrideFormValue = {
  accessName: string
  protocol: string
  defaultPort: number
  address: string
  port: string
}

export type DeviceAccessOverridesFieldsProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>
  accessDefinitions: Record<string, DeviceAccessDefinition> | undefined
}

/**
 * Renders one address/port override row per access declared by the selected
 * device driver (e.g. "ssh", "telnet", or any other access a custom driver
 * might declare, such as an HTTP access). Backed by a `accessOverrides` field
 * array on the form, kept in sync with the driver's access definitions.
 */
export default function DeviceAccessOverridesFields({ control, accessDefinitions }: DeviceAccessOverridesFieldsProps) {
  const { t } = useTranslation()
  const { fields, replace } = useFieldArray({ control, name: "accessOverrides" })

  const accessNamesKey = Object.keys(accessDefinitions ?? {}).sort().join(",")

  useEffect(() => {
    const defs = Object.values(accessDefinitions ?? {})
    replace(
      defs.map((def) => {
        const existing = (fields as unknown as AccessOverrideFormValue[]).find((f) => f.accessName === def.name)
        return {
          accessName: def.name,
          protocol: def.protocol,
          defaultPort: def.effectiveDefaultPort,
          address: existing?.address ?? "",
          port: existing?.port ?? "",
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

  return (
    <Stack gap="4">
      <Stack gap="0">
        <Text fontWeight="medium">{t("device.connectionOverridesPerAccess")}</Text>
        <Text fontSize="sm" color="fg.muted">{t("device.connectionOverridesPerAccessDescription")}</Text>
      </Stack>
      {fields.map((field, index) => {
        const value = field as unknown as AccessOverrideFormValue
        return (
          <Stack key={field.id} direction="row" gap="3" align="flex-end">
            <Stack minW="28" gap="0" pb="2">
              <Text fontSize="sm" fontWeight="medium">{value.accessName}</Text>
              <Text fontSize="xs" color="fg.muted">{value.protocol}</Text>
            </Stack>
            <FormControl
              label={t("device.connectIp")}
              placeholder={t("common.eG", { example: "10.216.5.3" })}
              control={control}
              name={`accessOverrides.${index}.address`}
            />
            <FormControl
              type={FormControlType.Number}
              label={t("network.port")}
              placeholder={String(value.defaultPort)}
              control={control}
              name={`accessOverrides.${index}.port`}
            />
          </Stack>
        )
      })}
    </Stack>
  )
}
