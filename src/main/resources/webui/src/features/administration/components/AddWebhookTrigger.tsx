import api from "@/api"
import { NetshotError } from "@/api/httpClient"
import { MUTATIONS } from "@/constants"
import { useFormDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { Hook, HttpsCaTrustMode } from "@/types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import React from "react"
import Slot from "@/components/Slot"
import { QUERIES } from "../constants"
import { useWebhookDataTypeOptions } from "../hooks"
import WebhookFormComponent, { WebhookForm } from "./WebhookForm"

export type AddWebhookTriggerProps = { children: React.ReactElement<Record<string, unknown>> } & Record<string, unknown>

export default function AddWebhookTrigger({ children, ...rest }: AddWebhookTriggerProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const queryClient = useQueryClient()
  const webhookDataTypeOptions = useWebhookDataTypeOptions()
  const dialog = useFormDialogWithMutation()

  const form = useForm<WebhookForm>({
    mode: "onChange",
    defaultValues: {
      name: "",
      enabled: true,
      action: webhookDataTypeOptions.getFirst().value,
      url: "",
      httpsCaTrustMode: HttpsCaTrustMode.SystemTruststore,
      httpsCustomCaCertificate: "",
      triggers: [],
    },
  })

  const mutation = useMutation({
    mutationKey: MUTATIONS.ADMIN_HOOK_CREATE,
    mutationFn: async (payload: Partial<Hook>) => api.admin.createHook(payload),
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  useEffect(() => {
    return () => form.reset()
  }, [form])

  const open = () => {
    const dialogRef = dialog.open(MUTATIONS.ADMIN_HOOK_CREATE, {
      title: t("webhook.create"),
      description: <WebhookFormComponent />,
      form,
      size: "lg",
      async onSubmit(values: WebhookForm) {
        await mutation.mutateAsync({
          name: values.name,
          action: values.action,
          url: values.url,
          enabled: values.enabled,
          httpsCaTrustMode: values.httpsCaTrustMode,
          httpsCustomCaCertificate: values.httpsCustomCaCertificate,
          triggers: values.triggers,
          type: "Web",
        })

        dialogRef.close()

        toast.success({
          title: t("common.success"),
          description: t("webhook.successfullyCreated", {
            name: values.name,
          }),
        })

        queryClient.invalidateQueries({ queryKey: [QUERIES.ADMIN_WEBHOOKS] })

        form.reset()
      },
      onCancel() {
        form.reset()
      },
      submitButton: {
        label: t("common.create"),
      },
    })
  }

  return <Slot onTrigger={open} {...rest}>{children}</Slot>
}
