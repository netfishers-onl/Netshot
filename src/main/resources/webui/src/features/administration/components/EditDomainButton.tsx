import api from "@/api"
import { NetshotError } from "@/api/httpClient"
import { MUTATIONS } from "@/constants"
import { useFormDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { Domain, PropsWithRenderItem } from "@/types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { QUERIES } from "../constants"
import AdministrationDomainForm, { DomainForm } from "./AdministrationDomainForm"

export type EditDomainButtonProps = PropsWithRenderItem<{
  domain: Domain
}>

export default function EditDomainButton(props: EditDomainButtonProps) {
  const { domain, renderItem } = props
  const { t } = useTranslation()
  const toast = useToast()
  const queryClient = useQueryClient()
  const dialog = useFormDialogWithMutation()

  const defaultValues = useMemo(
    () => ({
      name: domain?.name,
      description: domain?.description,
      ipAddress: domain?.ipAddress,
    }),
    [domain]
  )

  const form = useForm<DomainForm>({
    mode: "onChange",
    defaultValues,
  })

  const mutation = useMutation({
    mutationKey: MUTATIONS.ADMIN_DOMAIN_UPDATE,
    mutationFn: async (payload: Partial<Domain>) => api.admin.updateDomain(domain?.id, payload),
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  const open = () => {
    const dialogRef = dialog.open(MUTATIONS.ADMIN_DOMAIN_UPDATE, {
      title: t("editDomain"),
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
          title: t("success"),
          description: t("domainHasBeenSuccessfullyUpdated", {
            name: values.name,
          }),
        })

        queryClient.invalidateQueries({ queryKey: [QUERIES.ADMIN_DEVICE_DOMAINS] })
      },
      onCancel() {
        form.reset()
      },
      submitButton: {
        label: t("applyChanges"),
      },
    })
  }

  return renderItem(open)
}
