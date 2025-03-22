import api, { CreateOrUpdateSoftwareRule } from "@/api";
import { NetshotError } from "@/api/httpClient";
import { ANY_OPTION, DEVICE_LEVEL_OPTIONS } from "@/constants";
import { Dialog } from "@/dialog";
import { useToast } from "@/hooks";
import { SoftwareRule } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MouseEvent, ReactElement, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { QUERIES } from "../constants";
import { SoftwareRuleFormValues } from "../types";
import SoftwareRuleForm from "./SoftwareRuleForm";

export type AddSoftwareRuleButtonProps = {
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

export default function AddSoftwareRuleButton(
  props: AddSoftwareRuleButtonProps
) {
  const { renderItem } = props;
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();

  const form = useForm<SoftwareRuleFormValues>({
    mode: "onChange",
    defaultValues: {
      driver: ANY_OPTION,
      family: "",
      familyRegExp: false,
      group: null,
      level: DEVICE_LEVEL_OPTIONS[0],
      partNumber: "",
      partNumberRegExp: false,
      version: "",
      versionRegExp: false,
    },
  });

  const mutation = useMutation({
    mutationFn: async (payload: CreateOrUpdateSoftwareRule) =>
      api.softwareRule.create(payload),
    onSuccess() {
      dialog.close();
      toast.success({
        title: t("Success"),
        description: t("Software rule has been successfully created"),
      });

      queryClient.invalidateQueries({ queryKey: [QUERIES.SOFTWARE_RULE_LIST] });
    },
    onError(err: NetshotError) {
      toast.error(err);
    },
  });

  const onSubmit = useCallback(
    async (values: SoftwareRuleFormValues) => {
      const rules = queryClient.getQueryData([
        QUERIES.SOFTWARE_RULE_LIST,
      ]) as SoftwareRule[];

      mutation.mutate({
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
    title: t("Add software rule"),
    description: <SoftwareRuleForm />,
    form,
    isLoading: mutation.isPending,
    size: "2xl",
    onSubmit,
    onCancel() {
      form.reset();
    },
    submitButton: {
      label: t("Add rule"),
    },
  });

  return renderItem(dialog.open);
}
