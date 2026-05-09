import { DeviceTypeSelect, FormControl, TreeGroupSelector } from "@/components"
import { LuRegex, LuType } from "react-icons/lu"
import { FormControlType } from "@/components/FormControl"
import { useDeviceTypeOptions } from "@/hooks"
import { HardwareRule } from "@/types"
import { IconButton, Stack } from "@chakra-ui/react"
import { useCallback, useEffect } from "react"
import { useFormContext, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { HardwareRuleFormValues } from "../types"

export type HardwareRuleFormProps = {
  rule?: HardwareRule
}

export default function HardwareRuleForm(props: HardwareRuleFormProps) {
  const { rule } = props
  const form = useFormContext<HardwareRuleFormValues>()
  const { t } = useTranslation()

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
  }, [isPending, rule, form])

  const familyRegExp = useWatch({
    control: form.control,
    name: "familyRegExp",
  })

  const partNumberRegExp = useWatch({
    control: form.control,
    name: "partNumberRegExp",
  })

  const group = useWatch({
    control: form.control,
    name: "group",
  })

  const toggleFamilyRegExp = useCallback(() => {
    form.setValue("familyRegExp", !familyRegExp)
  }, [form, familyRegExp])

  const togglePartNumberRegExp = useCallback(() => {
    form.setValue("partNumberRegExp", !partNumberRegExp)
  }, [form, partNumberRegExp])

  const onGroupSelect = useCallback(
    (groups: number[]) => {
      form.setValue("group", groups[0])
    },
    [form]
  )

  return (
    <Stack gap="5">
      <TreeGroupSelector
        value={group ? [group] : []}
        onChange={onGroupSelect}
        withAny
      />
      <DeviceTypeSelect
        control={form.control}
        name="driver"
        placeholder={t("common.any")}
        label={t("device.type")}
        isClearable
      />
      <FormControl
        control={form.control}
        name="family"
        label={t("device.family")}
        placeholder={t("common.eG", { example: "Cisco ASR9000 Series" })}
        suffix={
          <IconButton
            aria-label={t(familyRegExp ? "policy.rule.modeRegexp" : "policy.rule.modeText")}
            title={t(familyRegExp ? "policy.rule.modeRegexp" : "policy.rule.modeText")}
            variant="ghost"
            size="xs"
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
        suffix={
          <IconButton
            aria-label={t(partNumberRegExp ? "policy.rule.modeRegexp" : "policy.rule.modeText")}
            title={t(partNumberRegExp ? "policy.rule.modeRegexp" : "policy.rule.modeText")}
            variant="ghost"
            size="xs"
            onClick={togglePartNumberRegExp}
          >
            {partNumberRegExp ? <LuRegex /> : <LuType />}
          </IconButton>
        }
      />
      <FormControl
        control={form.control}
        name="endOfLife"
        label={t("compliance.hardware.endOfLife")}
        type={FormControlType.Date}
        clearable
      />
      <FormControl
        control={form.control}
        name="endOfSale"
        label={t("compliance.hardware.endOfSale")}
        type={FormControlType.Date}
        clearable
      />
    </Stack>
  )
}
