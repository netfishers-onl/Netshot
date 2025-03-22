import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { Dialog } from "@/dialog";
import { useToast } from "@/hooks";
import { Diagnostic } from "@/types";
import { Text } from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MouseEvent, ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { QUERIES } from "../constants";

export type DiagnosticEnableButtonProps = {
  diagnostic: Diagnostic;
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

export default function DiagnosticEnableButton(
  props: DiagnosticEnableButtonProps
) {
  const { diagnostic, renderItem } = props;
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const toast = useToast();

  const mutation = useMutation({
    mutationFn: async (payload: Diagnostic) => api.diagnostic.enable(payload),
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: [
          QUERIES.DIAGNOSTIC_DETAIL,
          diagnostic?.id,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERIES.DIAGNOSTIC_LIST],
      });

      dialog.close();

      toast.success({
        title: t("Success"),
        description: t(
          "Diagnostic {{diagnosticName}} has been successfully enabled",
          {
            diagnosticName: diagnostic?.name,
          }
        ),
      });
    },
    onError(err: NetshotError) {
      toast.error(err);
    },
  });

  const dialog = Dialog.useConfirm({
    title: t("Enable diagnostic"),
    description: (
      <Text>
        {t("You are about to enable the diagnostic {{diagnosticName}}", {
          diagnosticName: diagnostic?.name,
        })}
      </Text>
    ),
    isLoading: mutation.isPending,
    onConfirm() {
      mutation.mutate(diagnostic);
    },
    confirmButton: {
      label: t("Enable"),
    },
  });

  return renderItem(dialog.open);
}
