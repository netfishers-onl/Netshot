import api, { CreateOrUpdateRule } from "@/api";
import { NetshotError } from "@/api/httpClient";
import { Dialog } from "@/dialog";
import { useToast } from "@/hooks";
import { Rule, RuleType } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MouseEvent, ReactElement, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { BLOCK_OPTIONS, QUERIES, TEXT_OPTIONS } from "../constants";
import { RuleForm } from "../types";
import { RuleEditForm } from "./RuleEditForm";
import RuleEditScript from "./RuleEditScript";

export type EditRuleButtonProps = {
  policyId: number;
  rule: Rule;
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

export default function EditRuleButton(props: EditRuleButtonProps) {
  const { policyId, rule, renderItem } = props;
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();

  const defaultValues = useMemo(() => {
    const anyBlock = BLOCK_OPTIONS.find(
      (option) => option.value === rule?.anyBlock
    );
    const invert = TEXT_OPTIONS.find((option) => option.value === rule?.invert);

    const values = {
      name: rule?.name,
      script: rule?.script,
      text: rule?.text,
      regExp: rule?.regExp,
      context: rule?.context,
      driver: null,
      field: {
        label: rule?.field,
        value: rule?.field,
      },
      anyBlock,
      matchAll: rule?.matchAll,
      invert,
      normalize: rule?.normalize,
    } as RuleForm;

    return values;
  }, [rule]);

  const form = useForm<RuleForm>({
    mode: "onChange",
    defaultValues,
  });

  const mutation = useMutation({
    mutationFn: async (payload: CreateOrUpdateRule) =>
      api.rule.update(rule.id, payload),
    onSuccess(res) {
      dialog.close();
      toast.success({
        title: t("Success"),
        description: t("Rule {{name}} has been successfully updated", {
          name: res?.name,
        }),
      });

      queryClient.invalidateQueries({ queryKey: [QUERIES.POLICY_RULE_LIST, policyId] });
      queryClient.invalidateQueries({ queryKey: [QUERIES.RULE_DETAIL, +policyId, res.id] });
    },
    onError(err: NetshotError) {
      toast.error(err);
    },
  });

  const onSubmit = useCallback(
    async (values: RuleForm) => {
      mutation.mutate({
        id: rule.id,
        name: rule.name,
        driver: values.driver.value?.name,
        field: values.field?.value,
        context: values.context,
        script: values.script,
        text: values.text,
        anyBlock: values.anyBlock?.value,
        matchAll: values.matchAll,
        invert: values.invert?.value,
        normalize: values.normalize,
        enabled: rule.enabled,
        policy: policyId,
        regExp: rule.regExp,
        type: rule.type,
      });
    },
    [mutation]
  );

  const hasScript = useMemo(
    () => rule?.type === RuleType.Javascript || rule?.type === RuleType.Python,
    [rule]
  );

  const dialog = Dialog.useForm({
    title: t("Edit rule"),
    description: hasScript ? (
      <RuleEditScript type={rule?.type} deviceDriver={rule.deviceDriver} />
    ) : (
      <RuleEditForm type={rule?.type} deviceDriver={rule.deviceDriver} />
    ),
    form,
    isLoading: mutation.isPending,
    size: "2xl",
    variant: hasScript ? "full-floating" : "floating",
    onSubmit,
    onCancel() {
      form.reset();
    },
    submitButton: {
      label: t("Apply changes"),
    },
  });

  const open = useCallback(
    (evt: MouseEvent) => {
      evt.stopPropagation();
      dialog.open();
    },
    [dialog]
  );

  return renderItem(open);
}
