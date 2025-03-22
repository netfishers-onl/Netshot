import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { Dialog } from "@/dialog";
import { useToast } from "@/hooks";
import { HardwareRule } from "@/types";
import { Text } from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MouseEvent, ReactElement, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { QUERIES } from "../constants";

type RemoveHardwareRuleButtonProps = {
  rule: HardwareRule;
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

export default function RemoveHardwareRuleButton(
  props: RemoveHardwareRuleButtonProps
) {
  const { rule, renderItem } = props;
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const toast = useToast();

  const mutation = useMutation({
    mutationFn: async () => api.hardwareRule.remove(rule?.id),
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: [QUERIES.HARDWARE_RULE_LIST] });
      dialog.close();
    },
    onError(err: NetshotError) {
      toast.error(err);
    },
  });

  const dialog = Dialog.useConfirm({
    title: t("Remove hardware rule"),
    description: <Text>{t("You are about to remove this hardware rule")}</Text>,
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
