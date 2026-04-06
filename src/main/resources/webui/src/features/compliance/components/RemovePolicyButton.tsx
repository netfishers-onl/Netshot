import api from "@/api"
import { NetshotError } from "@/api/httpClient"
import { MUTATIONS, QUERIES } from "@/constants"
import { useConfirmDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { Policy, PropsWithRenderItem } from "@/types"
import { Text } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { MouseEvent } from "react"
import { useTranslation } from "react-i18next"

export type RemovePolicyButtonProps = PropsWithRenderItem<{
  policy: Policy
}>

export default function RemovePolicyButton(props: RemovePolicyButtonProps) {
  const { policy, renderItem } = props
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const toast = useToast()
  const dialog = useConfirmDialogWithMutation()

  const mutation = useMutation({
    mutationKey: MUTATIONS.POLICY_REMOVE,
    mutationFn: async () => api.policy.remove(policy?.id),
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  const open = (evt: MouseEvent<HTMLButtonElement>) => {
    evt?.stopPropagation()
    const dialogRef = dialog.open(MUTATIONS.POLICY_REMOVE, {
      title: t("removePolicy"),
      description: (
        <Text>
          {t("youAreAboutToRemoveThePolicy", {
            policyName: policy?.name,
          })}
        </Text>
      ),
      async onConfirm() {
        await mutation.mutateAsync()
        queryClient.invalidateQueries({ queryKey: [QUERIES.POLICY_LIST] })
        dialogRef.close()
      },
      confirmButton: {
        label: t("remove"),
        props: {
          colorPalette: "red",
        },
      },
    })
  }

  return renderItem(open)
}
