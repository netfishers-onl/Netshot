import api from "@/api"
import { NetshotError } from "@/api/httpClient"
import { MUTATIONS } from "@/constants"
import { useFormDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { Hook } from "@/types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import React from "react"
import { QUERIES } from "../constants"
import WebhookFormComponent, { WebhookForm } from "./WebhookForm"

export type EditWebhookTriggerProps = { webhook: Hook; children: React.ReactElement<any> } & Record<string, unknown>

export default function EditWebhookTrigger({ webhook, children, ...rest }: EditWebhookTriggerProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const queryClient = useQueryClient()
  const dialog = useFormDialogWithMutation()

  const defaultValues = useMemo(() => {
    return {
      name: webhook.name,
      enabled: webhook.enabled,
      action: webhook.action,
      url: webhook.url,
      sslValidation: webhook.sslValidation,
      triggers: webhook.triggers,
    }
  }, [webhook])

  const form = useForm<WebhookForm>({
    mode: "onChange",
    defaultValues,
  })

  const mutation = useMutation({
    mutationKey: MUTATIONS.ADMIN_HOOK_UPDATE,
    mutationFn: async (payload: Partial<Hook>) => api.admin.updateHook(webhook?.id, payload),
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  useEffect(() => {
    form.reset(defaultValues)
  }, [webhook])

  const open = () => {
    const dialogRef = dialog.open(MUTATIONS.ADMIN_HOOK_UPDATE, {
      title: t("webhook.update"),
      description: <WebhookFormComponent />,
      form,
      size: "lg",
      async onSubmit(values: WebhookForm) {
        await mutation.mutateAsync({
          name: values.name,
          action: values.action,
          url: values.url,
          enabled: values.enabled,
          sslValidation: values.sslValidation,
          triggers: values.triggers,
          type: "Web",
        })

        dialogRef.close()
        form.reset()

        toast.success({
          title: t("common.success"),
          description: t("webhook.successfullyUpdated", {
            name: values.name,
          }),
        })

        queryClient.invalidateQueries({ queryKey: [QUERIES.ADMIN_WEBHOOKS] })
      },
      onCancel() {
        form.reset()
      },
      submitButton: {
        label: t("common.applyChanges"),
      },
    })
  }

  return React.cloneElement(children, { onClick: open, onSelect: open, ...rest })
}
