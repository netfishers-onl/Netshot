import { FormControl, Select, Switch } from "@/components";
import { FormControlType } from "@/components/FormControl";
import { HookActionType, HookTrigger, Option } from "@/types";
import {
  Divider,
  Heading,
  Switch as NativeSwitch,
  Stack,
  Tag,
  Text,
} from "@chakra-ui/react";
import { Fragment, useCallback } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  WEBHOOK_DATA_TYPE_OPTIONS,
  WEBHOOK_TRIGGER_OPTIONS,
} from "../constants";

export type WebhookForm = {
  name: string;
  enabled: boolean;
  action: Option<HookActionType>;
  sslValidation: boolean;
  triggers: HookTrigger[];
  type: string;
  url: string;
};

export default function AdministrationWebhookForm() {
  const form = useFormContext<WebhookForm>();
  const { t } = useTranslation();

  const enabled = useWatch({
    control: form.control,
    name: "enabled",
  });

  const triggers = useFieldArray({
    control: form.control,
    name: "triggers",
  });

  const toggleTrigger = useCallback(
    (trigger: HookTrigger) => {
      const existingTriggerIndex = triggers.fields.findIndex(
        (t) => t.item === trigger.item
      );

      if (existingTriggerIndex !== -1) {
        triggers.remove(existingTriggerIndex);
      } else {
        triggers.append(trigger);
      }
    },
    [triggers]
  );

  const isChecked = useCallback(
    (trigger: HookTrigger) => {
      return Boolean(triggers.fields.find((t) => t.item === trigger.item));
    },
    [triggers]
  );

  return (
    <Stack spacing="12">
      <Stack spacing="6">
        <FormControl
          label={t("Name")}
          placeholder={t("e.g. my webhook")}
          isRequired
          control={form.control}
          name="name"
        />
        <Select
          isRequired

          options={WEBHOOK_DATA_TYPE_OPTIONS}
          control={form.control}
          name="action"
          label={t("Data type")}
        />
        <FormControl
          label={t("URL")}
          placeholder={"https://api.example.com/callback"}
          type={FormControlType.Url}
          isRequired
          control={form.control}
          name="url"
        />
        <Stack direction="row" spacing="6">
          <Stack spacing="0" flex="1">
            <Stack direction="row" spacing="2">
              <Text fontWeight="medium">{t("Status")}</Text>
              <Tag colorScheme={enabled ? "green" : "red"}>
                {t(enabled ? "Enabled" : "Disabled")}
              </Tag>
            </Stack>
            <Text color="grey.400">
              {t("You can activate or deactivate this webhook")}
            </Text>
          </Stack>
          <Switch w="initial" control={form.control} name="enabled" />
        </Stack>
        <Divider />
        <Stack direction="row" spacing="6">
          <Stack spacing="0" flex="1">
            <Text fontWeight="medium">{t("SSL validation")}</Text>
            <Text color="grey.400">
              {t("Disabling SSL validation is not secure")}
            </Text>
          </Stack>
          <Switch w="initial" control={form.control} name="sslValidation" />
        </Stack>
      </Stack>
      <Stack spacing="6">
        <Heading as="h5" size="md">
          {t("Triggers")}
        </Heading>
        {WEBHOOK_TRIGGER_OPTIONS.map((option, index) => (
          <Fragment key={option.label}>
            <Stack direction="row" spacing="6">
              <Stack spacing="0" flex="1">
                <Text fontWeight="medium">{option.label}</Text>
                <Text color="grey.400">{option.description}</Text>
              </Stack>

              <NativeSwitch
                onChange={() => toggleTrigger(option.value)}
                isChecked={isChecked(option.value)}
              />
            </Stack>
            {index !== WEBHOOK_TRIGGER_OPTIONS.length - 1 && <Divider />}
          </Fragment>
        ))}
      </Stack>
    </Stack>
  );
}
