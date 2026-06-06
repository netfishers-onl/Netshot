import { useCustomDialog } from "@/dialog"
import { PropsWithRenderItem } from "@/types"
import AddDiagnosticDialog from "./AddDiagnosticDialog"

export default function AddDiagnosticButton(props: PropsWithRenderItem) {
  const { renderItem } = props
  const dialog = useCustomDialog()

  return renderItem((evt) => {
    evt?.stopPropagation()

    dialog.open(<AddDiagnosticDialog />, {
      size: "xl",
    })
  })
}
