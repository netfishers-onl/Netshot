import { DeviceAutocomplete, Icon } from "@/components"
import { RuleType, SimpleDevice } from "@/types"
import { IconButton, Stack } from "@chakra-ui/react"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { useTestRuleScript } from "../api"

export type TestRuleOnDevice = {
  script: string
  type: RuleType
}

export default function TestRuleScriptOnDevice(props: TestRuleOnDevice) {
  const { script, type } = props
  const { t } = useTranslation()
  const [device, setDevice] = useState<SimpleDevice>(null)

  const mutation = useTestRuleScript()

  const runTest = useCallback(() => {
    mutation.mutate({
      device: device.id,
      script,
      type,
    })
  }, [device, script, type])

  return (
    <Stack direction="row">
      <DeviceAutocomplete
        selectionBehavior="replace"
        value={device ? [device.id.toString()] : []}
        placeholder={t("Search device and test rule...")}
        onSelectItem={(device) => {
          setDevice(device)
        }}
      />
      <IconButton
        variant="primary"
        aria-label={t("Test on device")}
        disabled={!device}
        onClick={runTest}
        loading={mutation.isPending}
      >
        <Icon name="play" />
      </IconButton>
    </Stack>
  )
}
