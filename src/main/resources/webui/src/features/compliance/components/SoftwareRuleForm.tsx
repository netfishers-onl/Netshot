import { DeviceTypeSelect, FormControl, Icon, TreeGroupSelector } from "@/components"
import { Select } from "@/components/Select"
import { useDeviceLevelOptions, useDeviceTypeOptions } from "@/hooks"
import { SoftwareRule } from "@/types"
import { IconButton, Stack } from "@chakra-ui/react"
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
  const deviceLevelOptions = useDeviceLevelOptions()

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
      <DeviceTypeSelect control={form.control} name="driver" placeholder={t("[Any]")} isClearable />
      <FormControl
        control={form.control}
        name="family"
        label={t("Device family")}
        placeholder={t("e.g. Cisco ASR9000 Series")}
        suffix={
          <IconButton
            aria-label={t(familyRegExp ? "Switch to text" : "Switch to RegExp")}
            title={t(familyRegExp ? "Switch to text" : "Switch to RegExp")}
            variant="ghost"
            colorPalette="green"
            onClick={toggleFamilyRegExp}
          >
            {familyRegExp ? <Icon name="type" /> : <Icon name="hash" />}
          </IconButton>
        }
      />
      <FormControl
        control={form.control}
        name="partNumber"
        label={t("Part number")}
        placeholder={t("e.g. FK-X0012")}
        suffix={
          <IconButton
            aria-label={t(partNumberRegExp ? "Switch to text" : "Switch to RegExp")}
            title={t(partNumberRegExp ? "Switch to text" : "Switch to RegExp")}
            variant="ghost"
            colorPalette="green"
            onClick={togglePartNumberRegExp}
          >
            {partNumberRegExp ? <Icon name="type" /> : <Icon name="hash" />}
          </IconButton>
        }
      />
      <FormControl
        control={form.control}
        name="version"
        label={t("Version")}
        placeholder={t("e.g. 0.10")}
        suffix={
          <IconButton
            aria-label={t(versionRegExp ? "Switch to text" : "Switch to RegExp")}
            title={t(versionRegExp ? "Switch to text" : "Switch to RegExp")}
            variant="ghost"
            colorPalette="green"
            onClick={toggleVersionRegExp}
          >
            {versionRegExp ? <Icon name="type" /> : <Icon name="hash" />}
          </IconButton>
        }
      />
      <Select
        label={t("Result")}
        control={form.control}
        name="level"
        options={deviceLevelOptions.options}
      />
    </Stack>
  )
}
