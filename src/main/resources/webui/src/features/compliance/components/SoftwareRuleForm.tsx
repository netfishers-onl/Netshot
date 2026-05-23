import { DeviceTypeSelect, FormControl, TreeGroupSelector } from "@/components"
import { LuRegex, LuTrophy, LuType } from "react-icons/lu"
import { Select } from "@/components/Select"
import { useSoftwareLevels, useDeviceTypeOptions } from "@/hooks"
import { useDeviceFamilies, useDevicePartNumbers, useDeviceSoftwareVersions } from "@/features/device/api"
import { DeviceSoftwareLevel, SoftwareRule } from "@/types"
import { Icon, IconButton, Stack } from "@chakra-ui/react"
import { useCallback, useEffect } from "react"
import { useFormContext, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { SoftwareRuleFormValues } from "../types"

export type SoftwareRuleFormProps = {
  rule?: SoftwareRule
}

export default function SoftwareRuleForm(props: SoftwareRuleFormProps) {
  const { rule } = props
  const form = useFormContext<SoftwareRuleFormValues>()
  const { t } = useTranslation()
  const { options: levelOptions, getInfo: getLevelInfo } = useSoftwareLevels()
  const { data: familySuggestions } = useDeviceFamilies()
  const { data: partNumberSuggestions } = useDevicePartNumbers()
  const { data: versionSuggestions } = useDeviceSoftwareVersions()

  const { isPending } = useDeviceTypeOptions()

  useEffect(() => {
    if (!rule) {
      return
    }

    if (isPending) {
      return
    }

    if (rule?.driver === null) {
      return
    }

    form.setValue("driver", rule.driver)
  }, [isPending, rule])

  const group = useWatch({
    control: form.control,
    name: "group",
  })

  const familyRegExp = useWatch({
    control: form.control,
    name: "familyRegExp",
  })

  const partNumberRegExp = useWatch({
    control: form.control,
    name: "partNumberRegExp",
  })

  const versionRegExp = useWatch({
    control: form.control,
    name: "versionRegExp",
  })

  const toggleFamilyRegExp = useCallback(() => {
    form.setValue("familyRegExp", !familyRegExp)
  }, [form, familyRegExp])

  const togglePartNumberRegExp = useCallback(() => {
    form.setValue("partNumberRegExp", !partNumberRegExp)
  }, [form, partNumberRegExp])

  const toggleVersionRegExp = useCallback(() => {
    form.setValue("versionRegExp", !versionRegExp)
  }, [form, versionRegExp])
  return (
    <Stack gap="5">
      <TreeGroupSelector
        value={group ? [group] : []}
        onChange={(groups) => form.setValue("group", groups?.[0])}
        withAny
      />
      <DeviceTypeSelect control={form.control} name="driver" placeholder={t("common.any")} isClearable />
      <FormControl
        control={form.control}
        name="family"
        label={t("device.family")}
        placeholder={t("common.eG", { example: "Cisco ASR9000 Series" })}
        suggestions={familySuggestions ?? []}
        suffix={
          <IconButton
            aria-label={t(familyRegExp ? "policy.rule.modeRegexp" : "policy.rule.modeText")}
            title={t(familyRegExp ? "policy.rule.modeRegexp" : "policy.rule.modeText")}
            size="xs"
            variant="ghost"
            rounded="l1"
            onClick={toggleFamilyRegExp}
          >
            {familyRegExp ? <LuRegex /> : <LuType />}
          </IconButton>
        }
      />
      <FormControl
        control={form.control}
        name="partNumber"
        label={t("device.module.partNumber")}
        placeholder={t("common.eG", { example: "FK-X0012" })}
        suggestions={partNumberSuggestions ?? []}
        suffix={
          <IconButton
            aria-label={t(partNumberRegExp ? "policy.rule.modeRegexp" : "policy.rule.modeText")}
            title={t(partNumberRegExp ? "policy.rule.modeRegexp" : "policy.rule.modeText")}
            size="xs"
            variant="ghost"
            rounded="l1"
            onClick={togglePartNumberRegExp}
          >
            {partNumberRegExp ? <LuRegex /> : <LuType />}
          </IconButton>
        }
      />
      <FormControl
        control={form.control}
        name="version"
        label={t("common.version")}
        placeholder={t("common.eG", { example: "26.2.2" })}
        suggestions={versionSuggestions ?? []}
        suffix={
          <IconButton
            aria-label={t(versionRegExp ? "policy.rule.modeRegexp" : "policy.rule.modeText")}
            title={t(versionRegExp ? "policy.rule.modeRegexp" : "policy.rule.modeText")}
            size="xs"
            variant="ghost"
            rounded="l1"
            onClick={toggleVersionRegExp}
          >
            {versionRegExp ? <LuRegex /> : <LuType />}
          </IconButton>
        }
      />
      <Select
        label={t("common.result")}
        control={form.control}
        name="level"
        options={levelOptions}
        renderIcon={(item) => {
          const info = getLevelInfo(item.value as DeviceSoftwareLevel)
          return (
            <Icon color={`${info?.color}.500`}>
              <LuTrophy />
            </Icon>
          )
        }}
      />
    </Stack>
  )
}
