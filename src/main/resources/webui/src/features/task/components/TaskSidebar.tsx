import { Sidebar, SidebarLink } from "@/components"
import { Stack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

export default function TaskSidebar() {
  const { t } = useTranslation()

  return (
    <Sidebar>
      <Stack gap="0" py="4" px="5" flex="1">
        <SidebarLink
          to="./active"
          label={t("task.active")}
          description={t("task.activeDescription")}
        />
        <SidebarLink
          to="./history"
          label={t("task.history")}
          description={t("task.historyDescription")}
        />
      </Stack>
    </Sidebar>
  )
}
