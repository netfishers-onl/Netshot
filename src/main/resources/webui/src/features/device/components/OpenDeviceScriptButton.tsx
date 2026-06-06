import { useAlertDialog } from "@/dialog"
import { Device, PropsWithRenderItem, SimpleDevice } from "@/types"
import { MouseEvent } from "react"
import { useTranslation } from "react-i18next"
import DeviceScriptView from "./DeviceScriptView"

export type OpenDeviceScriptButtonProps = PropsWithRenderItem<{
  devices: SimpleDevice[] | Device[]
}>

export default function OpenDeviceScriptButton(props: OpenDeviceScriptButtonProps) {
  const { devices, renderItem } = props
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

  return renderItem(open)
}
