import api, { CreateOrUpdateHardwareRule } from "@/api";
import { NetshotError } from "@/api/httpClient";
import { ANY_OPTION } from "@/constants";
import { Dialog } from "@/dialog";
import { useToast } from "@/hooks";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MouseEvent, ReactElement, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { QUERIES } from "../constants";
import { HardwareRuleFormValues } from "../types";
import HardwareRuleForm from "./HardwareRuleForm";

export type AddHardwareRuleButtonProps = {
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

export default function AddHardwareRuleButton(
  props: AddHardwareRuleButtonProps
) {
  const { renderItem } = props;
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();

  const form = useForm<HardwareRuleFormValues>({
    mode: "onChange",
    defaultValues: {
      driver: ANY_OPTION,
      family: "",
      familyRegExp: false,
      group: null,
      partNumber: "",
      partNumberRegExp: false,
      endOfLife: "",
      endOfSale: "",
    },
  });

  const mutation = useMutation(
    async (payload: CreateOrUpdateHardwareRule) =>
      api.hardwareRule.create(payload),
    {
      onSuccess() {
        dialog.close();
        toast.success({
          title: t("Success"),
          description: t("Hardware rule has been successfully created"),
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
    title: t("Add hardware rule"),
    description: <HardwareRuleForm />,
    form,
    isLoading: mutation.isLoading,
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
