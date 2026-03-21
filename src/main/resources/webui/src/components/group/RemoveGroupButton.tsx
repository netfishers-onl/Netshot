import api from "@/api"
import { NetshotError } from "@/api/httpClient"
import { MUTATIONS, QUERIES } from "@/constants"
import { useConfirmDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { Group, PropsWithRenderItem } from "@/types"
import { Alert, Stack, Text } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { MouseEvent } from "react"
import { Trans, useTranslation } from "react-i18next"

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
      title: t("removeGroup"),
      description: (
        <Stack gap="5">
          <Text>
            <Trans
              t={t}
              i18nKey="youAreAboutToRemoveTheGroup"
              values={{ name: group.name }}
              components={{ bold: <Text as="span" fontWeight="semibold" /> }}
            />
          </Text>
          <Alert.Root color="yellow.900" status="warning">
            {t(
              "theRelatedSoftwareAndHardwareComplianceRulesAndTheGroupSpeci"
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
        label: t("remove2"),
        props: {
          colorPalette: "red",
        },
      },
    })
  }

  return renderItem(open)
}
