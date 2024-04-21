import { Icon, QueryBuilderButton } from "@/components";
import Search from "@/components/Search";
import { useThrottle } from "@/hooks";
import {
  Button,
  Flex,
  IconButton,
  Spacer,
  Stack,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDeviceSidebar } from "../../contexts/DeviceSidebarProvider";

export default function DeviceSidebarSearch() {
  const { t } = useTranslation();
  const ctx = useDeviceSidebar();
  const [query, setQuery] = useState<string>("");
  const isSelectedAll = useMemo(() => ctx.isSelectedAll(), [ctx]);
  const throttledValue = useThrottle(query);

  const onQuery = useCallback((query: string) => {
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
    <Stack p="6" spacing="5" bg={isSelectedAll ? "green.500" : "white"}>
      <Search
        clear={Boolean(ctx.query)}
        placeholder={t("Search...")}
        onQuery={onQuery}
        onClear={onClear}
      >
        <QueryBuilderButton
          value={{
            query: ctx.query,
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
      {ctx.query && (
        <Flex>
          <Text color={isSelectedAll ? "white" : "black"}>
            {isSelectedAll
              ? t("{{x}} selected", { x: ctx.total })
              : t("{{x}} devices", { x: ctx.total })}
          </Text>
          <Spacer />
          <Button
            variant="plain"
            colorScheme={isSelectedAll ? "white" : "green"}
            onClick={isSelectedAll ? ctx.deselectAll : ctx.selectAll}
            isDisabled={ctx.data?.length === 0}
          >
            {isSelectedAll ? t("Deselect") : t("Select all")}
          </Button>
        </Flex>
      )}
    </Stack>
  );
}
