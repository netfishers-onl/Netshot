import { Icon, QueryBuilderButton } from "@/components";
import Search from "@/components/Search";
import { useThrottle } from "@/hooks";
import { IconButton, Stack, Tooltip } from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDeviceSidebar } from "../../contexts/device-sidebar";

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
            <Tooltip label={t("Query builder")}>
              <IconButton
                variant="ghost"
                aria-label={t("Open query builder")}
                icon={<Icon name="maximize" />}
                onClick={open}
              />
            </Tooltip>
          )}
          onSubmit={(res) => {
            ctx.updateQueryAndDriver(res);
          }}
        />
      </Search>
    </Stack>
  );
}
