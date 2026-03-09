import { useTranslation } from "react-i18next"

import { useAlertDialog } from "@/dialog"
import { ConfigLongTextAttribute, DeviceAttributeDefinition, PropsWithRenderItem } from "@/types"

import DeviceConfigurationView from "./DeviceConfigurationView"

export type DeviceConfigurationViewButtonProps = PropsWithRenderItem<{
  id: number
  attribute: ConfigLongTextAttribute
  definition: DeviceAttributeDefinition
}>

export default function DeviceConfigurationViewButton(props: DeviceConfigurationViewButtonProps) {
  const { id, attribute, definition, renderItem } = props
  const { t } = useTranslation()
  const dialog = useAlertDialog()

  const open = () => {
    dialog.open({
      title: t(definition?.title),
      description: <DeviceConfigurationView id={id} attribute={attribute} />,
      size: "xl",
    })
  }

  return renderItem(open)
}
