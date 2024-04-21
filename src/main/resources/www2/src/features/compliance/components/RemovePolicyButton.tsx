import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { QUERIES } from "@/constants";
import { Dialog } from "@/dialog";
import { useToast } from "@/hooks";
import { Policy } from "@/types";
import { Text } from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MouseEvent, ReactElement, useCallback } from "react";
import { useTranslation } from "react-i18next";

export type RemovePolicyButtonProps = {
  policy: Policy;
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

export default function RemovePolicyButton(props: RemovePolicyButtonProps) {
  const { policy, renderItem } = props;
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const toast = useToast();

  const mutation = useMutation(async () => api.policy.remove(policy?.id), {
    onSuccess() {
      queryClient.invalidateQueries([QUERIES.POLICY_LIST]);
      dialog.close();
    },
    onError(err: NetshotError) {
      toast.error(err);
    },
  });

  const dialog = Dialog.useConfirm({
    title: t("Remove policy"),
    description: (
      <Text>
        {t("You are about to remove the policy {{policyName}}", {
          policyName: policy?.name,
        })}
      </Text>
    ),
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
    (evt: MouseEvent<HTMLButtonElement>) => {
      evt.stopPropagation();
      dialog.open();
    },
    [dialog]
  );

  return renderItem(open);
}
