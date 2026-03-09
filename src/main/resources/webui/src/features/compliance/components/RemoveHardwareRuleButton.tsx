import api from "@/api"
import { NetshotError } from "@/api/httpClient"
import { MUTATIONS } from "@/constants"
import { useConfirmDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { HardwareRule, PropsWithRenderItem } from "@/types"
import { Text } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { MouseEvent } from "react"
import { useTranslation } from "react-i18next"
import { QUERIES } from "../constants"

type RemoveHardwareRuleButtonProps = PropsWithRenderItem<{
  rule: HardwareRule
}>

export default function RemoveHardwareRuleButton(props: RemoveHardwareRuleButtonProps) {
  const { rule, renderItem } = props
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const toast = useToast()
  const dialog = useConfirmDialogWithMutation()

  const mutation = useMutation({
    mutationKey: MUTATIONS.HARDWARE_RULE_REMOVE,
    mutationFn: async () => api.hardwareRule.remove(rule?.id),
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  const open = (evt: MouseEvent) => {
    evt?.stopPropagation()
    const dialogRef = dialog.open(MUTATIONS.HARDWARE_RULE_REMOVE, {
      title: t("Remove hardware rule"),
      description: <Text>{t("You are about to remove this hardware rule")}</Text>,
      async onConfirm() {
        await mutation.mutateAsync()
        queryClient.invalidateQueries({ queryKey: [QUERIES.HARDWARE_RULE_LIST] })
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
