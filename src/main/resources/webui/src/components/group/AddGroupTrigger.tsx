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

  return React.cloneElement(children, { onClick: open, onSelect: open, ...rest })
}
