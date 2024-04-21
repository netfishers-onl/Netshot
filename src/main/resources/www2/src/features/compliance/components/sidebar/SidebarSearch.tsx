import Search from "@/components/Search";
import { useThrottle } from "@/hooks";
import { Stack } from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSidebar } from "../../contexts/SidebarProvider";

export default function SidebarSearch() {
  const { t } = useTranslation();
  const ctx = useSidebar();
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
        placeholder={t("Search...")}
        onQuery={onQuery}
        onClear={onClear}
      />
    </Stack>
  );
}
