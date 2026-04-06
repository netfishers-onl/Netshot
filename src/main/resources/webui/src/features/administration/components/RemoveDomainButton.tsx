import api from "@/api"
import { NetshotError } from "@/api/httpClient"
import { MUTATIONS } from "@/constants"
import { useConfirmDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { Domain, PropsWithRenderItem } from "@/types"
import { Text } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { MouseEvent, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { QUERIES } from "../constants"

export type RemoveDomainButtonProps = PropsWithRenderItem<{
  domain: Domain
}>

export default function RemoveDomainButton(props: RemoveDomainButtonProps) {
  const { domain, renderItem } = props
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const toast = useToast()
  const dialog = useConfirmDialogWithMutation()

  const mutation = useMutation({
    mutationKey: MUTATIONS.ADMIN_DOMAIN_REMOVE,
    mutationFn: async () => api.admin.removeDomain(domain?.id),
    onError(err: NetshotError) {
      console.log(err)
      toast.error(err)
    },
  })

  const open = useCallback(
    (evt: MouseEvent) => {
      evt?.stopPropagation()
      const dialogRef = dialog.open(MUTATIONS.ADMIN_DOMAIN_REMOVE, {
        title: t("removeDomain"),
        description: (
          <Text>
            {t("youAreAboutToRemoveTheDomain", {
              name: domain?.name,
            })}
          </Text>
        ),
        async onConfirm() {
          await mutation.mutateAsync()
          queryClient.invalidateQueries({ queryKey: [QUERIES.ADMIN_DEVICE_DOMAINS] })
          dialogRef.close()
        },
        confirmButton: {
          label: t("remove"),
          props: {
            colorPalette: "red",
          },
        },
      })
    },
    [dialog]
  )

  return renderItem(open)
}
