import { useCustomDialog } from "@/dialog"
import React from "react"
import AddTaskDialog from "./AddTaskDialog"

export type AddTaskTriggerProps = { children: React.ReactElement<any> } & Record<string, unknown>

export default function AddTaskTrigger({ children, ...rest }: AddTaskTriggerProps) {
  const dialog = useCustomDialog()

  const open = (evt?: React.MouseEvent) => {
    evt?.stopPropagation()

    dialog.open(<AddTaskDialog />, {
      size: "xl",
    })
  }

  const isMenuItem = "value" in children.props
  return React.cloneElement(children, isMenuItem ? { onSelect: open, ...rest } : { ...rest, onClick: open })
}
