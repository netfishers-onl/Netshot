import React, { MouseEvent } from "react"
import Slot from "@/components/Slot"
import { useCustomDialog } from "@/dialog"
import AddGroupDialog from "./AddGroupDialog"

export type AddGroupTriggerProps = { children: React.ReactElement<Record<string, unknown>> } & Record<string, unknown>

export default function AddGroupTrigger({ children, ...rest }: AddGroupTriggerProps) {
  const dialog = useCustomDialog()

  const open = (evt?: MouseEvent<HTMLButtonElement>) => {
    evt?.stopPropagation()
    dialog.open(<AddGroupDialog />)
  }

  return <Slot onTrigger={open} {...rest}>{children}</Slot>
}
