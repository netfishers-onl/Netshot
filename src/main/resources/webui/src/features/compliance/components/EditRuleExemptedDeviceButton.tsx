import { useCustomDialog } from "@/dialog"
import { PropsWithRenderItem, Rule } from "@/types"
import { MouseEvent } from "react"
import EditRuleExemptedDeviceDialog from "./EditRuleExemptedDeviceDialog"

export type EditRuleExemptedDeviceButtonProps = PropsWithRenderItem<{
  policyId: number
  rule: Rule
}>

export default function EditRuleExemptedDeviceButton(props: EditRuleExemptedDeviceButtonProps) {
  const { policyId, rule, renderItem } = props
  const dialog = useCustomDialog()

  function open(evt?: MouseEvent<HTMLButtonElement>) {
    evt?.stopPropagation()

    dialog.open(<EditRuleExemptedDeviceDialog policyId={policyId} rule={rule} />)
  }

  return renderItem(open)
}
