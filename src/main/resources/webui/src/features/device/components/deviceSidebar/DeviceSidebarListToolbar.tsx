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
import { useDeviceSidebar } from "../../contexts/device-sidebar";

export default function DeviceSidebarListToolbar() {
  const { t } = useTranslation();
  const ctx = useDeviceSidebar();

  const isSelectedAll = useMemo(() => ctx.isSelectedAll(), [ctx]);

  return (
    <Stack direction="row" alignItems="center" px="6" py="3">
      <Text>{t("{{length}} devices", { length: ctx.total })}</Text>
      <Spacer />
      <Stack direction="row" spacing="2">
        {(!isSelectedAll && ctx.total > 0) &&
          <Button
            alignSelf="start"
            size="sm"
            onClick={ctx.selectAll}
          >
            {t("Select all")}
          </Button>}
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
