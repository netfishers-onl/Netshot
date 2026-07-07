import { useAlertDialog } from "@/dialog"
import { LightConfig } from "@/types"
import React, { MouseEvent } from "react"
import ConfigurationCompareEditor from "./ConfigurationCompareEditor"

export type ConfigurationCompareDialogProps = { config: LightConfig; children: React.ReactElement<any> } & Record<string, unknown>

export default function ConfigurationCompareDialog({ config, children, ...rest }: ConfigurationCompareDialogProps) {
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

  const isMenuItem = "value" in children.props
  return React.cloneElement(children, isMenuItem ? { onSelect: open, ...rest } : { ...rest, onClick: open })
}
