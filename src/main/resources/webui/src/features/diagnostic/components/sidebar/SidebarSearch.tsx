import Search from "@/components/Search";
import { useThrottle } from "@/hooks";
import { Flex, Stack, Text } from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDiagnosticSidebar } from "../../contexts/DiagnosticSidebarProvider";

export default function SidebarSearch() {
  const { t } = useTranslation();
  const ctx = useDiagnosticSidebar();
  const [query, setQuery] = useState<string>("");
  const throttledValue = useThrottle(query);

  const onQuery = useCallback((query: string) => {
    setQuery(query);
  }, []);

  const onClear = useCallback(() => {
    ctx.setQuery("");
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
      />
      {ctx.query && (
        <Flex>
          <Text>{t("{{x}} diagnostic(s)", { x: ctx.total })}</Text>
        </Flex>
      )}
    </Stack>
  );
}
