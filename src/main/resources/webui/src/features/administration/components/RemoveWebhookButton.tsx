import api from "@/api"
import { NetshotError } from "@/api/httpClient"
import { MUTATIONS } from "@/constants"
import { useConfirmDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { Hook, PropsWithRenderItem } from "@/types"
import { Text } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { MouseEvent, useCallback } from "react"
import { Trans, useTranslation } from "react-i18next"
import { QUERIES } from "../constants"

export type RemoveWebhookButtonProps = PropsWithRenderItem<{
  webhook: Hook
}>

export default function RemoveWebhookButton(props: RemoveWebhookButtonProps) {
  const { webhook, renderItem } = props
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const toast = useToast()
  const dialog = useConfirmDialogWithMutation()

  const mutation = useMutation({
    mutationKey: MUTATIONS.ADMIN_HOOK_REMOVE,
    mutationFn: async () => api.admin.removeHook(webhook.id),
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  const open = useCallback(
    (evt: MouseEvent) => {
      evt?.stopPropagation()
      const dialogRef = dialog.open(MUTATIONS.ADMIN_HOOK_REMOVE, {
        title: t("removeWebhook"),
        description: (
          <Trans
            i18nKey="youAreAboutToRemoveTheWebhookAreYouSure"
            values={{ name: webhook.name }}
            components={{ bold: <Text as="span" fontWeight="semibold" /> }}
          />
        ),
        async onConfirm() {
          await mutation.mutateAsync()
          queryClient.invalidateQueries({ queryKey: [QUERIES.ADMIN_WEBHOOKS] })
          dialogRef.close()

          toast.success({
            title: t("success"),
            description: t("webhookHasBeenSuccessfullyRemoved", {
              name: webhook.name,
            }),
          })
        },
        confirmButton: {
          label: t("remove"),
          props: {
            colorPalette: "red",
          },
        },
      })
    },
    [dialog]
  )

  return renderItem(open)
}
