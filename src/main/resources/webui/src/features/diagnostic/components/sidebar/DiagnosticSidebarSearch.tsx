import Search from "@/components/Search"
import { useThrottle } from "@/hooks"
import { Stack } from "@chakra-ui/react"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useDiagnosticSidebar } from "../../contexts/DiagnosticSidebarProvider"

export default function DiagnosticSidebarSearch() {
  const { t } = useTranslation()
  const ctx = useDiagnosticSidebar()
  const [query, setQuery] = useState<string>("")
  const throttledValue = useThrottle(query)

  const onQuery = useCallback((query: string) => {
    setQuery(query)
  }, [])

  const onClear = useCallback(() => {
    ctx.setQuery("")
  }, [ctx])

  useEffect(() => {
    ctx.setQuery(throttledValue)
    // `ctx.setQuery` (a raw useState setter, guaranteed stable by React) is
    // the real dependency; `ctx` itself is a fresh object every provider
    // render, so depending on it here would re-fire this effect constantly.
    // eslint-disable-next-line @eslint-react/exhaustive-deps
  }, [throttledValue, ctx.setQuery])

  return (
    <Stack p="6" gap="5">
      <Search
        clear={Boolean(ctx.query)}
        placeholder={t("common.searchPlaceholder")}
        onQuery={onQuery}
        onClear={onClear}
      />
    </Stack>
  )
}
