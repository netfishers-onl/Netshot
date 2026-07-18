import { useCustomDialog } from "@/dialog"
import AddDiagnosticDialog from "./AddDiagnosticDialog"
import React from "react"
import Slot from "@/components/Slot"

export type AddDiagnosticTriggerProps = { children: React.ReactElement<Record<string, unknown>> } & Record<string, unknown>

export default function AddDiagnosticTrigger({ children, ...rest }: AddDiagnosticTriggerProps) {
  const dialog = useCustomDialog()

  const open = (evt?: React.MouseEvent) => {
    evt?.stopPropagation()

    dialog.open(<AddDiagnosticDialog />, {
      size: "xl",
    })
  }

  return <Slot onTrigger={open} {...rest}>{children}</Slot>
}
