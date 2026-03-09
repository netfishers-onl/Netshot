import { useCustomDialog } from "@/dialog"
import { PropsWithRenderItem } from "@/types"
import DiagnosticAddDialog from "./DiagnosticAddDialog"

export default function DiagnosticAddButton(props: PropsWithRenderItem) {
  const { renderItem } = props
  const dialog = useCustomDialog()

  return renderItem((evt) => {
    evt?.stopPropagation()

    dialog.open(<DiagnosticAddDialog />, {
      size: "xl",
    })
  })
}
