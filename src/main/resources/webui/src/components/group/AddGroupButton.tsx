import { useCustomDialog } from "@/dialog"
import { PropsWithRenderItem } from "@/types"
import { MouseEvent } from "react"
import AddGroupDialog from "./AddGroupDialog"

export type AddGroupButtonProps = PropsWithRenderItem

export default function AddGroupButton(props: AddGroupButtonProps) {
  const { renderItem } = props
  const dialog = useCustomDialog()

  return renderItem((evt?: MouseEvent<HTMLButtonElement>) => {
    evt?.stopPropagation()

    dialog.open(<AddGroupDialog />)
  })
}
