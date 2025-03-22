import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { Dialog } from "@/dialog";
import { useToast } from "@/hooks";
import { Diagnostic } from "@/types";
import { Text } from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MouseEvent, ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { QUERIES } from "../constants";

export type DiagnosticRemoveButtonProps = {
  diagnostic: Diagnostic;
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

export default function DiagnosticRemoveButton(
  props: DiagnosticRemoveButtonProps
) {
  const { diagnostic, renderItem } = props;
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: async () => api.diagnostic.remove(diagnostic?.id),
    onSuccess() {
      navigate("/app/diagnostics");

      queryClient.invalidateQueries({ queryKey: [QUERIES.DIAGNOSTIC_LIST] });
      queryClient.invalidateQueries({ queryKey: [QUERIES.DIAGNOSTIC_SEARCH_LIST] });

      dialog.close();
    },
    onError(err: NetshotError) {
      toast.error(err);
    },
  });

  const dialog = Dialog.useConfirm({
    title: t("Remove diagnostic"),
    description: (
      <Text>
        {t("You are about to remove the diagnostic {{diagnosticName}}", {
          diagnosticName: diagnostic?.name,
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

  return renderItem(dialog.open);
}
