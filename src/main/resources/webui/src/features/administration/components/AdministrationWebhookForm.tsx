import { FormControl, Switch } from "@/components"
import { FormControlType } from "@/components/FormControl"
import { Select } from "@/components/Select"
import { HookActionType, HookTrigger } from "@/types"
import { Badge, Heading, Switch as NativeSwitch, Separator, Stack, Text } from "@chakra-ui/react"
import { Fragment, useCallback } from "react"
import { useFieldArray, useFormContext, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useWebhookDataTypeOptions, useWebhookTriggerOptions } from "../hooks"

export type WebhookForm = {
  name: string
  enabled: boolean
  action: HookActionType
  sslValidation: boolean
  triggers: HookTrigger[]
  type: string
  url: string
}

export default function AdministrationWebhookForm() {
  const form = useFormContext<WebhookForm>()
  const { t } = useTranslation()
  const webhookTriggerOptions = useWebhookTriggerOptions()
  const webhookDataTypeOptions = useWebhookDataTypeOptions()

  const enabled = useWatch({
    control: form.control,
    name: "enabled",
  })

  const triggers = useFieldArray({
    control: form.control,
    name: "triggers",
  })

  const toggleTrigger = useCallback(
    (trigger: HookTrigger) => {
      const existingTriggerIndex = triggers.fields.findIndex((t) => t.item === trigger.item)

      if (existingTriggerIndex !== -1) {
        triggers.remove(existingTriggerIndex)
      } else {
        triggers.append(trigger)
      }
    },
    [triggers]
  )

  const isChecked = useCallback(
    (trigger: HookTrigger) => {
      return Boolean(triggers.fields.find((t) => t.item === trigger.item))
    },
    [triggers]
  )

  return (
    <Stack gap="12">
      <Stack gap="6">
        <FormControl
          label={t("name")}
          placeholder={t("eG", { example: t("myWebhook") })}
          required
          control={form.control}
          name="name"
        />
        <Select
          required
          options={webhookDataTypeOptions.options}
          control={form.control}
          name="action"
          label={t("dataType")}
        />
        <FormControl
          label={t("url")}
          placeholder={"https://api.example.com/callback"}
          type={FormControlType.Url}
          required
          control={form.control}
          name="url"
        />
        <Stack direction="row" gap="6">
          <Stack gap="0" flex="1">
            <Stack direction="row" gap="2">
              <Text fontWeight="medium">{t("status")}</Text>
              <Badge colorPalette={enabled ? "green" : "red"}>
                {t(enabled ? "enabled" : "disabled")}
              </Badge>
            </Stack>
            <Text color="grey.400">{t("youCanActivateOrDeactivateThisWebhook")}</Text>
          </Stack>
          <Switch w="initial" control={form.control} name="enabled" />
        </Stack>
        <Separator />
        <Stack direction="row" gap="6">
          <Stack gap="0" flex="1">
            <Text fontWeight="medium">{t("sslValidation")}</Text>
            <Text color="grey.400">{t("disablingSslValidationIsNotSecure")}</Text>
          </Stack>
          <Switch w="initial" control={form.control} name="sslValidation" />
        </Stack>
      </Stack>
      <Stack gap="6">
        <Heading as="h5" size="md">
          {t("triggers")}
        </Heading>
        {webhookTriggerOptions.options.map((option, index) => (
          <Fragment key={option.label}>
            <Stack direction="row" gap="6">
              <Stack gap="0" flex="1">
                <Text fontWeight="medium">{option.label}</Text>
                <Text color="grey.400">{option.description}</Text>
              </Stack>

              <NativeSwitch.Root
                size="lg"
                onCheckedChange={() => toggleTrigger(option.value)}
                checked={isChecked(option.value)}
              >
                <NativeSwitch.HiddenInput />
                <NativeSwitch.Control />
              </NativeSwitch.Root>
            </Stack>
            {index !== webhookTriggerOptions.options.length - 1 && <Separator />}
          </Fragment>
        ))}
      </Stack>
    </Stack>
  )
}
