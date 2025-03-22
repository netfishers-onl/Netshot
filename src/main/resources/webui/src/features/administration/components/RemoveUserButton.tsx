import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { Dialog } from "@/dialog";
import { useToast } from "@/hooks";
import { User } from "@/types";
import { Text } from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MouseEvent, ReactElement, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { QUERIES } from "../constants";

export type RemoveUserButtonProps = {
  user: User;
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

export default function RemoveUserButton(props: RemoveUserButtonProps) {
  const { user, renderItem } = props;
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const toast = useToast();

  const mutation = useMutation({
    mutationFn: async () => api.admin.removeUser(user?.id),
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: [QUERIES.ADMIN_USERS] });
      dialog.close();
    },
    onError(err: NetshotError) {
      toast.error(err);
    },
  });

  const dialog = Dialog.useConfirm({
    title: t("Remove user"),
    description: (
      <Text>
        {t("You are about to remove the user {{username}}", {
          username: user?.username,
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
