import React, { MouseEvent } from "react"
import { useCustomDialog } from "@/dialog"
import { Group } from "@/types"
import EditGroupDialog from "./EditGroupDialog"

export type EditGroupTriggerProps = { group: Group; children: React.ReactElement<any> } & Record<string, unknown>

export default function EditGroupTrigger({ group, children, ...rest }: EditGroupTriggerProps) {
  const dialog = useCustomDialog()

  const open = (evt: MouseEvent<HTMLButtonElement>) => {
    evt?.stopPropagation()
    dialog.open(<EditGroupDialog group={group} />)
  }

  return React.cloneElement(children, { onClick: open, onSelect: open, ...rest })
}
