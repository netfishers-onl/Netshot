import api, { UpdateDevicePayload } from "@/api"
import { NetshotError } from "@/api/httpClient"
import { QUERIES as GLOBAL_QUERIES, MUTATIONS } from "@/constants"
import { useConfirmDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { Device, SimpleDevice } from "@/types"
import { Text } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import React from "react"
import { QUERIES as DEVICE_QUERIES } from "../constants"

export type DisableDeviceTriggerProps = { devices: SimpleDevice[] | Device[]; children: React.ReactElement<any> } & Record<string, unknown>

export default function DisableDeviceTrigger({ devices, children, ...rest }: DisableDeviceTriggerProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const toast = useToast()
  const dialog = useConfirmDialogWithMutation()

  const mutation = useMutation({
    mutationKey: MUTATIONS.DEVICE_UPDATE,
    mutationFn: async (payload: Partial<UpdateDevicePayload>) => api.device.update(payload?.id, payload),
    onError(err: NetshotError) { toast.error(err) },
  })

  const isMultiple = devices.length > 1

  const open = () => {
    const dialogRef = dialog.open(MUTATIONS.DEVICE_UPDATE, {
      title: t(isMultiple ? "device.disableMultiple" : "device.disable"),
      description: (
        <>
          {isMultiple ? (
            <Text>{t("device.aboutToDisableMultiple", { names: devices.map((device) => device.name).join(", ") })}</Text>
          ) : (
            <Text>{t("device.aboutToDisable", { deviceName: devices?.[0]?.name, deviceIp: devices?.[0]?.mgmtAddress || t("common.nA") })}</Text>
          )}
        </>
      ),
      async onConfirm() {
        for await (const device of devices) {
          await mutation.mutateAsync({ id: device?.id, enabled: false })
        }
        queryClient.invalidateQueries({ queryKey: [GLOBAL_QUERIES.DEVICE_LIST], refetchType: "all" })
        queryClient.invalidateQueries({ queryKey: [DEVICE_QUERIES.DEVICE_SEARCH_LIST], refetchType: "all" })
        queryClient.invalidateQueries({ queryKey: [DEVICE_QUERIES.DEVICE_DETAIL] })
        dialogRef.close()
      },
      confirmButton: {
        label: t(isMultiple ? "common.disableAll" : "common.disable"),
        props: { colorPalette: "red" },
      },
    })
  }

  const isMenuItem = "value" in children.props
  return React.cloneElement(children, isMenuItem ? { onSelect: open, ...rest } : { ...rest, onClick: open })
}
