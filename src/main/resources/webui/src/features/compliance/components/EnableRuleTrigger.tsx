import api from "@/api"
import { NetshotError } from "@/api/httpClient"
import { MUTATIONS } from "@/constants"
import { useConfirmDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { Rule } from "@/types"
import { Text } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import React from "react"
import { QUERIES } from "../constants"

export type EnableRuleTriggerProps = { policyId: number; rule: Rule; children: React.ReactElement<any> } & Record<string, unknown>

export default function EnableRuleTrigger({ policyId, rule, children, ...rest }: EnableRuleTriggerProps) {
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
      title: t("policy.rule.enable"),
      description: (
        <Text>
          {t("policy.rule.aboutToEnable", {
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
          title: t("common.success"),
          description: t("policy.rule.successfullyEnabled", {
            name: rule?.name,
          }),
        })
      },
      confirmButton: {
        label: t("common.enable"),
      },
    })
  }

  return React.cloneElement(children, { onClick: open, onSelect: open, ...rest })
}
