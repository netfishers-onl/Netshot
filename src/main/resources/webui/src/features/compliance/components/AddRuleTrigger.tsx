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

  // Menu.Item already triggers `onClick` internally to fire `onSelect`, so binding
  // both to the same handler would call it twice; pick the one the child understands.
  const isMenuItem = "value" in children.props
  return React.cloneElement(children, isMenuItem ? { onSelect: open, ...rest } : { ...rest, onClick: open })
}
