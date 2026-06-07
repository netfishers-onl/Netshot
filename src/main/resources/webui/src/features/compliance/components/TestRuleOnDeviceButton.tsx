import { DeviceAutocomplete } from "@/components"
import { Rule, RuleType, SimpleDevice } from "@/types"
import { stringToBoolean } from "@/utils"
import { IconButton, Stack } from "@chakra-ui/react"
import { useState } from "react"
import { useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { LuBugPlay, LuPlay } from "react-icons/lu"
import { useTestRuleScript, useTestRuleText } from "../api"
import { RuleForm } from "../types"

export type TestRuleOnDeviceButtonProps = {
  type: Rule["type"]
}

export default function TestRuleOnDeviceButton(props: TestRuleOnDeviceButtonProps) {
  const { type } = props
  const { t } = useTranslation()
  const form = useFormContext<RuleForm>()
  const [device, setDevice] = useState<SimpleDevice>(null)

  const isScript = type === RuleType.Javascript || type === RuleType.Python
  const textMutation = useTestRuleText()
  const scriptMutation = useTestRuleScript()
  const mutation = isScript ? scriptMutation : textMutation

  function runTest() {
    const values = form.getValues()

    if (isScript) {
      scriptMutation.mutate({ device: device.id, script: values.script, type })
    } else {
      textMutation.mutate({
        device: device?.id,
        anyBlock: stringToBoolean(values.anyBlock),
        context: values.context,
        driver: values.driver,
        field: values.field,
        invert: stringToBoolean(values.invert),
        matchAll: values.matchAll,
        normalize: values.normalize,
        regExp: values.regExp,
        text: values.text,
        type,
      })
    }
  }

  return (
    <Stack direction="row" w="md" flexShrink={0}>
      <DeviceAutocomplete
        selectionBehavior="replace"
        value={device ? [device.id.toString()] : []}
        placeholder={t("device.searchAndTestRule")}
        onSelectItem={(device) => {
          console.log(`Device changed: ${device}`)
          setDevice(device)
        }}
      />
      <IconButton
        variant="primary"
        aria-label={t("policy.rule.testOnDevice")}
        disabled={!device}
        onClick={runTest}
        loading={mutation.isPending}
      >
        <LuBugPlay />
      </IconButton>
    </Stack>
  )
}
