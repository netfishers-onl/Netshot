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

export type EnableRuleButtonProps = PropsWithRenderItem<{
  policyId: number
  rule: Rule
}>

export default function EnableRuleButton(props: EnableRuleButtonProps) {
  const { policyId, rule, renderItem } = props
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const toast = useToast()
  const dialog = useConfirmDialogWithMutation()

  const mutation = useMutation({
    mutationKey: MUTATIONS.RULE_ENABLE,
    mutationFn: async () => api.rule.enable(rule.id, rule),
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  function open() {
    const dialogRef = dialog.open(MUTATIONS.RULE_ENABLE, {
      title: t("enableRule"),
      description: (
        <Text>
          {t("youAreAboutToEnableTheRule", {
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
          title: t("success"),
          description: t("ruleHasBeenSuccessfullyEnabled", {
            name: rule?.name,
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
