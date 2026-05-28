import { useAlertDialog } from "@/dialog"
import { PropsWithRenderItem } from "@/types"
import { SettingModal } from "./SettingModal"
import { t } from "i18next"

export type UserSettingButtonProps = PropsWithRenderItem

export default function UserSettingButton(props: UserSettingButtonProps) {
  const { renderItem } = props
  const dialog = useAlertDialog()

  return renderItem(() =>
    dialog.open({
      title: t("common.account"),
      description: <SettingModal />,
      hideFooter: true,
    })
  )
}
