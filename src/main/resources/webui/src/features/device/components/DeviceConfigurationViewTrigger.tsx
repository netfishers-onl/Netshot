import { useTranslation } from "react-i18next"
import { useAlertDialog } from "@/dialog"
import { ConfigLongTextAttribute, DeviceAttributeDefinition } from "@/types"
import React from "react"
import DeviceConfigurationView from "./DeviceConfigurationView"

export type DeviceConfigurationViewTriggerProps = {
  id: number
  attribute: ConfigLongTextAttribute
  definition: DeviceAttributeDefinition
  children: React.ReactElement<any>
} & Record<string, unknown>

export default function DeviceConfigurationViewTrigger({ id, attribute, definition, children, ...rest }: DeviceConfigurationViewTriggerProps) {
  const { t } = useTranslation()
  const dialog = useAlertDialog()

  const open = () => {
    dialog.open({
      title: t(definition?.title),
      description: <DeviceConfigurationView id={id} attribute={attribute} />,
      size: "xl",
    })
  }

  return React.cloneElement(children, { onClick: open, onSelect: open, ...rest })
}
