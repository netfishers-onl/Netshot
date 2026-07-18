import { DomainSelect, PolicySelect } from "@/components"
import Search from "@/components/Search"
import { Button, IconButton, Menu, Portal, Stack } from "@chakra-ui/react"
import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { LuFilter, LuFilterX } from "react-icons/lu"
import { useSearchParams } from "react-router"
import { useShallow } from "zustand/react/shallow"
import { useConfigurationComplianceSidebarStore } from "../stores/useConfigurationComplianceSidebarStore"

function parseIds(value: string | null): number[] {
  if (!value) return []
  return value.split(",").map(Number)
}

type FilterForm = {
  domains: number[]
  policies: number[]
}

function ConfigurationComplianceSidebarFilterMenu() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [, setSearchParams] = useSearchParams()

  const { domains, policies, setFilters } = useConfigurationComplianceSidebarStore(
    useShallow((state) => ({
      domains: state.domains,
      policies: state.policies,
      setFilters: state.setFilters,
    }))
  )

  const isFiltered = domains.length > 0 || policies.length > 0

  const form = useForm<FilterForm>({ values: { domains, policies } })

  function writeFiltersToUrl(values: FilterForm) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const key of ["domains", "policies"] as const) {
          if (values[key].length > 0) next.set(key, values[key].join(","))
          else next.delete(key)
        }
        return next
      },
      { replace: true }
    )
  }

  function onApply(values: FilterForm) {
    setFilters(values)
    writeFiltersToUrl(values)
    setOpen(false)
  }

  function onReset() {
    const values = { domains: [], policies: [] }
    setFilters(values)
    writeFiltersToUrl(values)
    setOpen(false)
  }

  return (
    <Menu.Root
      open={open}
      onOpenChange={(e) => {
        setOpen(e.open)
        if (!e.open) {
          form.reset({ domains, policies })
        }
      }}
    >
      <Menu.Trigger asChild>
        <IconButton size="xs" variant="ghost" aria-label={t("common.openFilter")}>
          {isFiltered ? <LuFilterX /> : <LuFilter />}
        </IconButton>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content w="300px" p="3">
            <Stack gap="4" asChild>
              <form onSubmit={form.handleSubmit(onApply)}>
                <DomainSelect multiple control={form.control} name="domains" />
                <PolicySelect multiple control={form.control} name="policies" />
                <Stack direction="row" gap="2">
                  <Button type="button" flex="1" onClick={() => setOpen(false)}>
                    {t("common.cancel")}
                  </Button>
                  <Button type="button" flex="1" onClick={onReset}>
                    {t("common.reset")}
                  </Button>
                  <Button type="submit" variant="primary" flex="1">
                    {t("common.apply")}
                  </Button>
                </Stack>
              </form>
            </Stack>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  )
}

export default function ConfigurationComplianceSidebarSearch() {
  const { t } = useTranslation()
  const { query, setQuery, setFilters } = useConfigurationComplianceSidebarStore(
    useShallow((state) => ({
      query: state.query,
      setQuery: state.setQuery,
      setFilters: state.setFilters,
    }))
  )
  const [searchParams] = useSearchParams()

  const hydratedRef = useRef(false)
  useEffect(() => {
    if (hydratedRef.current) return
    hydratedRef.current = true

    const domainsParam = searchParams.get("domains")
    const policiesParam = searchParams.get("policies")

    // Landed here fresh (e.g. via nav, not shared link/back-forward): don't carry over
    // a filter left applied from a previous visit to this screen.
    setFilters({
      domains: parseIds(domainsParam),
      policies: parseIds(policiesParam),
    })
    // eslint-disable-next-line @eslint-react/exhaustive-deps
  }, [])

  const onQuery = (query: string) => {
    setQuery(query)
  }

  const onClear = () => {
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
        <ConfigurationComplianceSidebarFilterMenu />
      </Search>
    </Stack>
  )
}
