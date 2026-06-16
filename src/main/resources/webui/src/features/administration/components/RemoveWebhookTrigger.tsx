import api from "@/api"
import { NetshotError } from "@/api/httpClient"
import { MUTATIONS } from "@/constants"
import { useConfirmDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { Hook } from "@/types"
import { Text } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { MouseEvent, useCallback } from "react"
import { Trans, useTranslation } from "react-i18next"
import React from "react"
import { QUERIES } from "../constants"

export type RemoveWebhookTriggerProps = { webhook: Hook; children: React.ReactElement<any> } & Record<string, unknown>

export default function RemoveWebhookTrigger({ webhook, children, ...rest }: RemoveWebhookTriggerProps) {
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
        title: t("webhook.remove"),
        description: (
          <Trans
            i18nKey="webhook.aboutToRemove"
            values={{ name: webhook.name }}
            components={{ bold: <Text as="span" fontWeight="semibold" /> }}
          />
        ),
        async onConfirm() {
          await mutation.mutateAsync()
          queryClient.invalidateQueries({ queryKey: [QUERIES.ADMIN_WEBHOOKS] })
          dialogRef.close()

          toast.success({
            title: t("common.success"),
            description: t("webhook.successfullyRemoved", {
              name: webhook.name,
            }),
          })
        },
        confirmButton: {
          label: t("common.remove"),
          props: {
            colorPalette: "red",
          },
        },
      })
    },
    [dialog]
  )

  const isMenuItem = "value" in children.props
  return React.cloneElement(children, isMenuItem ? { onSelect: open, ...rest } : { ...rest, onClick: open })
}
