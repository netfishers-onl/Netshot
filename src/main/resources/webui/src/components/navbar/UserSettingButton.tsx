import { useAlertDialog } from "@/dialog"
import { PropsWithRenderItem } from "@/types"
import { SettingModal } from "./SettingModal"

export type UserSettingButtonProps = PropsWithRenderItem

export default function UserSettingButton(props: UserSettingButtonProps) {
  const { renderItem } = props
  const dialog = useAlertDialog()

  return renderItem(() =>
    dialog.open({
      title: "settings",
      description: <SettingModal />,
      hideFooter: true,
    })
  )
}
