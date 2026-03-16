import api from "@/api"
import { NetshotError } from "@/api/httpClient"
import { MUTATIONS } from "@/constants"
import { useConfirmDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { CredentialSet, PropsWithRenderItem } from "@/types"
import { Text } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { MouseEvent } from "react"
import { Trans, useTranslation } from "react-i18next"
import { QUERIES } from "../constants"

export type RemoveDeviceCredentialButtonProps = PropsWithRenderItem<{
  credential: CredentialSet
}>

export default function RemoveDeviceCredentialButton(props: RemoveDeviceCredentialButtonProps) {
  const { credential, renderItem } = props
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const toast = useToast()
  const dialog = useConfirmDialogWithMutation()

  const mutation = useMutation({
    mutationKey: MUTATIONS.ADMIN_CREDENTIAL_SET_REMOVE,
    mutationFn: async () => api.admin.removeCredentialSet(credential?.id),
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  const open = (evt: MouseEvent) => {
    evt?.stopPropagation()
    const dialogRef = dialog.open(MUTATIONS.ADMIN_CREDENTIAL_SET_REMOVE, {
      title: t("Remove credential"),
      description: (
        <Trans
          i18nKey="You are about to remove the credential <bold>{{name}}</bold>, are you sure?"
          values={{ name: credential.name }}
          components={{ bold: <Text as="span" fontWeight="semibold" /> }}
        />
      ),
      async onConfirm() {
        await mutation.mutateAsync()
        queryClient.invalidateQueries({ queryKey: [QUERIES.ADMIN_DEVICE_CREDENTIALS] })
        dialogRef.close()

        toast.success({
          title: t("Success"),
          description: t("Device credential {{name}} has been successfully removed", {
            name: credential?.name,
          }),
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
