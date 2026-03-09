import { Icon } from "@/components"
import { Tooltip } from "@/components/ui/tooltip"
import { Button, IconButton, Spacer, Stack, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { useShallow } from "zustand/react/shallow"
import { useDeviceSidebarStore } from "../../stores"

export default function DeviceSidebarListToolbar() {
  const { t } = useTranslation()
  const { isSelectedAll, total, selectAll, refresh } = useDeviceSidebarStore(
    useShallow((state) => ({
      isSelectedAll: state.isSelectedAll,
      total: state.total,
      selectAll: state.selectAll,
      refresh: state.refresh,
    }))
  )

  return (
    <Stack direction="row" alignItems="center" px="6" py="3">
      <Text>{t("{{count}} device", { count: total })}</Text>
      <Spacer />
      <Stack direction="row" gap="2">
        {!isSelectedAll() && total > 0 && (
          <Button alignSelf="start" size="sm" onClick={selectAll}>
            {t("Select all")}
          </Button>
        )}
        <Tooltip content={t("Refresh device list")}>
          <IconButton aria-label={t("Refresh device list")} size="sm" onClick={refresh}>
            <Icon name="refreshCcw" />
          </IconButton>
        </Tooltip>
      </Stack>
    </Stack>
  )
}
