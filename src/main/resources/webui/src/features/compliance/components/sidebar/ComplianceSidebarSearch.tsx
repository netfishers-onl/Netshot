import Search from "@/components/Search"
import { useDebounce } from "@/hooks"
import { Stack } from "@chakra-ui/react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useComplianceSidebar } from "../../contexts/ComplianceSidebarProvider"

export default function ComplianceSidebarSearch() {
  const { t } = useTranslation()
  const ctx = useComplianceSidebar()
  const [query, setQuery] = useState<string>("")
  const debouncedValue = useDebounce(query)

  function onQuery(query: string) {
    setQuery(query)
  }

  function onClear() {
    ctx.setQuery("")
  }

  useEffect(() => {
    ctx.setQuery(debouncedValue)
    // `ctx.setQuery` (a raw useState setter, guaranteed stable by React) is
    // the real dependency; `ctx` itself is a fresh object every provider
    // render, so depending on it here would re-fire this effect constantly.
    // eslint-disable-next-line @eslint-react/exhaustive-deps
  }, [debouncedValue, ctx.setQuery])

  return (
    <Stack p="6" gap="5">
      <Search placeholder={t("common.searchPlaceholder")} onQuery={onQuery} onClear={onClear} />
    </Stack>
  )
}
