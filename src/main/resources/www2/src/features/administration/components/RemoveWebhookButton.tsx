import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { Dialog } from "@/dialog";
import { useToast } from "@/hooks";
import { Hook } from "@/types";
import { Text } from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MouseEvent, ReactElement, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { QUERIES } from "../constants";

export type RemoveWebhookButtonProps = {
  webhook: Hook;
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

export default function RemoveWebhookButton(props: RemoveWebhookButtonProps) {
  const { webhook, renderItem } = props;
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const toast = useToast();

  const mutation = useMutation(async () => api.admin.removeHook(webhook.id), {
    onSuccess() {
      queryClient.invalidateQueries([QUERIES.ADMIN_WEBHOOKS]);
      dialog.close();

      toast.success({
        title: t("Success"),
        description: t("Webhook {{name}} has been successfully removed", {
          name: webhook.name,
        }),
      });
    },
    onError(err: NetshotError) {
      toast.error(err);
    },
  });

  const dialog = Dialog.useConfirm({
    title: t("Remove webhook"),
    description: (
      <Text>
        {t("You are about to remove the webhook ")}

        <Text as="span" fontWeight="semibold">
          {t("{{name}}", {
            name: webhook.name,
          })}
        </Text>

        {t(", are you sure?")}
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
