import api, { CreateOrUpdateHardwareRule } from "@/api";
import { NetshotError } from "@/api/httpClient";
import { ANY_OPTION } from "@/constants";
import { Dialog } from "@/dialog";
import { useToast } from "@/hooks";
import { HardwareRule } from "@/types";
import { getDateFromUnix } from "@/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MouseEvent, ReactElement, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { QUERIES } from "../constants";
import { HardwareRuleFormValues } from "../types";
import HardwareRuleForm from "./HardwareRuleForm";

export type EditHardwareRuleButtonProps = {
  rule: HardwareRule;
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

export default function EditHardwareRuleButton(
  props: EditHardwareRuleButtonProps
) {
  const { rule, renderItem } = props;
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();

  const defaultValues = useMemo(() => {
    return {
      driver: rule.driver ? null : ANY_OPTION,
      family: rule?.family,
      familyRegExp: rule?.familyRegExp,
      group: rule.targetGroup,
      partNumber: rule?.partNumber,
      partNumberRegExp: rule?.partNumberRegExp,
      endOfLife: getDateFromUnix(rule?.endOfLife),
      endOfSale: getDateFromUnix(rule?.endOfSale),
    };
  }, [rule]);

  const form = useForm<HardwareRuleFormValues>({
    mode: "onChange",
    defaultValues,
  });

  const mutation = useMutation(
    async (payload: CreateOrUpdateHardwareRule) =>
      api.hardwareRule.update(rule.id, payload),
    {
      onSuccess() {
        dialog.close();
        toast.success({
          title: t("Success"),
          description: t("Hardware rule has been successfully modified"),
        });

        queryClient.invalidateQueries([QUERIES.HARDWARE_RULE_LIST]);
      },
      onError(err: NetshotError) {
        toast.error(err);
      },
    }
  );

  const onSubmit = useCallback(
    async (values: HardwareRuleFormValues) => {
      mutation.mutate({
        id: rule.id,
        driver: values.driver.value?.name,
        family: values.family,
        familyRegExp: values.familyRegExp,
        group: values.group?.id,

        partNumber: values.partNumber,
        partNumberRegExp: values.partNumberRegExp,
        endOfLife: values.endOfLife,
        endOfSale: values.endOfSale,
      });
    },
    [mutation]
  );

  const dialog = Dialog.useForm({
    title: t("Edit hardware rule"),
    description: <HardwareRuleForm rule={rule} />,
    form,
    isLoading: mutation.isLoading,
    size: "2xl",
    onSubmit,
    onCancel() {
      form.reset();
    },
    submitButton: {
      label: t("Apply changes"),
    },
  });

  return renderItem(dialog.open);
}
