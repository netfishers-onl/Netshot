import api from "@/api"
import { NetshotError } from "@/api/httpClient"
import { MUTATIONS } from "@/constants"
import { useConfirmDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { PropsWithRenderItem, Rule } from "@/types"
import { Text } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { QUERIES } from "../constants"

export type DisableRuleButtonProps = PropsWithRenderItem<{
  policyId: number
  rule: Rule
}>

export default function DisableRuleButton(props: DisableRuleButtonProps) {
  const { policyId, rule, renderItem } = props
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const toast = useToast()
  const dialog = useConfirmDialogWithMutation()

  const mutation = useMutation({
    mutationKey: MUTATIONS.RULE_DISABLE,
    mutationFn: async () => api.rule.disable(rule.id, rule),
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  function open() {
    const dialogRef = dialog.open(MUTATIONS.RULE_DISABLE, {
      title: t("Disable rule"),
      description: (
        <Text>
          {t("You are about to disable the rule {{name}}", {
            name: rule?.name,
          })}
        </Text>
      ),
      async onConfirm() {
        await mutation.mutateAsync()
        queryClient.invalidateQueries({ queryKey: [QUERIES.POLICY_RULE_LIST, policyId] })
        queryClient.invalidateQueries({ queryKey: [QUERIES.RULE_DETAIL, +policyId, rule.id] })

        dialogRef.close()

        toast.success({
          title: t("Success"),
          description: t("Rule {{name}} has been successfully disabled", {
            name: rule?.name,
          }),
        })
      },
      confirmButton: {
        label: t("Disable"),
        props: {
          colorPalette: "red",
        },
      },
    })
  }

  return renderItem(open)
}
