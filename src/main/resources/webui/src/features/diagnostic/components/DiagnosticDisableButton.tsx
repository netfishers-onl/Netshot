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

export type DiagnosticDisableButtonProps = {
  diagnostic: Diagnostic;
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

export default function DiagnosticDisableButton(
  props: DiagnosticDisableButtonProps
) {
  const { diagnostic, renderItem } = props;
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const toast = useToast();

  const mutation = useMutation(
    async (payload: Diagnostic) => api.diagnostic.disable(payload),
    {
      onSuccess() {
        queryClient.invalidateQueries([
          QUERIES.DIAGNOSTIC_DETAIL,
          diagnostic?.id,
        ]);
        queryClient.invalidateQueries([QUERIES.DIAGNOSTIC_LIST]);

        dialog.close();

        toast.success({
          title: t("Success"),
          description: t(
            "Diagnostic {{diagnosticName}} has been successfully disabled",
            {
              diagnosticName: diagnostic?.name,
            }
          ),
        });
      },
      onError(err: NetshotError) {
        toast.error(err);
      },
    }
  );

  const dialog = Dialog.useConfirm({
    title: t("Disable diagnostic"),
    description: (
      <Text>
        {t("You are about to disable the diagnostic {{diagnosticName}}", {
          diagnosticName: diagnostic?.name,
        })}
      </Text>
    ),
    isLoading: mutation.isLoading,
    onConfirm() {
      mutation.mutate(diagnostic);
    },
    confirmButton: {
      label: t("Disable"),
      props: {
        colorScheme: "red",
      },
    },
  });

  return renderItem(dialog.open);
}
