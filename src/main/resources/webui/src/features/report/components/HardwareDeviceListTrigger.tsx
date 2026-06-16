import { useCustomDialog } from "@/dialog"
import React from "react"
import HardwareDeviceListDialog from "./HardwareDeviceListDialog"

export type HardwareDeviceListTriggerProps = {
  type: "eos" | "eol"
  date: number
  children: React.ReactElement<any>
} & Record<string, unknown>

export default function HardwareDeviceListTrigger({ type, date, children, ...rest }: HardwareDeviceListTriggerProps) {
  const dialog = useCustomDialog()

  const open = (evt?: React.MouseEvent) => {
    evt?.stopPropagation()
    dialog.open(<HardwareDeviceListDialog type={type} date={date} />)
  }

  return React.cloneElement(children, { onClick: open, onSelect: open, ...rest })
}
