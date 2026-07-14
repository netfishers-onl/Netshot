import { TaskStatus, TaskType } from "@/types"
import { Button, Menu, Portal, SimpleGrid, Stack } from "@chakra-ui/react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { LuFilter } from "react-icons/lu"
import { useState } from "react"
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

  const from = useTaskHistoryFilterStore((s) => s.from)
  const to = useTaskHistoryFilterStore((s) => s.to)
  const typeSel = useTaskHistoryFilterStore((s) => s.typeSel)
  const statusSel = useTaskHistoryFilterStore((s) => s.statusSel)
  const setRange = useTaskHistoryFilterStore((s) => s.setRange)
  const setTypeSel = useTaskHistoryFilterStore((s) => s.setTypeSel)
  const setStatusSel = useTaskHistoryFilterStore((s) => s.setStatusSel)
  const resetFilters = useTaskHistoryFilterStore((s) => s.resetFilters)

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
          form.reset({ fromDate: from, toDate: to, types: typeSel, statuses: statusSel })
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
