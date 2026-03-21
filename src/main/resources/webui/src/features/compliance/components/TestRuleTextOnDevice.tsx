import { TestRuleTextOnDevicePayload } from "@/api"
import { DeviceAutocomplete, Icon } from "@/components"
import { SimpleDevice } from "@/types"
import { IconButton, Stack } from "@chakra-ui/react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useTestRuleText } from "../api"

export type TestRuleOnDevice = {
  rule: TestRuleTextOnDevicePayload
}

export default function TestRuleTextOnDevice(props: TestRuleOnDevice) {
  const { rule } = props
  const { t } = useTranslation()
  const mutation = useTestRuleText()
  const [device, setDevice] = useState<SimpleDevice>(null)

  function runTest() {
    mutation.mutate({
      device: device?.id,
      ...rule,
    })
  }

  return (
    <Stack direction="row">
      <DeviceAutocomplete
        selectionBehavior="replace"
        value={device ? [device.id.toString()] : []}
        onSelectItem={(device) => {
          setDevice(device)
        }}
      />
      <IconButton
        aria-label={t("testOnDevice")}
        disabled={device === null}
        onClick={() => runTest()}
        loading={mutation.isPending}
      >
        <Icon name="play" />
      </IconButton>
    </Stack>
  )
}
