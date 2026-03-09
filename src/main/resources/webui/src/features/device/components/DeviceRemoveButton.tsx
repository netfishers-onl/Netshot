import api from "@/api"
import { NetshotError } from "@/api/httpClient"
import { MUTATIONS, QUERIES } from "@/constants"
import { useConfirmDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { Device, PropsWithRenderItem, SimpleDevice } from "@/types"
import { Text } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import { QUERIES as DEVICE_QUERIES } from "../constants"

export type DeviceRemoveButtonProps = PropsWithRenderItem<{
  devices: SimpleDevice[] | Device[]
}>

export default function DeviceRemoveButton(props: DeviceRemoveButtonProps) {
  const { devices, renderItem } = props
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const toast = useToast()
  const navigate = useNavigate()
  const dialog = useConfirmDialogWithMutation()

  const mutation = useMutation({
    mutationKey: MUTATIONS.DEVICE_REMOVE,
    mutationFn: async (id: number) => api.device.remove(id),
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  const isMultiple = devices.length > 1

  const open = () => {
    const dialogRef = dialog.open(MUTATIONS.DEVICE_REMOVE, {
      title: t(isMultiple ? "Remove selected devices" : "Remove device"),
      description: (
        <>
          {isMultiple ? (
            <>
              {t("You are about to remove the devices {{names}}", {
                names: devices.map((device) => device.name).join(", "),
              })}
            </>
          ) : (
            <>
              <Text>
                {t("You are about to remove the device {{deviceName}}", {
                  deviceName: devices?.[0]?.name,
                })}{" "}
                <Text as="span">
                  {t("({{deviceIp}})", {
                    deviceIp: devices?.[0]?.mgmtAddress || t("N/A"),
                  })}
                </Text>
              </Text>
            </>
          )}
        </>
      ),
      async onConfirm() {
        for await (const device of devices) {
          await mutation.mutateAsync(device.id)
        }

        navigate("/app/devices")

        queryClient.invalidateQueries({ queryKey: [QUERIES.DEVICE_LIST] })
        queryClient.invalidateQueries({ queryKey: [DEVICE_QUERIES.DEVICE_SEARCH_LIST] })

        dialogRef.close()
      },
      confirmButton: {
        label: t(isMultiple ? "Remove all" : "remove"),
        props: {
          colorPalette: "red",
        },
      },
    })
  }

  return renderItem(open)
}
