import api from "@/api"
import { NetshotError } from "@/api/httpClient"
import { MUTATIONS } from "@/constants"
import { useConfirmDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { Diagnostic, PropsWithRenderItem } from "@/types"
import { Text } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import { QUERIES } from "../constants"

export type DiagnosticRemoveButtonProps = PropsWithRenderItem<{
  diagnostic: Diagnostic
}>

export default function DiagnosticRemoveButton(props: DiagnosticRemoveButtonProps) {
  const { diagnostic, renderItem } = props
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const toast = useToast()
  const navigate = useNavigate()
  const dialog = useConfirmDialogWithMutation()

  const mutation = useMutation({
    mutationKey: MUTATIONS.DIAGNOSTIC_REMOVE,
    mutationFn: async () => api.diagnostic.remove(diagnostic?.id),
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  const open = () => {
    const dialogRef = dialog.open(MUTATIONS.DIAGNOSTIC_REMOVE, {
      title: t("removeDiagnostic"),
      description: (
        <Text>
          {t("youAreAboutToRemoveTheDiagnostic", {
            diagnosticName: diagnostic?.name,
          })}
        </Text>
      ),
      async onConfirm() {
        await mutation.mutateAsync()
        navigate("/app/diagnostics")

        queryClient.invalidateQueries({ queryKey: [QUERIES.DIAGNOSTIC_LIST] })
        queryClient.invalidateQueries({ queryKey: [QUERIES.DIAGNOSTIC_SEARCH_LIST] })

        dialogRef.close()
      },
      confirmButton: {
        label: t("remove2"),
        props: {
          colorPalette: "red",
        },
      },
    })
  }

  return renderItem(open)
}
