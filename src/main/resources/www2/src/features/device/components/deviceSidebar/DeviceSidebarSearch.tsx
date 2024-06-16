import { Icon, QueryBuilderButton } from "@/components";
import Search from "@/components/Search";
import { useThrottle } from "@/hooks";
import {
  Button,
  IconButton,
  Spacer,
  Stack,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDeviceSidebar } from "../../contexts/DeviceSidebarProvider";

export default function DeviceSidebarSearch() {
  const { t } = useTranslation();
  const ctx = useDeviceSidebar();
  const [query, setQuery] = useState<string>("");
  const throttledValue = useThrottle(query);

  const onQuery = useCallback((query: string) => {
    ctx.deselectAll();
    setQuery(`[Name] CONTAINSNOCASE \"${query}\"`);
  }, []);

  const onClear = useCallback(() => {
    ctx.deselectAll();
    ctx.updateQueryAndDriver({
      query: "",
      driver: null,
    });
  }, [ctx]);

  useEffect(() => {
    ctx.setQuery(throttledValue);
  }, [throttledValue]);

  return (
    <Stack p="6" spacing="5">
      <Search
        clear={Boolean(ctx.query)}
        placeholder={t("Search...")}
        onQuery={onQuery}
        onClear={onClear}
      >
        <QueryBuilderButton
          value={{
            query,
            driver: ctx.driver,
          }}
          renderItem={(open) => (
            <Tooltip label={t("Advanced search")}>
              <IconButton
                variant="ghost"
                aria-label={t("Open advanced search")}
                icon={<Icon name="filter" />}
                onClick={open}
              />
            </Tooltip>
          )}
          onSubmit={(res) => {
            ctx.updateQueryAndDriver(res);
          }}
        />
      </Search>
      <Stack direction="row" alignItems="center">
        <Text>{t("{{length}} devices", { length: ctx.total })}</Text>
        <Spacer />
        <Stack direction="row" spacing="2">
          <Button alignSelf="start" size="sm" onClick={ctx.selectAll}>
            {t("Select all")}
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
    </Stack>
  );
}
