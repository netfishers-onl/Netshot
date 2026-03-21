import api from "@/api"
import { NetshotError } from "@/api/httpClient"
import { MUTATIONS } from "@/constants"
import { useConfirmDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { PropsWithRenderItem, User } from "@/types"
import { Text } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { MouseEvent } from "react"
import { useTranslation } from "react-i18next"
import { QUERIES } from "../constants"

export type RemoveUserButtonProps = PropsWithRenderItem<{
  user: User
}>

export default function RemoveUserButton(props: RemoveUserButtonProps) {
  const { user, renderItem } = props
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const toast = useToast()
  const dialog = useConfirmDialogWithMutation()

  const mutation = useMutation({
    mutationKey: MUTATIONS.ADMIN_USER_REMOVE,
    mutationFn: async () => api.admin.removeUser(user?.id),
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  const open = (evt: MouseEvent) => {
    evt?.stopPropagation()
    const dialogRef = dialog.open(MUTATIONS.ADMIN_USER_REMOVE, {
      title: t("removeUser"),
      description: (
        <Text>
          {t("youAreAboutToRemoveTheUser", {
            username: user?.username,
          })}
        </Text>
      ),
      async onConfirm() {
        await mutation.mutateAsync()
        queryClient.invalidateQueries({ queryKey: [QUERIES.ADMIN_USERS] })
        dialogRef.close()
      },
      confirmButton: {
        label: t("remove2"),
        props: {
          colorPalette: "red",
        },
      },
    })
  }

  return renderItem(open)
}
