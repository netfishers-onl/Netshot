import {
  DeviceTypeSelect,
  FormControl,
  Icon,
  TreeGroupSelector,
} from "@/components";
import { FormControlType } from "@/components/FormControl";
import { useDeviceTypeOptions } from "@/hooks";
import { Group, HardwareRule } from "@/types";
import { IconButton, Stack } from "@chakra-ui/react";
import { useCallback, useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { HardwareRuleFormValues } from "../types";

export type HardwareRuleFormProps = {
  rule?: HardwareRule;
};

export default function HardwareRuleForm(props: HardwareRuleFormProps) {
  const { rule } = props;
  const form = useFormContext<HardwareRuleFormValues>();
  const { t } = useTranslation();

  const { isLoading, getOptionByDriver } = useDeviceTypeOptions({
    withAny: true,
  });

  useEffect(() => {
    if (!rule) {
      return;
    }

    if (isLoading) {
      return;
    }

    if (rule?.driver === null) {
      return;
    }

    form.setValue("driver", getOptionByDriver(rule.driver));
  }, [isLoading, rule, form, getOptionByDriver]);

  const familyRegExp = useWatch({
    control: form.control,
    name: "familyRegExp",
  });

  const partNumberRegExp = useWatch({
    control: form.control,
    name: "partNumberRegExp",
  });

  const group = useWatch({
    control: form.control,
    name: "group",
  });

  const toggleFamilyRegExp = useCallback(() => {
    form.setValue("familyRegExp", !familyRegExp);
  }, [form, familyRegExp]);

  const togglePartNumberRegExp = useCallback(() => {
    form.setValue("partNumberRegExp", !partNumberRegExp);
  }, [form, partNumberRegExp]);

  const onGroupSelect = useCallback(
    (groups: Group[]) => {
      form.setValue("group", groups[0]);
    },
    [form]
  );

  return (
    <Stack spacing="5">
      <TreeGroupSelector
        value={group ? [group] : []}
        onChange={onGroupSelect}
        withAny
      />
      <DeviceTypeSelect withAny control={form.control} name="driver" />
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
            colorScheme="green"
            icon={familyRegExp ? <Icon name="type" /> : <Icon name="hash" />}
            onClick={toggleFamilyRegExp}
          />
        }
      />
      <FormControl
        control={form.control}
        name="partNumber"
        label={t("Part number")}
        placeholder={t("e.g. FK-X0012")}
        suffix={
          <IconButton
            aria-label={t(
              partNumberRegExp ? "Switch to text" : "Switch to RegExp"
            )}
            title={t(partNumberRegExp ? "Switch to text" : "Switch to RegExp")}
            variant="ghost"
            colorScheme="green"
            icon={
              partNumberRegExp ? <Icon name="type" /> : <Icon name="hash" />
            }
            onClick={togglePartNumberRegExp}
          />
        }
      />
      <FormControl
        control={form.control}
        name="endOfLife"
        type={FormControlType.Date}
        isRequired
      />
      <FormControl
        control={form.control}
        name="endOfSale"
        type={FormControlType.Date}
        isRequired
      />
    </Stack>
  );
}
