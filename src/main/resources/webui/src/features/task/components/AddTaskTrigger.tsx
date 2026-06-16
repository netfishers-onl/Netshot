import { useCustomDialog } from "@/dialog"
import React from "react"
import AddTaskDialog from "./AddTaskDialog"

export type AddTaskTriggerProps = { children: React.ReactElement<any> } & Record<string, unknown>

export default function AddTaskTrigger({ children, ...rest }: AddTaskTriggerProps) {
  const dialog = useCustomDialog()

  const open = (evt?: React.MouseEvent) => {
    evt?.stopPropagation()

    dialog.open(<AddTaskDialog />)
  }

  return React.cloneElement(children, { onClick: open, onSelect: open, ...rest })
}
