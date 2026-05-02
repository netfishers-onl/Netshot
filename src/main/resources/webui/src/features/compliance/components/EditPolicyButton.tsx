import api, { CreateOrUpdatePolicy } from "@/api"
import { NetshotError } from "@/api/httpClient"
import { MUTATIONS, QUERIES } from "@/constants"
import { useFormDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { Policy, PropsWithRenderItem } from "@/types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { MouseEvent, useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import PolicyForm, { Form } from "./PolicyForm"

export type EditPolicyButtonProps = PropsWithRenderItem<{
  policy: Policy
}>

export default function EditPolicyButton(props: EditPolicyButtonProps) {
  const { policy, renderItem } = props
  const { t } = useTranslation()
  const toast = useToast()
  const queryClient = useQueryClient()
  const dialog = useFormDialogWithMutation()

  const defaultValues = useMemo(() => ({
    name: policy?.name,
    targetGroups: policy?.targetGroups?.map((group) => group.id),
  }), [policy])

  const form = useForm<Form>({
    mode: "onChange",
    defaultValues,
  })

  useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues])

  const mutation = useMutation({
    mutationKey: MUTATIONS.POLICY_UPDATE,
    mutationFn: async (payload: CreateOrUpdatePolicy) => api.policy.update(policy.id, payload),
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  const open = (evt: MouseEvent) => {
    evt?.stopPropagation()
    const dialogRef = dialog.open(MUTATIONS.POLICY_UPDATE, {
      title: t("policy.edit"),
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
          description: t("policy.successfullyUpdated", {
            policyName: values.name,
          }),
        })

        queryClient.invalidateQueries({ queryKey: [QUERIES.POLICY_LIST] })
      },
      onCancel() {
        form.reset()
      },
      submitButton: {
        label: t("common.applyChanges"),
      },
    })
  }

  return renderItem(open)
}
