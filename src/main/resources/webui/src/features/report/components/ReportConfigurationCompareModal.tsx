import { useAlertDialog } from "@/dialog"
import { LightConfig, PropsWithRenderItem } from "@/types"
import { MouseEvent } from "react"
import ReportConfigurationCompareEditor from "./ReportConfigurationCompareEditor"

type ReportConfigurationCompareModalProps = PropsWithRenderItem<{
  config: LightConfig
}>

export default function ReportConfigurationCompareModal(
  props: ReportConfigurationCompareModalProps
) {
  const { renderItem, config } = props
  const dialog = useAlertDialog()

  const open = (evt: MouseEvent) => {
    evt?.stopPropagation()
    dialog.open({
      title: "compareChanges",
      description: <ReportConfigurationCompareEditor config={config} />,
      hideFooter: true,
      variant: "full-floating",
    })
  }

  return renderItem(open)
}
