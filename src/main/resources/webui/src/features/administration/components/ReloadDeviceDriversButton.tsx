import api from "@/api"
import { NetshotError } from "@/api/httpClient"
import { MUTATIONS } from "@/constants"
import { useConfirmDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { PropsWithRenderItem } from "@/types"
import { Text } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { MouseEvent } from "react"
import { useTranslation } from "react-i18next"
import { QUERIES } from "../constants"

export type ReloadDeviceDriversButtonProps = PropsWithRenderItem

export default function ReloadDeviceDriversButton(props: ReloadDeviceDriversButtonProps) {
  const { renderItem } = props
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const toast = useToast()
  const dialog = useConfirmDialogWithMutation()

  const mutation = useMutation({
    mutationKey: MUTATIONS.ADMIN_DRIVER_RELOAD,
    mutationFn: async () => api.admin.getAllDrivers({}, true),
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  const open = (evt: MouseEvent) => {
    evt?.stopPropagation()
    const dialogRef = dialog.open(MUTATIONS.ADMIN_DRIVER_RELOAD, {
      title: t("Reload drivers"),
      description: (
        <>
          <Text>{t("This will dynamically reload all device drivers from source files.")}</Text>
          <Text>
            {t(
              "Use this if you have updated a driver file on Netshot server and want to apply the new code."
            )}
          </Text>
        </>
      ),
      async onConfirm() {
        await mutation.mutateAsync()

        toast.success({
          title: t("Success"),
          description: t("The drivers have been reloaded."),
        })

        queryClient.invalidateQueries({ queryKey: [QUERIES.ADMIN_DRIVERS] })
        dialogRef.close()
      },
      confirmButton: {
        label: t("Reload"),
        props: {
          colorScheme: "green",
        },
      },
    })
  }

  return renderItem(open)
}
