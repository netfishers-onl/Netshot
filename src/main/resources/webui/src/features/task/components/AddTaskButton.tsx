import { useCustomDialog } from "@/dialog"
import { PropsWithRenderItem } from "@/types"
import AddTaskDialog from "./AddTaskDialog"

export default function AddTaskButton(props: PropsWithRenderItem) {
  const { renderItem } = props
  const dialog = useCustomDialog()

  return renderItem((evt) => {
    evt?.stopPropagation()

    dialog.open(<AddTaskDialog />)
  })
}
