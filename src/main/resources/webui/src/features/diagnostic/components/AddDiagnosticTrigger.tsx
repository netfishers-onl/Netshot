import { useCustomDialog } from "@/dialog"
import AddDiagnosticDialog from "./AddDiagnosticDialog"
import React from "react"

export type AddDiagnosticTriggerProps = { children: React.ReactElement<any> } & Record<string, unknown>

export default function AddDiagnosticTrigger({ children, ...rest }: AddDiagnosticTriggerProps) {
  const dialog = useCustomDialog()

  const open = (evt?: React.MouseEvent) => {
    evt?.stopPropagation()

    dialog.open(<AddDiagnosticDialog />, {
      size: "xl",
    })
  }

  const isMenuItem = "value" in children.props
  return React.cloneElement(children, isMenuItem ? { onSelect: open, ...rest } : { ...rest, onClick: open })
}
