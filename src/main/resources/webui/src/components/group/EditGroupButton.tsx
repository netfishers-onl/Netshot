import { useCustomDialog } from "@/dialog"
import { Group, PropsWithRenderItem } from "@/types"
import { MouseEvent } from "react"
import EditGroupDialog from "./EditGroupDialog"

export type EditGroupButtonProps = PropsWithRenderItem<{
  group: Group
}>

export default function EditGroupButton(props: EditGroupButtonProps) {
  const { group, renderItem } = props
  const dialog = useCustomDialog()

  return renderItem((evt: MouseEvent<HTMLButtonElement>) => {
    evt?.stopPropagation()
    dialog.open(<EditGroupDialog group={group} />)
  })
}
