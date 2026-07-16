import { DateTimeField, DomainSelect, TreeGroupSelector } from "@/components"
import { Button, Menu, Portal, SimpleGrid, Stack } from "@chakra-ui/react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { LuFilter } from "react-icons/lu"
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

  const from = useConfigChangeFilterStore((s) => s.from)
  const to = useConfigChangeFilterStore((s) => s.to)
  const domain = useConfigChangeFilterStore((s) => s.domain)
  const group = useConfigChangeFilterStore((s) => s.group)
  const applyFilters = useConfigChangeFilterStore((s) => s.applyFilters)
  const resetFilters = useConfigChangeFilterStore((s) => s.resetFilters)

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
    applyFilters({
      from: values.fromDate,
      to: values.toDate,
      domain: values.domain ? +values.domain : null,
      group: values.group,
    })
    setOpen(false)
  }

  function onReset() {
    resetFilters()
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
          <LuFilter />
          {t("common.filters")}
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content w="560px" p="4">
            <Stack gap="3" asChild>
              <form onSubmit={form.handleSubmit(onApply)}>
                <Stack direction="row" gap="2">
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
                <SimpleGrid columns={3} gap="2">
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
                <DomainSelect control={form.control} name="domain" isClearable />
                <TreeGroupSelector control={form.control} name="group" withAny />
                <Stack direction="row" gap="2">
                  <Button type="button" flex="1" onClick={onReset}>
                    {t("common.reset")}
                  </Button>
                  <Button type="submit" variant="primary" flex="1">
                    {t("common.applyFilters")}
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
