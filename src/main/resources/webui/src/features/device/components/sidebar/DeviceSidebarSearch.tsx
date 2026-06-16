import { QueryBuilderTrigger } from "@/components"
import { LuCompass } from "react-icons/lu"
import Search from "@/components/Search"
import { Tooltip } from "@/components/ui/tooltip"
import { IconButton, Stack } from "@chakra-ui/react"
import debounce from "lodash.debounce"
import { useTranslation } from "react-i18next"
import { useShallow } from "zustand/react/shallow"
import { useDeviceSidebarStore } from "../../stores"

export default function DeviceSidebarSearch() {
  const { t } = useTranslation()
  const { query, driver, setQuery, deselectAll, updateQueryAndDriver } = useDeviceSidebarStore(
    useShallow((state) => ({
      deselectAll: state.deselectAll,
      updateQueryAndDriver: state.updateQueryAndDriver,
      query: state.query,
      driver: state.driver,
      setQuery: state.setQuery,
    }))
  )

  const onQuery = debounce((query: string) => {
    deselectAll()
    setQuery(`[Name] CONTAINSNOCASE "${query}"`)
  }, 400)

  function onClear() {
    deselectAll()
    updateQueryAndDriver("", null)
    setQuery("")
  }

  return (
    <Stack p="6" gap="5">
      <Search
        clear={Boolean(query)}
        placeholder={t("common.searchPlaceholder")}
        onQuery={onQuery}
        onClear={onClear}
      >
        <Tooltip content={t("common.queryBuilder")}>
          <QueryBuilderTrigger
            value={{
              query,
              driver,
            }}
            onSubmit={(res) => {
              updateQueryAndDriver(res.query, res.driver)
            }}
          >
            <IconButton size="xs" variant="ghost" aria-label={t("common.openQueryBuilder")}>
              <LuCompass />
            </IconButton>
          </QueryBuilderTrigger>
        </Tooltip>
      </Search>
    </Stack>
  )
}
