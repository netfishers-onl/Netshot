import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { Dialog } from "@/dialog";
import { useToast } from "@/hooks";
import { Rule } from "@/types";
import { Text } from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MouseEvent, ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { QUERIES } from "../constants";

export type EnableRuleButtonProps = {
  policyId: number;
  rule: Rule;
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

export default function EnableRuleButton(props: EnableRuleButtonProps) {
  const { policyId, rule, renderItem } = props;
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const toast = useToast();

  const mutation = useMutation({
    mutationFn: async () => api.rule.enable(rule.id, rule),
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: [QUERIES.POLICY_RULE_LIST, policyId] });
      queryClient.invalidateQueries({ queryKey: [QUERIES.RULE_DETAIL, +policyId, rule.id] });

      dialog.close();

      toast.success({
        title: t("Success"),
        description: t("Rule {{name}} has been successfully enabled", {
          name: rule?.name,
        }),
      });
    },
    onError(err: NetshotError) {
      toast.error(err);
    },
  });

  const dialog = Dialog.useConfirm({
    title: t("Enable rule"),
    description: (
      <Text>
        {t("You are about to enable the rule {{name}}", {
          name: rule?.name,
        })}
      </Text>
    ),
    isLoading: mutation.isPending,
    onConfirm() {
      mutation.mutate();
    },
    confirmButton: {
      label: t("Enable"),
    },
  });

  return renderItem(dialog.open);
}
