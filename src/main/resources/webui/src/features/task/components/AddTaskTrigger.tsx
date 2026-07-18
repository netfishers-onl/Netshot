import { useCustomDialog } from "@/dialog"
import React from "react"
import Slot from "@/components/Slot"
import AddTaskDialog from "./AddTaskDialog"

export type AddTaskTriggerProps = { children: React.ReactElement<Record<string, unknown>> } & Record<string, unknown>

export default function AddTaskTrigger({ children, ...rest }: AddTaskTriggerProps) {
  const dialog = useCustomDialog()

  const open = (evt?: React.MouseEvent) => {
    evt?.stopPropagation()

    dialog.open(<AddTaskDialog />, {
      size: "xl",
    })
  }

  return <Slot onTrigger={open} {...rest}>{children}</Slot>
}
