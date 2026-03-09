import { useCustomDialog } from "@/dialog"
import { Policy, PropsWithRenderItem } from "@/types"
import { MouseEvent } from "react"
import AddRuleDialog from "./AddRuleDialog"

export type AddRuleButtonProps = PropsWithRenderItem<{
  policy: Policy
}>

export default function AddRuleButton(props: AddRuleButtonProps) {
  const { policy, renderItem } = props

  const dialog = useCustomDialog()

  function openDialog(evt: MouseEvent) {
    evt?.stopPropagation()

    dialog.open(<AddRuleDialog policy={policy} />, {
      size: "xl",
    })
  }

  return renderItem(openDialog)
}
