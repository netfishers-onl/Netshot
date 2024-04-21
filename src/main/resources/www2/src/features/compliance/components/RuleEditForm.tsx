import { TestRuleTextOnDevicePayload } from "@/api/rule";
import { Checkbox, DeviceTypeSelect, Select } from "@/components";
import FormControl, { FormControlType } from "@/components/FormControl";
import { useDeviceTypeOptions } from "@/hooks";
import { RuleType } from "@/types";
import { Heading, Stack, StackProps } from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { BLOCK_OPTIONS, TEXT_OPTIONS } from "../constants";
import { RuleForm } from "../types";
import TestRuleTextOnDevice from "./TestRuleTextOnDevice";

export type RuleEditFormProps = {
  type: RuleType;
  deviceDriver?: string;
} & StackProps;

export function RuleEditForm(props: RuleEditFormProps) {
  const { type, deviceDriver, ...other } = props;
  const form = useFormContext<RuleForm>();
  const { t } = useTranslation();
  const [fieldOptions, setFieldOptions] = useState([]);

  // Get device type options
  const { isLoading, getOptionByDriver } = useDeviceTypeOptions({
    withAny: true,
  });

  const hasScript = useMemo(
    () => type === RuleType.Javascript || type === RuleType.Python,
    [type]
  );

  const driver = useWatch({
    control: form.control,
    name: "driver.value",
  });

  useEffect(() => {
    if (isLoading) {
      return;
    }

    form.setValue("driver", getOptionByDriver(deviceDriver));
  }, [isLoading, deviceDriver]);

  useEffect(() => {
    if (!driver) return;

    setFieldOptions([
      ...driver.attributes.map((attr) => ({
        label: t(attr.title),
        value: attr.name,
      })),
    ]);
  }, [driver]);

  const testRule = useMemo(() => {
    const values = form.getValues();

    return {
      anyBlock: values.anyBlock?.value,
      context: values.context,
      driver: values.driver?.value?.name,
      field: values.field?.value,
      invert: values.invert?.value,
      matchAll: values.matchAll,
      normalize: values.normalize,
      regExp: values.regExp,
      text: values.text,
      type,
    } as TestRuleTextOnDevicePayload;
  }, [form, type]);

  return (
    <Stack spacing="6" px={hasScript ? 0 : 6} {...other}>
      <FormControl
        isRequired
        label={t("Name")}
        placeholder={t("Name")}
        control={form.control}
        name="name"
      />

      {!hasScript && (
        <>
          <DeviceTypeSelect withAny control={form.control} name="driver" />
          <Select
            options={fieldOptions}
            control={form.control}
            name="field"
            label={t("Field")}
          />
          <FormControl
            type={FormControlType.LongText}
            label={t("Context")}
            placeholder={t("e.g. show version | include reason")}
            control={form.control}
            name="context"
          />
          <Select
            isRequired
            options={BLOCK_OPTIONS}
            control={form.control}
            name="anyBlock"
            label={t("Block validation")}
          />
          <Select
            isRequired
            options={TEXT_OPTIONS}
            control={form.control}
            name="invert"
            label={t("Existing text")}
          />

          <Stack spacing="6" flex="1">
            <Checkbox control={form.control} name="regExp">
              {t("The provided text is a regular expression")}
            </Checkbox>
            <Checkbox control={form.control} name="matchAll">
              {t("Compare the text to the whole section")}
            </Checkbox>
            <Checkbox control={form.control} name="normalize">
              {t("Normalize the field text")}
            </Checkbox>
          </Stack>

          <FormControl
            type={FormControlType.LongText}
            label={t("Text or pattern")}
            placeholder={t("e.g. unknown reason")}
            control={form.control}
            name="text"
          />
          <Stack spacing="5" mb="6">
            <Heading as="h4" size="md">
              {t("Test on device")}
            </Heading>
            <TestRuleTextOnDevice rule={testRule} />
          </Stack>
        </>
      )}
    </Stack>
  );
}
