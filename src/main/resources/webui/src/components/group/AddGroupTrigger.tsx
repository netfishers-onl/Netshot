import React, { MouseEvent } from "react"
import { useCustomDialog } from "@/dialog"
import AddGroupDialog from "./AddGroupDialog"

export type AddGroupTriggerProps = { children: React.ReactElement<any> } & Record<string, unknown>

export default function AddGroupTrigger({ children, ...rest }: AddGroupTriggerProps) {
  const dialog = useCustomDialog()

  const open = (evt?: MouseEvent<HTMLButtonElement>) => {
    evt?.stopPropagation()
    dialog.open(<AddGroupDialog />)
  }

  const isMenuItem = "value" in children.props
  return React.cloneElement(children, isMenuItem ? { onSelect: open, ...rest } : { ...rest, onClick: open })
}
