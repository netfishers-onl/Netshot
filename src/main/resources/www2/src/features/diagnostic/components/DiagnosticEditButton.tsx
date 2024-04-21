import api from "@/api";
import { CreateOrUpdateDiagnosticPayload } from "@/api/diagnostic";
import { NetshotError } from "@/api/httpClient";
import { Dialog } from "@/dialog";
import { useToast } from "@/hooks";
import { Diagnostic, DiagnosticResultType, DiagnosticType } from "@/types";
import { getKeyByValue } from "@/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MouseEvent, ReactElement, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { QUERIES } from "../constants";
import { Form } from "../types";
import { DiagnosticEditForm } from "./DiagnosticEditForm";
import DiagnosticEditScript from "./DiagnosticEditScript";

export type DiagnosticEditButtonProps = {
  diagnostic: Diagnostic;
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

export default function DiagnosticEditButton(props: DiagnosticEditButtonProps) {
  const { diagnostic, renderItem } = props;
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();

  const hasScript = useMemo(
    () =>
      diagnostic?.type === DiagnosticType.Javascript ||
      diagnostic?.type === DiagnosticType.Python,
    [diagnostic]
  );

  const defaultValues = useMemo(() => {
    const values = {
      name: diagnostic?.name,
      resultType: null,
      targetGroup: null,
      deviceDriver: null,
      cliMode: null,
      command: diagnostic?.command,
      modifierPattern: diagnostic?.modifierPattern,
      modifierReplacement: diagnostic?.modifierReplacement,
      script: diagnostic?.script,
    } as Form;

    if (diagnostic?.resultType) {
      values.resultType = {
        label: t(getKeyByValue(DiagnosticResultType, diagnostic?.resultType)),
        value: diagnostic?.resultType,
      };
    }

    if (diagnostic?.targetGroup) {
      values.targetGroup = {
        label: diagnostic?.targetGroup?.name,
        value: diagnostic?.targetGroup?.id,
      };
    }

    if (diagnostic?.cliMode) {
      values.cliMode = {
        label: diagnostic?.cliMode,
        value: diagnostic?.cliMode,
      };
    }

    return values;
  }, [diagnostic]);

  const form = useForm<Form>({
    mode: "onChange",
    defaultValues,
  });

  const mutation = useMutation(
    async (payload: Partial<CreateOrUpdateDiagnosticPayload>) =>
      api.diagnostic.update(diagnostic?.id, payload),
    {
      onSuccess() {
        dialog.close();
        toast.success({
          title: t("Success"),
          description: t(
            "Diagnostic {{diagnosticName}} has been successfully modified",
            {
              diagnosticName: diagnostic?.name,
            }
          ),
        });

        queryClient.invalidateQueries([
          QUERIES.DIAGNOSTIC_DETAIL,
          diagnostic.id,
        ]);
      },
      onError(err: NetshotError) {
        toast.error(err);
      },
    }
  );

  const onSubmit = useCallback(
    async (values: Form) => {
      let updatedDiagnostic: Partial<CreateOrUpdateDiagnosticPayload> = {
        id: diagnostic.id,
        enabled: diagnostic.enabled,
        type: diagnostic.type,
        name: values.name,
        resultType: values.resultType?.value,
        targetGroup: values.targetGroup?.value?.toString(),
        deviceDriver: values.deviceDriver?.value?.name,
        cliMode: values.cliMode?.value,
        command: values.command,
        modifierPattern: values.modifierPattern,
        modifierReplacement: values.modifierReplacement,
      };

      if (hasScript) {
        updatedDiagnostic.script = values.script;
      }

      mutation.mutate(updatedDiagnostic);
    },
    [diagnostic, mutation]
  );

  form.watch((values) => {
    if (values.script?.length === 0) {
      form.setError("script", {
        message: t("This field is required"),
      });
    }
  });

  const dialog = Dialog.useForm({
    title: t("Edit device"),
    description: hasScript ? (
      <DiagnosticEditScript
        type={diagnostic?.type}
        deviceDriver={diagnostic?.deviceDriver}
      />
    ) : (
      <DiagnosticEditForm
        type={diagnostic?.type}
        deviceDriver={diagnostic?.deviceDriver}
      />
    ),
    form,
    isLoading: mutation.isLoading,
    size: "2xl",
    variant: hasScript ? "full-floating" : "floating",
    onSubmit,
    onCancel() {
      form.reset();
    },
    submitButton: {
      label: t("Apply changes"),
    },
  });

  return renderItem(dialog.open);
}
