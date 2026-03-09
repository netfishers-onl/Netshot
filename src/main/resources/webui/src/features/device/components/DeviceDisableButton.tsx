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

export type DeviceDisableButtonProps = PropsWithRenderItem<{
  devices: SimpleDevice[] | Device[]
}>

export default function DeviceDisableButton(props: DeviceDisableButtonProps) {
  const { devices, renderItem } = props
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const toast = useToast()
  const dialog = useConfirmDialogWithMutation()

  const mutation = useMutation({
    mutationKey: MUTATIONS.DEVICE_UPDATE,
    mutationFn: async (payload: Partial<UpdateDevicePayload>) =>
      api.device.update(payload?.id, payload),
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  const isMultiple = devices.length > 1

  const open = () => {
    const dialogRef = dialog.open(MUTATIONS.DEVICE_UPDATE, {
      title: t(isMultiple ? "Disable devices" : "Disable device"),
      description: (
        <>
          {isMultiple ? (
            <>
              <Text>
                {t("You are about to disable the devices {{names}}", {
                  names: devices.map((device) => device.name).join(", "),
                })}
              </Text>
            </>
          ) : (
            <>
              <Text>
                {t("You are about to disable the device {{deviceName}}", {
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
          await mutation.mutateAsync({
            id: device?.id,
            enabled: false,
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
        label: t(isMultiple ? "Disable all" : "Disable"),
        props: {
          colorPalette: "red",
        },
      },
    })
  }

  return renderItem(open)
}
