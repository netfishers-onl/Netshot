import api from "@/api"
import { NetshotError } from "@/api/httpClient"
import { MUTATIONS } from "@/constants"
import { useConfirmDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { ApiToken, PropsWithRenderItem } from "@/types"
import { Text } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { MouseEvent } from "react"
import { useTranslation } from "react-i18next"
import { QUERIES } from "../constants"

export type RemoveApiTokenButtonProps = PropsWithRenderItem<{
  apiToken: ApiToken
}>

export default function RemoveApiTokenButton(props: RemoveApiTokenButtonProps) {
  const { apiToken, renderItem } = props
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const toast = useToast()
  const dialog = useConfirmDialogWithMutation()

  const mutation = useMutation({
    mutationKey: MUTATIONS.ADMIN_API_TOKEN_REMOVE,
    mutationFn: async () => api.admin.removeApiToken(apiToken.id),
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  const open = (evt: MouseEvent) => {
    evt?.stopPropagation()
    const dialogRef = dialog.open(MUTATIONS.ADMIN_API_TOKEN_REMOVE, {
      title: t("Remove API token"),
      description: (
        <Text>
          {t("You are about to remove the API token ")}

          <Text as="span" fontWeight="semibold">
            {t("{{description}}", {
              description: apiToken.description,
            })}
          </Text>

          {t(", are you sure?")}
        </Text>
      ),
      async onConfirm() {
        await mutation.mutateAsync()
        queryClient.invalidateQueries({ queryKey: [QUERIES.ADMIN_API_TOKENS] })

        dialogRef.close()

        toast.success({
          title: t("Success"),
          description: t("Api token has been successfully removed"),
        })
      },
      confirmButton: {
        label: t("Remove"),
        props: {
          colorPalette: "red",
        },
      },
    })
  }

  return renderItem(open)
}
