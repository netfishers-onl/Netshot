import { TaskStatus, TaskType } from "@/types"
import { Button, Menu, Portal, SimpleGrid, Stack } from "@chakra-ui/react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { LuFilter, LuFilterX } from "react-icons/lu"
import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router"
import { DateTimeField } from "@/components"
import { TIME_RANGE_PRESETS } from "../constants"
import { useTaskHistoryFilterStore } from "../stores/useTaskHistoryFilterStore"
import TaskStatusSelect from "./TaskStatusSelect"
import TaskTypeSelect from "./TaskTypeSelect"

type TaskTimeRangeFormValues = {
  fromDate: number
  toDate: number
  types: TaskType[]
  statuses: TaskStatus[]
}

export type TaskTimeRangeMenuProps = {
  statuses: TaskStatus[]
}

export default function TaskTimeRangeMenu(props: TaskTimeRangeMenuProps) {
  const { statuses } = props
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()

  const from = useTaskHistoryFilterStore((s) => s.from)
  const to = useTaskHistoryFilterStore((s) => s.to)
  const typeSel = useTaskHistoryFilterStore((s) => s.typeSel)
  const statusSel = useTaskHistoryFilterStore((s) => s.statusSel)
  const isRangeCustom = useTaskHistoryFilterStore((s) => s.isRangeCustom)
  const setRange = useTaskHistoryFilterStore((s) => s.setRange)
  const setTypeSel = useTaskHistoryFilterStore((s) => s.setTypeSel)
  const setStatusSel = useTaskHistoryFilterStore((s) => s.setStatusSel)
  const resetFilters = useTaskHistoryFilterStore((s) => s.resetFilters)

  const isFiltered = typeSel.length > 0 || statusSel.length > 0 || isRangeCustom

  const hydratedRef = useRef(false)
  useEffect(() => {
    if (hydratedRef.current) return
    hydratedRef.current = true

    const fromParam = searchParams.get("from")
    const toParam = searchParams.get("to")
    const typesParam = searchParams.get("types")
    const statusesParam = searchParams.get("statuses")

    if (!fromParam && !toParam && !typesParam && !statusesParam) {
      // Landed here fresh (e.g. via nav, not shared link/back-forward): don't carry over
      // a filter left applied from a previous visit to this screen.
      resetFilters()
      return
    }

    if (fromParam && toParam) setRange(+fromParam, +toParam)
    if (typesParam) setTypeSel(typesParam.split(",") as TaskType[])
    if (statusesParam) setStatusSel(statusesParam.split(",") as TaskStatus[])
    // eslint-disable-next-line @eslint-react/exhaustive-deps
  }, [])

  const form = useForm<TaskTimeRangeFormValues>({
    values: { fromDate: from, toDate: to, types: typeSel, statuses: statusSel },
  })

  function selectPreset(ms: number) {
    const now = Date.now()
    form.setValue("fromDate", now - ms, { shouldDirty: true })
    form.setValue("toDate", now, { shouldDirty: true })
  }

  function onApply(values: TaskTimeRangeFormValues) {
    setRange(values.fromDate, values.toDate)
    setTypeSel(values.types)
    setStatusSel(values.statuses)
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set("from", String(values.fromDate))
        next.set("to", String(values.toDate))
        if (values.types.length > 0) next.set("types", values.types.join(","))
        else next.delete("types")
        if (values.statuses.length > 0) next.set("statuses", values.statuses.join(","))
        else next.delete("statuses")
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
        next.delete("types")
        next.delete("statuses")
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
          form.reset({ fromDate: from, toDate: to, types: typeSel, statuses: statusSel })
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
                  {TIME_RANGE_PRESETS.map((p) => (
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
                <TaskTypeSelect control={form.control} name="types" label={t("common.type")} />
                <TaskStatusSelect
                  control={form.control}
                  name="statuses"
                  statuses={statuses}
                  label={t("common.status")}
                />
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
