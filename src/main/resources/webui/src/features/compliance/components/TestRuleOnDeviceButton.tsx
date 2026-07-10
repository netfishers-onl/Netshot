import { DeviceAutocomplete } from "@/components"
import { useLocalization } from "@/i18n"
import { DeviceComplianceResultType, Rule, RuleType, SimpleDevice } from "@/types"
import { stringToBoolean } from "@/utils"
import { Box, Clipboard, Icon, IconButton, Popover, Stack, Tag, Text } from "@chakra-ui/react"
import { useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"
import {
  LuBugPlay,
  LuCircleCheck,
  LuCircleMinus,
  LuCircleX,
  LuClipboard,
  LuClipboardCheck,
  LuMinus,
  LuShieldCheck,
  LuTriangleAlert,
} from "react-icons/lu"
import { useTestRuleScript, useTestRuleText } from "../api"
import { RuleForm } from "../types"
import { useState } from "react"

export type TestRuleOnDeviceButtonProps = {
  type: Rule["type"]
}

type ResultConfig = {
  colorPalette: string
  icon: React.ComponentType
  labelKey: string
}

const RESULT_CONFIG: Record<DeviceComplianceResultType, ResultConfig> = {
  [DeviceComplianceResultType.Conforming]: {
    colorPalette: "green",
    icon: LuCircleCheck,
    labelKey: "compliance.conforming",
  },
  [DeviceComplianceResultType.NonConforming]: {
    colorPalette: "red",
    icon: LuCircleX,
    labelKey: "compliance.nonConforming",
  },
  [DeviceComplianceResultType.Disabled]: {
    colorPalette: "grey",
    icon: LuCircleMinus,
    labelKey: "common.disabled",
  },
  [DeviceComplianceResultType.Exempted]: {
    colorPalette: "blue",
    icon: LuShieldCheck,
    labelKey: "policy.rule.exempted",
  },
  [DeviceComplianceResultType.InvalidRule]: {
    colorPalette: "orange",
    icon: LuTriangleAlert,
    labelKey: "policy.rule.invalid",
  },
  [DeviceComplianceResultType.NotApplication]: {
    colorPalette: "grey",
    icon: LuMinus,
    labelKey: "compliance.notApplicable",
  },
}

export default function TestRuleOnDeviceButton(props: TestRuleOnDeviceButtonProps) {
  const { type } = props
  const { t } = useTranslation()
  const { formatDateTime } = useLocalization()
  const form = useFormContext<RuleForm>()
  const [device, setDevice] = useState<SimpleDevice>(null)
  const [testedAt, setTestedAt] = useState<Date>(null)

  const isScript = type === RuleType.Javascript || type === RuleType.Python
  const textMutation = useTestRuleText()
  const scriptMutation = useTestRuleScript()
  const mutation = isScript ? scriptMutation : textMutation

  function runTest() {
    const values = form.getValues()
    setTestedAt(new Date())

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

  const result = mutation.data
  const resultConfig = result ? RESULT_CONFIG[result.result] : null

  return (
    <Stack gap="3">
      <DeviceAutocomplete
        selectionBehavior="replace"
        value={device ? [device.id.toString()] : []}
        placeholder={t("policy.rule.testOnDevice")}
        onSelectItem={(d) => {
          setDevice(d)
          if (!d) {
            mutation.reset()
            setTestedAt(null)
          }
        }}
        endAddon={
          <IconButton
            aria-label={t("policy.rule.testOnDevice")}
            disabled={!device}
            onClick={runTest}
            loading={mutation.isPending}
            flexShrink={0}
          >
            <LuBugPlay />
          </IconButton>
        }
      />

      <Box minH="8">
      {resultConfig && result && (
        <Stack direction="row" alignItems="center" gap="2">
          <Popover.Root positioning={{ placement: "top-start" }}>
            <Popover.Trigger asChild>
              <Tag.Root
                colorPalette={resultConfig.colorPalette}
                size="md"
                cursor="pointer"
                alignSelf="start"
                gap="1.5"
              >
                <Icon size="sm"><resultConfig.icon /></Icon>
                <Tag.Label>{t(resultConfig.labelKey)}</Tag.Label>
              </Tag.Root>
            </Popover.Trigger>
            <Popover.Positioner>
              <Popover.Content w="lg">
                <Popover.Arrow />
                <Popover.Body>
                  <Box position="relative">
                    <Box
                      bg="grey.50"
                      borderWidth="1px"
                      borderColor="grey.100"
                      borderRadius="xl"
                      overflow="hidden"
                    >
                      <Box overflow="auto" maxH="80" p="3">
                        <Stack gap="3">
                          {result.comment && (
                            <Text fontSize="xs" whiteSpace="pre-wrap" fontFamily="mono">
                              {result.comment}
                            </Text>
                          )}
                          {result.scriptError && (
                            <Text fontSize="xs" whiteSpace="pre-wrap" fontFamily="mono" color="red.fg">
                              {result.scriptError}
                            </Text>
                          )}
                        </Stack>
                      </Box>
                    </Box>
                    <Clipboard.Root
                      value={[result.comment, result.scriptError].filter(Boolean).join("\n\n")}
                      position="absolute"
                      top="1"
                      right="1"
                    >
                      <Clipboard.Trigger asChild>
                        <IconButton size="xs" variant="frame" aria-label={t("common.copy")}>
                          <Clipboard.Indicator copied={<LuClipboardCheck />}>
                            <LuClipboard />
                          </Clipboard.Indicator>
                        </IconButton>
                      </Clipboard.Trigger>
                    </Clipboard.Root>
                  </Box>
                </Popover.Body>
              </Popover.Content>
            </Popover.Positioner>
          </Popover.Root>
          {testedAt && (
            <Text fontSize="xs" color="fg.muted">{formatDateTime(testedAt)}</Text>
          )}
        </Stack>
      )}
      </Box>
    </Stack>
  )
}
