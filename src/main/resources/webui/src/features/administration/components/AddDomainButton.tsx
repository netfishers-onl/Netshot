import api from "@/api"
import { NetshotError } from "@/api/httpClient"
import { MUTATIONS } from "@/constants"
import { useFormDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { Domain, PropsWithRenderItem } from "@/types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { QUERIES } from "../constants"
import AdministrationDomainForm, { DomainForm } from "./AdministrationDomainForm"

export type AddDomainButtonProps = PropsWithRenderItem

export default function AddDomainButton(props: AddDomainButtonProps) {
  const { renderItem } = props
  const { t } = useTranslation()
  const toast = useToast()
  const queryClient = useQueryClient()
  const dialog = useFormDialogWithMutation()

  const form = useForm<DomainForm>({
    mode: "onChange",
    defaultValues: {
      name: "",
      description: "",
      ipAddress: "",
    },
  })

  const mutation = useMutation({
    mutationKey: MUTATIONS.ADMIN_DOMAIN_CREATE,
    mutationFn: async (payload: Partial<Domain>) => api.admin.createDomain(payload),
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  const open = () => {
    const dialogRef = dialog.open(MUTATIONS.ADMIN_DOMAIN_CREATE, {
      title: t("Create domain"),
      description: <AdministrationDomainForm />,
      form,
      size: "lg",
      async onSubmit(values: DomainForm) {
        await mutation.mutateAsync({
          name: values.name,
          description: values.description,
          ipAddress: values.ipAddress,
        })

        dialogRef.close()

        toast.success({
          title: t("Success"),
          description: t("Domain {{name}} has been successfully created", {
            name: values.name,
          }),
        })

        form.reset()

        queryClient.invalidateQueries({ queryKey: [QUERIES.ADMIN_DEVICE_DOMAINS] })
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
