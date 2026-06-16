import api, { CreateOrUpdatePolicy } from "@/api"
import { NetshotError } from "@/api/httpClient"
import { MUTATIONS, QUERIES } from "@/constants"
import { useFormDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import React from "react"
import PolicyForm, { Form } from "./PolicyForm"

export type AddPolicyTriggerProps = { children: React.ReactElement<any> } & Record<string, unknown>

export default function AddPolicyTrigger({ children, ...rest }: AddPolicyTriggerProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const queryClient = useQueryClient()
  const dialog = useFormDialogWithMutation()

  const form = useForm<Form>({
    mode: "onChange",
    defaultValues: {
      name: "",
      targetGroups: [],
    },
  })

  const mutation = useMutation({
    mutationKey: MUTATIONS.POLICY_CREATE,
    mutationFn: async (payload: CreateOrUpdatePolicy) => api.policy.create(payload),
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  const open = () => {
    const dialogRef = dialog.open(MUTATIONS.POLICY_CREATE, {
      title: t("policy.add"),
      description: <PolicyForm />,
      form,
      size: "lg",
      async onSubmit(values: Form) {
        await mutation.mutateAsync({
          name: values.name,
          targetGroups: values.targetGroups,
        })

        dialogRef.close()
        form.reset()

        toast.success({
          title: t("common.success"),
          description: t("policy.successfullyCreated", {
            policyName: values.name,
          }),
        })

        queryClient.invalidateQueries({ queryKey: [QUERIES.POLICY_LIST] })
      },
      onCancel() {
        form.reset()
      },
      submitButton: {
        label: t("policy.add"),
      },
    })
  }

  return React.cloneElement(children, { onClick: open, onSelect: open, ...rest })
}
