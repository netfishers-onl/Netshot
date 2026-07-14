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

export type EnableDeviceTriggerProps = { devices: SimpleDevice[] | Device[]; children: React.ReactElement<any> } & Record<string, unknown>

export default function EnableDeviceTrigger({ devices, children, ...rest }: EnableDeviceTriggerProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const toast = useToast()
  const dialog = useConfirmDialogWithMutation()

  const mutation = useMutation({
    mutationKey: MUTATIONS.DEVICE_UPDATE,
    mutationFn: async (payload: Partial<UpdateDevicePayload>) => api.device.update(payload.id, payload),
    onError(err: NetshotError) { toast.error(err) },
  })

  const isMultiple = devices.length > 1

  const open = () => {
    const dialogRef = dialog.open(MUTATIONS.DEVICE_UPDATE, {
      title: t(isMultiple ? "device.enableMultiple" : "device.enable"),
      description: (
        <>
          {isMultiple ? (
            <Text>{t("device.aboutToEnableMultiple", { names: devices.map((device) => device.name).join(", ") })}</Text>
          ) : (
            <Text>{t("device.aboutToEnable", { deviceName: devices?.[0]?.name, deviceIp: devices?.[0]?.mgmtAddress || t("common.nA") })}</Text>
          )}
        </>
      ),
      async onConfirm() {
        for (const device of devices) {
          await mutation.mutateAsync({ id: device?.id, enabled: true })
        }
        queryClient.invalidateQueries({ queryKey: [GLOBAL_QUERIES.DEVICE_LIST], refetchType: "all" })
        queryClient.invalidateQueries({ queryKey: [DEVICE_QUERIES.DEVICE_SEARCH_LIST], refetchType: "all" })
        queryClient.invalidateQueries({ queryKey: [DEVICE_QUERIES.DEVICE_DETAIL] })
        dialogRef.close()
      },
      confirmButton: {
        label: t(isMultiple ? "common.enableAll" : "common.enable"),
        props: {
          colorPalette: "green",
        },
      },
    })
  }

  const isMenuItem = "value" in children.props
  return React.cloneElement(children, isMenuItem ? { onSelect: open, ...rest } : { ...rest, onClick: open })
}
