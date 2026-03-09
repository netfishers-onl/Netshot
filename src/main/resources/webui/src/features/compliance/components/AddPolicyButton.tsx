import api, { CreateOrUpdatePolicy } from "@/api"
import { NetshotError } from "@/api/httpClient"
import { MUTATIONS, QUERIES } from "@/constants"
import { useFormDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { PropsWithRenderItem } from "@/types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import PolicyForm, { Form } from "./PolicyForm"

export type AddPolicyButtonProps = PropsWithRenderItem

export default function AddPolicyButton(props: AddPolicyButtonProps) {
  const { renderItem } = props
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
      title: t("Add policy"),
      description: <PolicyForm />,
      form,
      size: "lg",
      async onSubmit(values: Form) {
        await mutation.mutateAsync({
          name: values.name,
          targetGroups: values.targetGroups,
        })

        dialogRef.close()

        toast.success({
          title: t("Success"),
          description: t("Policy {{policyName}} has been successfully created", {
            policyName: values.name,
          }),
        })

        queryClient.invalidateQueries({ queryKey: [QUERIES.POLICY_LIST] })
      },
      onCancel() {
        form.reset()
      },
      submitButton: {
        label: t("Add policy"),
      },
    })
  }

  return renderItem(open)
}
