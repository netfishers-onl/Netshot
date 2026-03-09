import { useAlertDialog } from "@/dialog"
import { Device, PropsWithRenderItem, SimpleDevice } from "@/types"
import { MouseEvent } from "react"
import { useTranslation } from "react-i18next"
import DeviceScriptView from "./DeviceScriptView"

export type DeviceRunScriptButtonProps = PropsWithRenderItem<{
  devices: SimpleDevice[] | Device[]
}>

export default function DeviceRunScriptButton(props: DeviceRunScriptButtonProps) {
  const { devices, renderItem } = props
  const { t } = useTranslation()
  const dialog = useAlertDialog()

  const open = (evt: MouseEvent) => {
    evt?.stopPropagation()
    dialog.open({
      title: t("Run device script"),
      description: <DeviceScriptView devices={devices} />,
      hideFooter: true,
      variant: "full-floating",
    })
  }

  return renderItem(open)
}
