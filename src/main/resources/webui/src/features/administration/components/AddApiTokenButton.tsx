import api from "@/api"
import { NetshotError } from "@/api/httpClient"
import { MUTATIONS } from "@/constants"
import { useFormDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { ApiToken, PropsWithRenderItem } from "@/types"
import { generateToken } from "@/utils"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { QUERIES } from "../constants"
import { useApiTokenLevelOptions } from "../hooks"
import AdministrationApiTokenForm, { ApiTokenForm } from "./AdministrationApiTokenForm"

export type AddApiTokenButtonProps = PropsWithRenderItem

export default function AddApiTokenButton(props: AddApiTokenButtonProps) {
  const { renderItem } = props
  const { t } = useTranslation()
  const toast = useToast()
  const queryClient = useQueryClient()
  const apiTokenLevelOptions = useApiTokenLevelOptions()
  const dialog = useFormDialogWithMutation()

  const form = useForm<ApiTokenForm>({
    mode: "onChange",
    defaultValues: {
      description: "",
      level: apiTokenLevelOptions.getFirst().value?.toString(),
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
      title: t("Create API token"),
      description: <AdministrationApiTokenForm />,
      form,
      size: "xl",
      async onSubmit(values) {
        await mutation.mutateAsync({
          description: values.description,
          level: +values.level,
          token: values.token,
        })

        dialogRef.close()

        toast.success({
          title: t("Success"),
          description: t("Api token has been successfully created"),
        })

        queryClient.invalidateQueries({ queryKey: [QUERIES.ADMIN_API_TOKENS] })

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
