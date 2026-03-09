import api, { CreateOrUpdateDiagnosticPayload, CreateOrUpdateDiagnosticScriptPayload } from "@/api"
import { NetshotError } from "@/api/httpClient"
import { MUTATIONS } from "@/constants"
import { useFormDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { Diagnostic, DiagnosticType, PropsWithRenderItem } from "@/types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { QUERIES } from "../constants"
import { Form } from "../types"
import { DiagnosticEditForm } from "./DiagnosticEditForm"
import DiagnosticEditScript from "./DiagnosticEditScript"

export type DiagnosticEditButtonProps = PropsWithRenderItem<{
  diagnostic: Diagnostic
}>

export default function DiagnosticEditButton(props: DiagnosticEditButtonProps) {
  const { diagnostic, renderItem } = props
  const { t } = useTranslation()
  const toast = useToast()
  const queryClient = useQueryClient()
  const dialog = useFormDialogWithMutation()

  const hasScript = useMemo(
    () =>
      diagnostic?.type === DiagnosticType.Javascript || diagnostic?.type === DiagnosticType.Python,
    [diagnostic]
  )

  const defaultValues = useMemo(() => {
    const values = {
      name: diagnostic?.name,
      resultType: null,
      targetGroup: null,
      deviceDriver: diagnostic?.deviceDriver,
      cliMode: null,
      command: diagnostic?.command,
      modifierPattern: diagnostic?.modifierPattern,
      modifierReplacement: diagnostic?.modifierReplacement,
      script: diagnostic?.script,
    } as Form

    if (diagnostic?.resultType) {
      values.resultType = diagnostic?.resultType
    }

    if (diagnostic?.targetGroup) {
      values.targetGroup = diagnostic?.targetGroup.id
    }

    if (diagnostic?.cliMode) {
      values.cliMode = diagnostic?.cliMode
    }

    return values
  }, [diagnostic])

  const form = useForm<Form>({
    mode: "onChange",
    defaultValues,
  })

  const mutation = useMutation({
    mutationKey: MUTATIONS.DIAGNOSTIC_UPDATE,
    mutationFn: async (
      payload: Partial<CreateOrUpdateDiagnosticPayload | CreateOrUpdateDiagnosticScriptPayload>
    ) => api.diagnostic.update(diagnostic?.id, payload),
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  form.watch((values) => {
    if (values.script?.length === 0) {
      form.setError("script", {
        message: t("This field is required"),
      })
    }
  })

  useEffect(() => {
    form.reset(defaultValues)
  }, [diagnostic])

  const open = () => {
    const dialogRef = dialog.open(MUTATIONS.DIAGNOSTIC_UPDATE, {
      title: t("Edit device"),
      description: hasScript ? (
        <DiagnosticEditScript type={diagnostic?.type} />
      ) : (
        <DiagnosticEditForm type={diagnostic?.type} />
      ),
      form,
      size: "lg",
      variant: hasScript ? "full-floating" : "floating",
      async onSubmit(values: Form) {
        const data = await mutation.mutateAsync({
          deviceDriver: values.deviceDriver,
          cliMode: values.cliMode,
          command: values.command,
          modifierPattern: values.modifierPattern,
          modifierReplacement: values.modifierReplacement,
          id: diagnostic.id,
          enabled: diagnostic.enabled,
          type: diagnostic.type,
          name: values.name,
          resultType: values.resultType,
          targetGroup: values.targetGroup ? values.targetGroup.toString() : "-1",
          script: values.script,
        })

        toast.success({
          title: t("Success"),
          description: t("Diagnostic {{diagnosticName}} has been successfully modified", {
            diagnosticName: diagnostic?.name,
          }),
        })

        queryClient.invalidateQueries({
          queryKey: [QUERIES.DIAGNOSTIC_DETAIL, data.id],
        })

        queryClient.invalidateQueries({ queryKey: [QUERIES.DIAGNOSTIC_LIST] })

        dialogRef.close()
      },
      onCancel() {
        form.reset()
      },
      submitButton: {
        label: t("Apply changes"),
      },
    })
  }

  return renderItem(open)
}
