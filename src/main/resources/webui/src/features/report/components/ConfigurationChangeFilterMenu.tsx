import { DateTimeField, DomainSelect, TreeGroupSelector } from "@/components"
import { Button, Menu, Portal, SimpleGrid, Stack } from "@chakra-ui/react"
import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { LuFilter, LuFilterX } from "react-icons/lu"
import { useSearchParams } from "react-router"
import { CONFIG_CHANGE_RANGE_PRESETS } from "../constants"
import { useConfigChangeFilterStore } from "../stores/useConfigChangeFilterStore"

type FilterFormValues = {
  fromDate: number
  toDate: number
  domain: string
  group: number | null
}

export default function ConfigurationChangeFilterMenu() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()

  const from = useConfigChangeFilterStore((s) => s.from)
  const to = useConfigChangeFilterStore((s) => s.to)
  const domain = useConfigChangeFilterStore((s) => s.domain)
  const group = useConfigChangeFilterStore((s) => s.group)
  const isFiltered = useConfigChangeFilterStore((s) => s.isFiltered)
  const applyFilters = useConfigChangeFilterStore((s) => s.applyFilters)
  const resetFilters = useConfigChangeFilterStore((s) => s.resetFilters)

  const hydrated = useRef(false)
  useEffect(() => {
    if (hydrated.current) return
    hydrated.current = true

    const fromParam = searchParams.get("from")
    const toParam = searchParams.get("to")
    const domainParam = searchParams.get("domain")
    const groupParam = searchParams.get("group")

    if (!fromParam && !toParam && !domainParam && !groupParam) {
      // Landed here fresh (e.g. via nav, not shared link/back-forward): don't carry over
      // a filter left applied from a previous visit to this screen.
      resetFilters()
      return
    }

    applyFilters({
      from: fromParam ? +fromParam : from,
      to: toParam ? +toParam : to,
      domain: domainParam ? +domainParam : null,
      group: groupParam ? +groupParam : null,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const formValues = {
    fromDate: from,
    toDate: to,
    domain: domain != null ? String(domain) : "",
    group,
  }

  const form = useForm<FilterFormValues>({ values: formValues })

  function selectPreset(ms: number) {
    const now = Date.now()
    form.setValue("fromDate", now - ms, { shouldDirty: true })
    form.setValue("toDate", now, { shouldDirty: true })
  }

  function onApply(values: FilterFormValues) {
    const filters = {
      from: values.fromDate,
      to: values.toDate,
      domain: values.domain ? +values.domain : null,
      group: values.group,
    }
    applyFilters(filters)
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set("from", String(filters.from))
        next.set("to", String(filters.to))
        if (filters.domain != null) next.set("domain", String(filters.domain))
        else next.delete("domain")
        if (filters.group != null) next.set("group", String(filters.group))
        else next.delete("group")
        return next
      },
      { replace: true }
    )
    setOpen(false)
  }

  function onReset() {
    resetFilters()
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete("from")
        next.delete("to")
        next.delete("domain")
        next.delete("group")
        return next
      },
      { replace: true }
    )
    setOpen(false)
  }

  return (
    <Menu.Root
      open={open}
      onOpenChange={(e) => {
        setOpen(e.open)
        if (!e.open) {
          form.reset(formValues)
        }
      }}
    >
      <Menu.Trigger asChild>
        <Button variant="primary">
          {isFiltered ? <LuFilterX /> : <LuFilter />}
          {t("common.filters")}
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content w="300px" p="3">
            <Stack gap="3" asChild>
              <form onSubmit={form.handleSubmit(onApply)}>
                <Stack direction="column" gap="2">
                  <DateTimeField
                    control={form.control}
                    name="fromDate"
                    label={t("task.from")}
                    placeholder={t("task.from")}
                  />
                  <DateTimeField
                    control={form.control}
                    name="toDate"
                    label={t("task.to")}
                    placeholder={t("task.to")}
                  />
                </Stack>
                <SimpleGrid columns={2} gap="2">
                  {CONFIG_CHANGE_RANGE_PRESETS.map((p) => (
                    <Button
                      key={p.label}
                      variant="ghost"
                      size="sm"
                      justifyContent="start"
                      onClick={() => selectPreset(p.ms)}
                    >
                      {t(p.label)}
                    </Button>
                  ))}
                </SimpleGrid>
                <DomainSelect control={form.control} name="domain" withAny />
                <TreeGroupSelector control={form.control} name="group" withAny />
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
