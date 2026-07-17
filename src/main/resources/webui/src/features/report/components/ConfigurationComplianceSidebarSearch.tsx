import { DomainSelect, PolicySelect } from "@/components"
import { LuFilter, LuFilterX } from "react-icons/lu"
import Search from "@/components/Search"
import { useFormDialog } from "@/dialog"
import { IconButton, Stack } from "@chakra-ui/react"
import React, { useEffect, useRef } from "react"
import { useForm, useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"
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

function ConfigurationComplianceSidebarSearchFilterForm() {
  const form = useFormContext()

  return (
    <Stack>
      <DomainSelect multiple control={form.control} name="domains" />
      <PolicySelect multiple control={form.control} name="policies" />
    </Stack>
  )
}

type ConfigurationComplianceSidebarSearchFilterProps = { children: React.ReactElement<any> } & Record<string, unknown>

function ConfigurationComplianceSidebarSearchFilter({ children, ...rest }: ConfigurationComplianceSidebarSearchFilterProps) {
  const { t } = useTranslation()
  const { domains, policies, setFilters } = useConfigurationComplianceSidebarStore(
    useShallow((state) => ({
      domains: state.domains,
      policies: state.policies,
      setFilters: state.setFilters,
    }))
  )
  const [, setSearchParams] = useSearchParams()

  const dialog = useFormDialog()
  const form = useForm<FilterForm>({
    defaultValues: {
      domains,
      policies,
    },
  })

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

  const open = () => {
    const dialogRef = dialog.open({
      title: t("common.advancedFilters"),
      description: <ConfigurationComplianceSidebarSearchFilterForm />,
      form,
      onSubmit(values: FilterForm) {
        setFilters(values)
        writeFiltersToUrl(values)

        dialogRef.close()
      },
      onCancel() {
        form.reset()
        const values = form.getValues()
        setFilters(values)
        writeFiltersToUrl(values)
        dialogRef.close()
      },
      submitButton: {
        label: t("common.applyFilters"),
      },
      cancelButton: {
        label: t("common.clearAll"),
      },
    })
  }

  const isMenuItem = "value" in children.props
  return React.cloneElement(children, isMenuItem ? { onSelect: open, ...rest } : { ...rest, onClick: open })
}

export default function ConfigurationComplianceSidebarSearch() {
  const { t } = useTranslation()
  const { query, domains, policies, setQuery, setFilters } =
    useConfigurationComplianceSidebarStore(
      useShallow((state) => ({
        query: state.query,
        domains: state.domains,
        policies: state.policies,
        setQuery: state.setQuery,
        setFilters: state.setFilters,
      }))
    )
  const [searchParams] = useSearchParams()

  const isFiltered = domains.length > 0 || policies.length > 0

  const hydrated = useRef(false)
  useEffect(() => {
    if (hydrated.current) return
    hydrated.current = true

    const domainsParam = searchParams.get("domains")
    const policiesParam = searchParams.get("policies")

    // Landed here fresh (e.g. via nav, not shared link/back-forward): don't carry over
    // a filter left applied from a previous visit to this screen.
    setFilters({
      domains: parseIds(domainsParam),
      policies: parseIds(policiesParam),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <ConfigurationComplianceSidebarSearchFilter>
          <IconButton size="xs" variant="ghost" aria-label={t("common.openFilter")}>
            {isFiltered ? <LuFilterX /> : <LuFilter />}
          </IconButton>
        </ConfigurationComplianceSidebarSearchFilter>
      </Search>
    </Stack>
  )
}
