import { useCustomDialog } from "@/dialog"
import { Rule } from "@/types"
import { MouseEvent } from "react"
import React from "react"
import EditRuleExemptedDeviceDialog from "./EditRuleExemptedDeviceDialog"

export type EditRuleExemptedDeviceTriggerProps = { policyId: number; rule: Rule; children: React.ReactElement<any> } & Record<string, unknown>

export default function EditRuleExemptedDeviceTrigger({ policyId, rule, children, ...rest }: EditRuleExemptedDeviceTriggerProps) {
  const dialog = useCustomDialog()

  function open(evt?: MouseEvent<HTMLButtonElement>) {
    evt?.stopPropagation()

    dialog.open(<EditRuleExemptedDeviceDialog policyId={policyId} rule={rule} />)
  }

  // Menu.Item already triggers `onClick` internally to fire `onSelect`, so binding
  // both to the same handler would call it twice; pick the one the child understands.
  const isMenuItem = "value" in children.props
  return React.cloneElement(children, isMenuItem ? { onSelect: open, ...rest } : { ...rest, onClick: open })
}
