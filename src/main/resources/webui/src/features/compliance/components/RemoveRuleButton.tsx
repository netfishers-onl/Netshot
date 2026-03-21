import api from "@/api"
import { NetshotError } from "@/api/httpClient"
import { QUERIES as GLOBAL_QUERIES, MUTATIONS } from "@/constants"
import { useConfirmDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { PropsWithRenderItem, Rule } from "@/types"
import { Text } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { MouseEvent } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import { QUERIES } from "../constants"

export type RemoveRuleButtonProps = PropsWithRenderItem<{
  policyId: number
  rule: Rule
}>

export default function RemoveRuleButton(props: RemoveRuleButtonProps) {
  const { policyId, rule, renderItem } = props
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const toast = useToast()
  const navigate = useNavigate()
  const dialog = useConfirmDialogWithMutation()

  const mutation = useMutation({
    mutationKey: MUTATIONS.RULE_REMOVE,
    mutationFn: async () => api.rule.remove(rule?.id),
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  const open = (evt: MouseEvent) => {
    evt?.stopPropagation()
    const dialogRef = dialog.open(MUTATIONS.RULE_REMOVE, {
      title: t("removeRule"),
      description: (
        <Text>
          {t("youAreAboutToRemoveTheRule", {
            ruleName: rule?.name,
          })}
        </Text>
      ),
      async onConfirm() {
        await mutation.mutateAsync()
        queryClient.invalidateQueries({ queryKey: [GLOBAL_QUERIES.POLICY_LIST] })
        queryClient.invalidateQueries({ queryKey: [QUERIES.POLICY_RULE_LIST, policyId] })
        navigate("/app/compliance")
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
