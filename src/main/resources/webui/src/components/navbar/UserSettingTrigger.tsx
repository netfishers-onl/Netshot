import React from "react"
import { useAlertDialog } from "@/dialog"
import { SettingModal } from "./SettingModal"
import { t } from "i18next"

export type UserSettingTriggerProps = { children: React.ReactElement<any> } & Record<string, unknown>

export default function UserSettingTrigger({ children, ...rest }: UserSettingTriggerProps) {
  const dialog = useAlertDialog()

  const open = () =>
    dialog.open({
      title: t("common.account"),
      description: <SettingModal />,
      hideFooter: true,
    })

  return React.cloneElement(children, { onClick: open, onSelect: open, ...rest })
}
