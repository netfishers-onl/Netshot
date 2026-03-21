import api, { UpdateDevicePayload } from "@/api"
import { NetshotError } from "@/api/httpClient"
import { QUERIES as GLOBAL_QUERIES, MUTATIONS } from "@/constants"
import { useConfirmDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { Device, PropsWithRenderItem, SimpleDevice } from "@/types"
import { Text } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { QUERIES } from "../constants"

export type DeviceEnableButtonProps = PropsWithRenderItem<{
  devices: SimpleDevice[] | Device[]
}>

export default function DeviceEnableButton(props: DeviceEnableButtonProps) {
  const { devices, renderItem } = props
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const toast = useToast()
  const dialog = useConfirmDialogWithMutation()

  const mutation = useMutation({
    mutationKey: MUTATIONS.DEVICE_UPDATE,
    mutationFn: async (payload: Partial<UpdateDevicePayload>) =>
      api.device.update(payload.id, payload),
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  const isMultiple = devices.length > 1

  const open = () => {
    const dialogRef = dialog.open(MUTATIONS.DEVICE_UPDATE, {
      title: t(isMultiple ? "enableDevices" : "enableDevice"),
      description: (
        <>
          {isMultiple ? (
            <>
              <Text>
                {t("youAreAboutToEnableTheDevices", {
                  names: devices.map((device) => device.name).join(", "),
                })}
              </Text>
            </>
          ) : (
            <>
              <Text>
                {t("youAreAboutToEnableTheDevice", {
                  deviceName: devices?.[0]?.name,
                  deviceIp: devices?.[0]?.mgmtAddress || t("nA"),
                })}
              </Text>
            </>
          )}
        </>
      ),
      async onConfirm() {
        for (const device of devices) {
          await mutation.mutateAsync({
            id: device?.id,
            enabled: true,
          })
        }

        queryClient.invalidateQueries({
          queryKey: [GLOBAL_QUERIES.DEVICE_LIST],
          refetchType: "all",
        })

        queryClient.invalidateQueries({ queryKey: [QUERIES.DEVICE_DETAIL] })

        dialogRef.close()
      },
      confirmButton: {
        label: t(isMultiple ? "enableAll" : "enable"),
      },
    })
  }

  return renderItem(open)
}
