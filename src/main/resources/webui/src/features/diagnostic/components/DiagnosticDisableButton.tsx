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

export type DiagnosticDisableButtonProps = PropsWithRenderItem<{
  diagnostic: Diagnostic
}>

export default function DiagnosticDisableButton(props: DiagnosticDisableButtonProps) {
  const { diagnostic, renderItem } = props
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const toast = useToast()
  const dialog = useConfirmDialogWithMutation()

  const mutation = useMutation({
    mutationKey: MUTATIONS.DIAGNOSTIC_DISABLE,
    mutationFn: async (payload: Diagnostic) => api.diagnostic.disable(payload),
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  const open = () => {
    const dialogRef = dialog.open(MUTATIONS.DIAGNOSTIC_DISABLE, {
      title: t("disableDiagnostic"),
      description: (
        <Text>
          {t("youAreAboutToDisableTheDiagnostic", {
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
          description: t("diagnosticHasBeenSuccessfullyDisabled", {
            diagnosticName: diagnostic?.name,
          }),
        })
      },
      confirmButton: {
        label: t("disable"),
        props: {
          colorPalette: "red",
        },
      },
    })
  }

  return renderItem(open)
}
