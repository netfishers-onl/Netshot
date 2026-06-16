import React, { MouseEvent } from "react"
import api from "@/api"
import { NetshotError } from "@/api/httpClient"
import { MUTATIONS, QUERIES } from "@/constants"
import { useConfirmDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { Group } from "@/types"
import { Alert, Stack, Text } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Trans, useTranslation } from "react-i18next"

export type RemoveGroupTriggerProps = { group: Group; children: React.ReactElement<any> } & Record<string, unknown>

export default function RemoveGroupTrigger({ group, children, ...rest }: RemoveGroupTriggerProps) {
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
      title: t("group.remove"),
      description: (
        <Stack gap="5">
          <Text>
            <Trans
              t={t}
              i18nKey="group.aboutToRemove"
              values={{ name: group.name }}
              components={{ bold: <Text as="span" fontWeight="semibold" /> }}
            />
          </Text>
          <Alert.Root color="yellow.900" status="warning">
            {t("group.removeWarning")}
          </Alert.Root>
        </Stack>
      ),
      async onConfirm() {
        await mutation.mutateAsync(group.id)
        queryClient.invalidateQueries({ queryKey: [QUERIES.DEVICE_GROUPS] })
        dialogRef.close()
      },
      confirmButton: {
        label: t("common.remove"),
        props: {
          colorPalette: "red",
        },
      },
    })
  }

  const isMenuItem = "value" in children.props
  return React.cloneElement(children, isMenuItem ? { onSelect: open, ...rest } : { ...rest, onClick: open })
}
