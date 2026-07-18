import React from "react"
import Slot from "@/components/Slot"
import { useAlertDialog } from "@/dialog"
import { AccountDialog } from "./AccountDialog"
import { t } from "i18next"

export type UserSettingTriggerProps = { children: React.ReactElement<Record<string, unknown>> } & Record<string, unknown>

export default function UserSettingTrigger({ children, ...rest }: UserSettingTriggerProps) {
  const dialog = useAlertDialog()

  const open = () =>
    dialog.open({
      title: t("common.account"),
      description: <AccountDialog />,
      hideFooter: true,
    })

  return <Slot onTrigger={open} {...rest}>{children}</Slot>
}
