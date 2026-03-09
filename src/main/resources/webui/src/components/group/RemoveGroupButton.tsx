import api from "@/api"
import { NetshotError } from "@/api/httpClient"
import { MUTATIONS, QUERIES } from "@/constants"
import { useConfirmDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { Group, PropsWithRenderItem } from "@/types"
import { Alert, Stack, Text } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { MouseEvent } from "react"
import { useTranslation } from "react-i18next"

export type RemoveGroupButtonProps = PropsWithRenderItem<{
  group: Group
}>

export default function RemoveGroupButton(props: RemoveGroupButtonProps) {
  const { group, renderItem } = props
  const { t } = useTranslation()
  const toast = useToast()
  const queryClient = useQueryClient()
  const dialog = useConfirmDialogWithMutation()

  const mutation = useMutation({
    mutationKey: MUTATIONS.GROUP_REMOVE,
    mutationFn: api.group.remove,
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  const open = (e: MouseEvent) => {
    e.stopPropagation()
    const dialogRef = dialog.open(MUTATIONS.GROUP_REMOVE, {
      title: t("Remove group"),
      description: (
        <Stack gap="5">
          <Text>
            {t(`You are about to remove the group`)}{" "}
            <Text as="span" fontWeight="semibold">
              {group.name}
            </Text>
          </Text>
          <Alert.Root color="yellow.900" status="warning">
            {t(
              "The related software and hardware compliance rules, and the group specific tasks will be removed along with the group itself."
            )}
          </Alert.Root>
        </Stack>
      ),
      async onConfirm() {
        await mutation.mutateAsync(group.id)
        queryClient.invalidateQueries({ queryKey: [QUERIES.DEVICE_GROUPS] })
        dialogRef.close()
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
