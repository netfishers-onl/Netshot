import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { Dialog } from "@/dialog";
import { useToast } from "@/hooks";
import { SoftwareRule } from "@/types";
import { Text } from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MouseEvent, ReactElement, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { QUERIES } from "../constants";

type RemoveSoftwareRuleButtonProps = {
  rule: SoftwareRule;
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

export default function RemoveSoftwareRuleButton(
  props: RemoveSoftwareRuleButtonProps
) {
  const { rule, renderItem } = props;
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const toast = useToast();

  const mutation = useMutation(async () => api.softwareRule.remove(rule?.id), {
    onSuccess() {
      queryClient.invalidateQueries([QUERIES.SOFTWARE_RULE_LIST]);
      dialog.close();
    },
    onError(err: NetshotError) {
      toast.error(err);
    },
  });

  const dialog = Dialog.useConfirm({
    title: t("Remove software rule"),
    description: <Text>{t("You are about to remove this software rule")}</Text>,
    isLoading: mutation.isLoading,
    onConfirm() {
      mutation.mutate();
    },
    confirmButton: {
      label: t("remove"),
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
