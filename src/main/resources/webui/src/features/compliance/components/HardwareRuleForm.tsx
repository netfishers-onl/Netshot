import { DeviceTypeSelect, FormControl, Icon, TreeGroupSelector } from "@/components"
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
      <TreeGroupSelector value={group ? [group] : []} onChange={onGroupSelect} withAny />
      <DeviceTypeSelect control={form.control} name="driver" placeholder={t("[Any]")} isClearable />
      <FormControl
        required
        control={form.control}
        name="family"
        label={t("Device family")}
        placeholder={t("E.g. {{example}}", { example: "Cisco ASR9000 Series" })}
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
        required
        control={form.control}
        name="partNumber"
        label={t("Part number")}
        placeholder={t("E.g. {{example}}", { example: "FK-X0012" })}
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
        name="endOfLife"
        label={t("End of life")}
        type={FormControlType.Date}
        required
      />
      <FormControl
        control={form.control}
        name="endOfSale"
        label={t("End of sale")}
        type={FormControlType.Date}
        required
      />
    </Stack>
  )
}
