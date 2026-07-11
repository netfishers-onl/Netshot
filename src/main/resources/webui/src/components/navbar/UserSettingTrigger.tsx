import React from "react"
import { useAlertDialog } from "@/dialog"
import { AccountDialog } from "./AccountDialog"
import { t } from "i18next"

export type UserSettingTriggerProps = { children: React.ReactElement<any> } & Record<string, unknown>

export default function UserSettingTrigger({ children, ...rest }: UserSettingTriggerProps) {
  const dialog = useAlertDialog()

  const open = () =>
    dialog.open({
      title: t("common.account"),
      description: <AccountDialog />,
      hideFooter: true,
    })

  const isMenuItem = "value" in children.props
  return React.cloneElement(children, isMenuItem ? { onSelect: open, ...rest } : { ...rest, onClick: open })
}
