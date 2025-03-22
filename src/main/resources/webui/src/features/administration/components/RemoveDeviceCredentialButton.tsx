import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { Dialog } from "@/dialog";
import { useToast } from "@/hooks";
import { CredentialSet } from "@/types";
import { Text } from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MouseEvent, ReactElement, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { QUERIES } from "../constants";

export type RemoveDeviceCredentialButtonProps = {
  credential: CredentialSet;
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

export default function RemoveDeviceCredentialButton(
  props: RemoveDeviceCredentialButtonProps
) {
  const { credential, renderItem } = props;
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const toast = useToast();

  const mutation = useMutation({
    mutationFn: async () =>
        api.admin.removeCredentialSet(credential?.id),
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: [QUERIES.ADMIN_DEVICE_CREDENTIALS] });
      dialog.close();

      toast.success({
        title: t("Success"),
        description: t(
          "Device creddential {{name}} has been successfully removed",
          {
            name: credential?.name,
          }
        ),
      });
    },
    onError(err: NetshotError) {
      toast.error(err);
    },
  });

  const dialog = Dialog.useConfirm({
    title: t("Remove credential"),
    description: (
      <Text>
        {t("You are about to remove the credential ")}

        <Text as="span" fontWeight="semibold">
          {t("{{name}}", {
            name: credential.name,
          })}
        </Text>

        {t(", are you sure?")}
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
