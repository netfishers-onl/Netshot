import { useCustomDialog } from "@/dialog"
import { Policy } from "@/types"
import { MouseEvent } from "react"
import React from "react"
import AddRuleDialog from "./AddRuleDialog"

export type AddRuleTriggerProps = { policy: Policy; children: React.ReactElement<any> } & Record<string, unknown>

export default function AddRuleTrigger({ policy, children, ...rest }: AddRuleTriggerProps) {
  const dialog = useCustomDialog()

  function open(evt: MouseEvent) {
    evt?.stopPropagation()

    dialog.open(<AddRuleDialog policy={policy} />, {
      size: "xl",
    })
  }

  return React.cloneElement(children, { onClick: open, onSelect: open, ...rest })
}
