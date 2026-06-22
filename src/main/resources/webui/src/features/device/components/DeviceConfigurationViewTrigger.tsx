import { useTranslation } from "react-i18next"
import { useAlertDialog } from "@/dialog"
import { ConfigLongTextAttribute, DeviceAttributeDefinition } from "@/types"
import { useDownloadConfigMutation } from "@/hooks"
import { Button } from "@chakra-ui/react"
import { LuDownload } from "react-icons/lu"
import React from "react"
import DeviceConfigurationView from "./DeviceConfigurationView"

export type DeviceConfigurationViewTriggerProps = {
  id: number
  filename?: string
  attribute: ConfigLongTextAttribute
  definition: DeviceAttributeDefinition
  children: React.ReactElement<any>
} & Record<string, unknown>

export default function DeviceConfigurationViewTrigger({ id, filename, attribute, definition, children, ...rest }: DeviceConfigurationViewTriggerProps) {
  const { t } = useTranslation()
  const dialog = useAlertDialog()
  const download = useDownloadConfigMutation(id, attribute?.name, filename)

  const open = () => {
    dialog.open({
      title: t(definition?.title),
      description: <DeviceConfigurationView id={id} attribute={attribute} />,
      size: "xl",
      footerExtra: (
        <Button variant="ghost" onClick={() => download.mutate()} loading={download.isPending}>
          <LuDownload />
          {t("common.download")}
        </Button>
      ),
    })
  }

  const isMenuItem = "value" in children.props
  return React.cloneElement(children, isMenuItem ? { onSelect: open, ...rest } : { ...rest, onClick: open })
}
