import { Icon } from "@/components";
import {
  Button,
  IconButton,
  Spacer,
  Stack,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDeviceSidebar } from "../../contexts/DeviceSidebarProvider";

export default function DeviceSidebarListToolbar() {
  const { t } = useTranslation();
  const ctx = useDeviceSidebar();

  const isSelectedAll = useMemo(() => ctx.isSelectedAll(), [ctx.selected]);

  return (
    <Stack direction="row" alignItems="center" px="6" py="3">
      <Text>{t("{{length}} devices", { length: ctx.total })}</Text>
      <Spacer />
      <Stack direction="row" spacing="2">
        <Button
          alignSelf="start"
          size="sm"
          onClick={isSelectedAll ? ctx.deselectAll : ctx.selectAll}
        >
          {t(isSelectedAll ? "Deselect all" : "Select all")}
        </Button>
        <Tooltip label={t("Refresh device list")}>
          <IconButton
            aria-label={t("Refresh device list")}
            size="sm"
            icon={<Icon name="refreshCcw" />}
            onClick={ctx.refreshDeviceList}
          />
        </Tooltip>
      </Stack>
    </Stack>
  );
}
