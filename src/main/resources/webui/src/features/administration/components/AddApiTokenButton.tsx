import api from "@/api"
import { NetshotError } from "@/api/httpClient"
import { MUTATIONS } from "@/constants"
import { useFormDialogWithMutation } from "@/dialog"
import { useToast, useUserLevelOptions } from "@/hooks"
import { ApiToken, PropsWithRenderItem } from "@/types"
import { generateToken } from "@/utils"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { QUERIES } from "../constants"
import AdministrationApiTokenForm, { ApiTokenForm } from "./AdministrationApiTokenForm"

export type AddApiTokenButtonProps = PropsWithRenderItem

export default function AddApiTokenButton(props: AddApiTokenButtonProps) {
  const { renderItem } = props
  const { t } = useTranslation()
  const toast = useToast()
  const queryClient = useQueryClient()
  const userLevelOptions = useUserLevelOptions()
  const dialog = useFormDialogWithMutation()

  const form = useForm<ApiTokenForm>({
    mode: "onChange",
    defaultValues: {
      description: "",
      level: userLevelOptions.getFirst().value?.toString(),
      token: generateToken(),
    },
  })

  const mutation = useMutation({
    mutationKey: MUTATIONS.ADMIN_API_TOKEN_CREATE,
    mutationFn: async (payload: Partial<ApiToken>) => api.admin.createApiToken(payload),
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  useEffect(() => {
    return () => form.reset()
  }, [form])

  const open = () => {
    const dialogRef = dialog.open(MUTATIONS.ADMIN_API_TOKEN_CREATE, {
      title: t("api.create"),
      description: <AdministrationApiTokenForm />,
      form,
      size: "lg",
      async onSubmit(values) {
        await mutation.mutateAsync({
          description: values.description,
          level: +values.level,
          token: values.token,
        })

        dialogRef.close()

        toast.success({
          title: t("common.success"),
          description: t("api.successfullyCreated"),
        })

        queryClient.invalidateQueries({ queryKey: [QUERIES.ADMIN_API_TOKENS] })

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

  return renderItem(open)
}
