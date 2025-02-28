import { DeviceTypeSelect, Select, TreeGroupSelector } from "@/components";
import FormControl from "@/components/FormControl";
import { useDeviceTypeOptions } from "@/hooks";
import { DiagnosticType } from "@/types";
import { Stack, StackProps } from "@chakra-ui/react";
import { useEffect, useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { CLI_MODE_OPTIONS, RESULT_TYPE_OPTIONS } from "../constants";
import { Form } from "../types";

export type DiagnosticEditFormProps = {
  type: DiagnosticType;
  deviceDriver?: string;
} & StackProps;

export function DiagnosticEditForm(props: DiagnosticEditFormProps) {
  const { type, deviceDriver, ...other } = props;
  const form = useFormContext<Form>();
  const { t } = useTranslation();

  // Get device type options
  const { isLoading, getOptionByDriver } = useDeviceTypeOptions({
    withAny: false,
  });

  const hasScript = useMemo(
    () => type === DiagnosticType.Javascript || type === DiagnosticType.Python,
    [type]
  );

  const targetGroup = useWatch({
    control: form.control,
    name: "targetGroup",
  });

  // Set device driver from diagnostic
  useEffect(() => {
    if (isLoading) {
      return;
    }

    form.setValue("deviceDriver", getOptionByDriver(deviceDriver));
    form.trigger();
  }, [isLoading, deviceDriver]);

  return (
    <Stack spacing="6" px={hasScript ? 0 : 6} {...other}>
      <FormControl
        isRequired
        label={t("Name")}
        placeholder={t("Name")}
        control={form.control}
        name="name"
      />
      <Select
        isRequired
        options={RESULT_TYPE_OPTIONS}
        control={form.control}
        name="resultType"
        label={t("Result type")}
      />
      <TreeGroupSelector
        value={targetGroup ? [targetGroup] : []}
        onChange={(groups) => form.setValue("targetGroup", groups?.[0])}
      />

      {!hasScript && (
        <>
          <DeviceTypeSelect
            isRequired
            control={form.control}
            name="deviceDriver"
          />
          <Select
            isRequired
            options={CLI_MODE_OPTIONS}
            control={form.control}
            name="cliMode"
            label={t("CLI mode")}
          />
          <FormControl
            isRequired
            label={t("CLI command")}
            placeholder={t("e.g. show version | include reason")}
            control={form.control}
            name="command"
          />
          <FormControl
            isRequired
            label={t("RegEx pattern")}
            placeholder={t("e.g. (?s).*Last reload: (.+?)[\r\n]+.*")}
            control={form.control}
            name="modifierPattern"
          />
          <FormControl
            isRequired
            label={t("Replace with")}
            placeholder={t("e.g. $1")}
            control={form.control}
            name="modifierReplacement"
          />
        </>
      )}
    </Stack>
  );
}
