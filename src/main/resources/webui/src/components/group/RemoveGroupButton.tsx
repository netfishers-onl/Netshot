import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { QUERIES } from "@/constants";
import { Dialog } from "@/dialog";
import { useToast } from "@/hooks";
import { Group } from "@/types";
import { Alert, Stack, Text } from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MouseEvent, useCallback } from "react";
import { useTranslation } from "react-i18next";

export type RemoveGroupButtonProps = {
  group: Group;
  renderItem(open: (e: MouseEvent) => void);
};

export default function RemoveGroupButton(props: RemoveGroupButtonProps) {
  const { group, renderItem } = props;
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: api.group.remove,
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: [QUERIES.DEVICE_GROUPS] });
      dialog.close();
    },
    onError(err: NetshotError) {
      toast.error(err);
    },
  });

  const dialog = Dialog.useConfirm({
    title: t("Remove group"),
    description: (
      <Stack spacing="5">
        <Text>
          {t(`You are about to remove the group`)}{" "}
          <Text as="span" fontWeight="semibold">
            {group.name}
          </Text>
        </Text>
        <Alert color="yellow.900" status="warning">
          {t(
            "The related software and hardware compliance rules, and the group specific tasks will be removed along with the group itself."
          )}
        </Alert>
      </Stack>
    ),
    isLoading: mutation.isPending,
    onConfirm() {
      mutation.mutate(group.id);
    },
    confirmButton: {
      label: t("Remove"),
      props: {
        colorScheme: "red",
      },
    },
  });

  const open = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      dialog.open();
    },
    [dialog]
  );

  return renderItem(open);
}
