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

  return React.cloneElement(children, { onClick: open, onSelect: open, ...rest })
}
