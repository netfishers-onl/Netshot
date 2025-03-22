import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { QUERIES as GLOBAL_QUERIES } from "@/constants";
import { Dialog } from "@/dialog";
import { useToast } from "@/hooks";
import { Rule } from "@/types";
import { Text } from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MouseEvent, ReactElement, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { QUERIES } from "../constants";

export type RemoveRuleButtonProps = {
  policyId: number;
  rule: Rule;
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

export default function RemoveRuleButton(props: RemoveRuleButtonProps) {
  const { policyId, rule, renderItem } = props;
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: async () => api.rule.remove(rule?.id),
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: [GLOBAL_QUERIES.POLICY_LIST] });
      queryClient.invalidateQueries({ queryKey: [QUERIES.POLICY_RULE_LIST, policyId] });
      navigate("/app/compliance");
      dialog.close();
    },
    onError(err: NetshotError) {
      toast.error(err);
    },
  });

  const dialog = Dialog.useConfirm({
    title: t("Remove rule"),
    description: (
      <Text>
        {t("You are about to remove the rule {{ruleName}}", {
          ruleName: rule?.name,
        })}
      </Text>
    ),
    isLoading: mutation.isPending,
    onConfirm() {
      mutation.mutate();
    },
    confirmButton: {
      label: t("Remove"),
      props: {
        colorScheme: "red",
      },
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
