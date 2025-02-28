import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { Dialog } from "@/dialog";
import { useToast } from "@/hooks";
import { ApiToken } from "@/types";
import { Text } from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MouseEvent, ReactElement, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { QUERIES } from "../constants";

export type RemoveApiTokenButtonProps = {
  apiToken: ApiToken;
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

export default function RemoveApiTokenButton(props: RemoveApiTokenButtonProps) {
  const { apiToken, renderItem } = props;
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const toast = useToast();

  const mutation = useMutation(
    async () => api.admin.removeApiToken(apiToken.id),
    {
      onSuccess() {
        queryClient.invalidateQueries([QUERIES.ADMIN_API_TOKENS]);
        dialog.close();

        toast.success({
          title: t("Success"),
          description: t("Api token has been successfully removed"),
        });
      },
      onError(err: NetshotError) {
        toast.error(err);
      },
    }
  );

  const dialog = Dialog.useConfirm({
    title: t("Remove API token"),
    description: (
      <Text>
        {t("You are about to remove the api token ")}

        <Text as="span" fontWeight="semibold">
          {t("{{description}}", {
            description: apiToken.description,
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
