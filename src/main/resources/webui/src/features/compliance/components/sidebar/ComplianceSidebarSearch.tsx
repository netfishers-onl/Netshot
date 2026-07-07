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
  }, [debouncedValue])

  return (
    <Stack p="6" gap="5">
      <Search placeholder={t("common.searchPlaceholder")} onQuery={onQuery} onClear={onClear} />
    </Stack>
  )
}
