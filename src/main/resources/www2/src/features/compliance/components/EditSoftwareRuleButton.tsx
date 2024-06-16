import api, { CreateOrUpdateSoftwareRule } from "@/api";
import { NetshotError } from "@/api/httpClient";
import { ANY_OPTION, DEVICE_LEVEL_OPTIONS } from "@/constants";
import { Dialog } from "@/dialog";
import { useToast } from "@/hooks";
import { SoftwareRule } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MouseEvent, ReactElement, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { QUERIES } from "../constants";
import { SoftwareRuleFormValues } from "../types";
import SoftwareRuleForm from "./SoftwareRuleForm";

export type EditSoftwareRuleButtonProps = {
  rule: SoftwareRule;
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

export default function EditSoftwareRuleButton(
  props: EditSoftwareRuleButtonProps
) {
  const { rule, renderItem } = props;
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();

  const defaultValues = useMemo(() => {
    const level = DEVICE_LEVEL_OPTIONS.find(
      (option) => option.value === rule?.level
    );

    return {
      driver: rule.driver ? null : ANY_OPTION,
      family: rule?.family,
      familyRegExp: rule?.familyRegExp,
      group: rule.targetGroup,
      level,
      partNumber: rule?.partNumber,
      partNumberRegExp: rule?.partNumberRegExp,
      version: rule?.version,
      versionRegExp: rule?.versionRegExp,
    };
  }, [rule]);

  const form = useForm<SoftwareRuleFormValues>({
    mode: "onChange",
    defaultValues,
  });

  const mutation = useMutation(
    async (payload: CreateOrUpdateSoftwareRule) =>
      api.softwareRule.update(rule.id, payload),
    {
      onSuccess() {
        dialog.close();
        toast.success({
          title: t("Success"),
          description: t("Software rule has been successfully modified"),
        });

        queryClient.invalidateQueries([QUERIES.SOFTWARE_RULE_LIST]);
      },
      onError(err: NetshotError) {
        toast.error(err);
      },
    }
  );

  const onSubmit = useCallback(
    async (values: SoftwareRuleFormValues) => {
      mutation.mutate({
        id: rule.id,
        driver: values.driver.value?.name,
        family: values.family,
        familyRegExp: values.familyRegExp,
        group: values.group?.id,
        level: values.level?.value,
        partNumber: values.partNumber,
        partNumberRegExp: values.partNumberRegExp,
        version: values.version,
        versionRegExp: values.versionRegExp,
      });
    },
    [mutation]
  );

  const dialog = Dialog.useForm({
    title: t("Edit software rule"),
    description: <SoftwareRuleForm rule={rule} />,
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
