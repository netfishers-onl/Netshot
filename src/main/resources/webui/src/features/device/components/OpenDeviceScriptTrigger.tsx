import { useAlertDialog } from "@/dialog"
import { Device, SimpleDevice } from "@/types"
import { MouseEvent } from "react"
import { useTranslation } from "react-i18next"
import React from "react"
import DeviceScriptView from "./DeviceScriptView"

export type OpenDeviceScriptTriggerProps = { devices: SimpleDevice[] | Device[]; children: React.ReactElement<any> } & Record<string, unknown>

export default function OpenDeviceScriptTrigger({ devices, children, ...rest }: OpenDeviceScriptTriggerProps) {
  const { t } = useTranslation()
  const dialog = useAlertDialog()

  const open = (evt: MouseEvent) => {
    evt?.stopPropagation()
    dialog.open({
      title: t("device.runScript"),
      description: <DeviceScriptView devices={devices} />,
      hideFooter: true,
      variant: "full-floating",
    })
  }

  const isMenuItem = "value" in children.props
  return React.cloneElement(children, isMenuItem ? { onSelect: open, ...rest } : { ...rest, onClick: open })
}
