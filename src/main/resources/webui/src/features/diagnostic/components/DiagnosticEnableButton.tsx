import api from "@/api"
import { NetshotError } from "@/api/httpClient"
import { MUTATIONS } from "@/constants"
import { useConfirmDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { Diagnostic, PropsWithRenderItem } from "@/types"
import { Text } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { QUERIES } from "../constants"

export type DiagnosticEnableButtonProps = PropsWithRenderItem<{
  diagnostic: Diagnostic
}>

export default function DiagnosticEnableButton(props: DiagnosticEnableButtonProps) {
  const { diagnostic, renderItem } = props
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const toast = useToast()
  const dialog = useConfirmDialogWithMutation()

  const mutation = useMutation({
    mutationKey: MUTATIONS.DIAGNOSTIC_ENABLE,
    mutationFn: async (payload: Diagnostic) => api.diagnostic.enable(payload),
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  const open = () => {
    const dialogRef = dialog.open(MUTATIONS.DIAGNOSTIC_ENABLE, {
      title: t("enableDiagnostic"),
      description: (
        <Text>
          {t("youAreAboutToEnableTheDiagnostic", {
            diagnosticName: diagnostic?.name,
          })}
        </Text>
      ),
      async onConfirm() {
        await mutation.mutateAsync(diagnostic)

        queryClient.invalidateQueries({
          queryKey: [QUERIES.DIAGNOSTIC_DETAIL, diagnostic?.id],
        })
        queryClient.invalidateQueries({
          queryKey: [QUERIES.DIAGNOSTIC_LIST],
        })

        dialogRef.close()

        toast.success({
          title: t("success"),
          description: t("diagnosticHasBeenSuccessfullyEnabled", {
            diagnosticName: diagnostic?.name,
          }),
        })
      },
      confirmButton: {
        label: t("enable"),
      },
    })
  }

  return renderItem(open)
}
