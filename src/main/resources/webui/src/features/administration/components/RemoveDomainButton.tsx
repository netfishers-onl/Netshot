import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { Dialog } from "@/dialog";
import { useToast } from "@/hooks";
import { Domain } from "@/types";
import { Text } from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MouseEvent, ReactElement, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { QUERIES } from "../constants";

export type RemoveDomainButtonProps = {
  domain: Domain;
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

export default function RemoveDomainButton(props: RemoveDomainButtonProps) {
  const { domain, renderItem } = props;
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const toast = useToast();

  const mutation = useMutation(async () => api.admin.removeDomain(domain?.id), {
    onSuccess() {
      queryClient.invalidateQueries([QUERIES.ADMIN_DEVICE_DOMAINS]);
      dialog.close();
    },
    onError(err: NetshotError) {
      toast.error(err);
    },
  });

  const dialog = Dialog.useConfirm({
    title: t("Remove domain"),
    description: (
      <Text>
        {t("You are about to remove the domain {{name}}", {
          name: domain?.name,
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
    (evt: MouseEvent) => {
      evt.stopPropagation();
      dialog.open();
    },
    [dialog]
  );

  return renderItem(open);
}
