import api from "@/api"
import { NetshotError } from "@/api/httpClient"
import { MUTATIONS } from "@/constants"
import { useConfirmDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { PropsWithRenderItem, SoftwareRule } from "@/types"
import { Text } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { MouseEvent } from "react"
import { useTranslation } from "react-i18next"
import { QUERIES } from "../constants"

type RemoveSoftwareRuleButtonProps = PropsWithRenderItem<{
  rule: SoftwareRule
}>

export default function RemoveSoftwareRuleButton(props: RemoveSoftwareRuleButtonProps) {
  const { rule, renderItem } = props
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const toast = useToast()
  const dialog = useConfirmDialogWithMutation()

  const mutation = useMutation({
    mutationKey: MUTATIONS.SOFTWARE_RULE_REMOVE,
    mutationFn: async () => api.softwareRule.remove(rule?.id),
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  const open = (evt: MouseEvent) => {
    evt?.stopPropagation()
    const dialogRef = dialog.open(MUTATIONS.SOFTWARE_RULE_REMOVE, {
      title: t("Remove software rule"),
      description: <Text>{t("You are about to remove this software rule")}</Text>,
      async onConfirm() {
        await mutation.mutateAsync()
        queryClient.invalidateQueries({ queryKey: [QUERIES.SOFTWARE_RULE_LIST] })
        dialogRef.close()
      },
      confirmButton: {
        label: t("Remove"),
        props: {
          colorPalette: "red",
        },
      },
    })
  }

  return renderItem(open)
}
