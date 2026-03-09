import api from "@/api"
import { NetshotError } from "@/api/httpClient"
import { MUTATIONS } from "@/constants"
import { useFormDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { Hook, PropsWithRenderItem } from "@/types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { QUERIES } from "../constants"
import { useWebhookDataTypeOptions } from "../hooks"
import AdministrationWebhookForm, { WebhookForm } from "./AdministrationWebhookForm"

export type AddWebhookButtonProps = PropsWithRenderItem

export default function AddWebhookButton(props: AddWebhookButtonProps) {
  const { renderItem } = props
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
      sslValidation: true,
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
      title: t("Create webhook"),
      description: <AdministrationWebhookForm />,
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

        toast.success({
          title: t("Success"),
          description: t("Webhook {{name}} has been successfully created", {
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
        label: t("Create"),
      },
    })
  }

  return renderItem(open)
}
