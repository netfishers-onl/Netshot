import api from "@/api"
import { NetshotError } from "@/api/httpClient"
import { MUTATIONS } from "@/constants"
import { useFormDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { Domain } from "@/types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import React from "react"
import { QUERIES } from "../constants"
import DomainFormComponent, { DomainForm } from "./DomainForm"

export type EditDomainTriggerProps = { domain: Domain; children: React.ReactElement<any> } & Record<string, unknown>

export default function EditDomainTrigger({ domain, children, ...rest }: EditDomainTriggerProps) {
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

  useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues])

  const mutation = useMutation({
    mutationKey: MUTATIONS.ADMIN_DOMAIN_UPDATE,
    mutationFn: async (payload: Partial<Domain>) => api.admin.updateDomain(domain?.id, payload),
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  const open = () => {
    const dialogRef = dialog.open(MUTATIONS.ADMIN_DOMAIN_UPDATE, {
      title: t("domain.edit"),
      description: <DomainFormComponent />,
      form,
      size: "lg",
      async onSubmit(values: DomainForm) {
        await mutation.mutateAsync({
          name: values.name,
          description: values.description,
          ipAddress: values.ipAddress,
        })

        dialogRef.close()
        form.reset()

        toast.success({
          title: t("common.success"),
          description: t("domain.successfullyUpdated", {
            name: values.name,
          }),
        })

        queryClient.invalidateQueries({ queryKey: [QUERIES.ADMIN_DEVICE_DOMAINS] })
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
