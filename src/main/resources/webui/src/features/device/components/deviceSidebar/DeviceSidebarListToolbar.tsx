import { FiRefreshCcw } from "react-icons/fi"
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
      <Text>{t("device.label", { count: total })}</Text>
      <Spacer />
      <Stack direction="row" gap="2">
        {!isSelectedAll() && total > 0 && (
          <Button alignSelf="start" size="sm" onClick={selectAll}>
            {t("common.selectAll")}
          </Button>
        )}
        <Tooltip content={t("device.refreshList")}>
          <IconButton aria-label={t("device.refreshList")} size="sm" onClick={refresh}>
            <FiRefreshCcw />
          </IconButton>
        </Tooltip>
      </Stack>
    </Stack>
  )
}
