import { useCustomDialog } from "@/dialog"
import React from "react"
import Slot from "@/components/Slot"
import { TaskType } from "@/types"
import AddTaskDialog from "./AddTaskDialog"

export type AddTaskTriggerProps = {
  children: React.ReactElement<Record<string, unknown>>
  initialType?: TaskType
} & Record<string, unknown>

export default function AddTaskTrigger({ children, initialType, ...rest }: AddTaskTriggerProps) {
  const dialog = useCustomDialog()

  const open = (evt?: React.MouseEvent) => {
    evt?.stopPropagation()

    dialog.open(<AddTaskDialog initialType={initialType} />, {
      size: initialType ? "lg" : "xl",
    })
  }

  return <Slot onTrigger={open} {...rest}>{children}</Slot>
}
