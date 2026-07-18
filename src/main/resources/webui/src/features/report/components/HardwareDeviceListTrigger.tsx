import { useCustomDialog } from "@/dialog"
import React from "react"
import Slot from "@/components/Slot"
import HardwareDeviceListDialog from "./HardwareDeviceListDialog"

export type HardwareDeviceListTriggerProps = {
  type: "eos" | "eol"
  date: number
  domain?: number[]
  group?: number[]
  children: React.ReactElement<Record<string, unknown>>
} & Record<string, unknown>

export default function HardwareDeviceListTrigger({
  type,
  date,
  domain,
  group,
  children,
  ...rest
}: HardwareDeviceListTriggerProps) {
  const dialog = useCustomDialog()

  const open = (evt?: React.MouseEvent) => {
    evt?.stopPropagation()
    dialog.open(<HardwareDeviceListDialog type={type} date={date} domain={domain} group={group} />)
  }

  return <Slot onTrigger={open} {...rest}>{children}</Slot>
}
