import { useCustomDialog } from "@/dialog"
import { PropsWithRenderItem } from "@/types"
import HardwareDeviceListDialog from "./HardwareDeviceListDialog"

export type HardwareDeviceListButtonProps = PropsWithRenderItem<{
  type: "eos" | "eol"
  date: number
}>

export default function HardwareDeviceListButton(props: HardwareDeviceListButtonProps) {
  const { type, date, renderItem } = props
  const dialog = useCustomDialog()

  return renderItem((evt) => {
    evt?.stopPropagation()
    dialog.open(<HardwareDeviceListDialog type={type} date={date} />)
  })
}
