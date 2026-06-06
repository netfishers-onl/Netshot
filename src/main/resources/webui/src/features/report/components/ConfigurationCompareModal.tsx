import { useAlertDialog } from "@/dialog"
import { LightConfig, PropsWithRenderItem } from "@/types"
import { MouseEvent } from "react"
import ConfigurationCompareEditor from "./ConfigurationCompareEditor"

type ConfigurationCompareModalProps = PropsWithRenderItem<{
  config: LightConfig
}>

export default function ConfigurationCompareModal(
  props: ConfigurationCompareModalProps
) {
  const { renderItem, config } = props
  const dialog = useAlertDialog()

  const open = (evt: MouseEvent) => {
    evt?.stopPropagation()
    dialog.open({
      title: "compareChanges",
      description: <ConfigurationCompareEditor config={config} />,
      hideFooter: true,
      variant: "full-floating",
    })
  }

  return renderItem(open)
}
