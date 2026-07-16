import { TaskStatus, TaskType } from "@/types"
import { Button, Menu, Portal, Stack } from "@chakra-ui/react"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { LuFilter, LuFilterX } from "react-icons/lu"
import { useSearchParams } from "react-router"
import { useTaskFilterForm } from "../hooks/useTaskFilterForm"
import { useActiveTaskFilterStore } from "../stores/useActiveTaskFilterStore"
import TaskFilterFields from "./TaskFilterFields"

export type TaskFilterMenuProps = {
  statuses: TaskStatus[]
}

export default function TaskFilterMenu(props: TaskFilterMenuProps) {
  const { statuses } = props
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()

  const typeSel = useActiveTaskFilterStore((s) => s.typeSel)
  const statusSel = useActiveTaskFilterStore((s) => s.statusSel)
  const setTypeSel = useActiveTaskFilterStore((s) => s.setTypeSel)
  const setStatusSel = useActiveTaskFilterStore((s) => s.setStatusSel)
  const resetFilters = useActiveTaskFilterStore((s) => s.resetFilters)

  const isFiltered = typeSel.length > 0 || statusSel.length > 0

  const hydrated = useRef(false)
  useEffect(() => {
    if (hydrated.current) return
    hydrated.current = true

    const typesParam = searchParams.get("types")
    const statusesParam = searchParams.get("statuses")

    if (!typesParam && !statusesParam) {
      // Landed here fresh (e.g. via nav, not shared link/back-forward): don't carry over
      // a filter left applied from a previous visit to this screen.
      resetFilters()
      return
    }

    if (typesParam) setTypeSel(typesParam.split(",") as TaskType[])
    if (statusesParam) setStatusSel(statusesParam.split(",") as TaskStatus[])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const form = useTaskFilterForm({ typeSel, statusSel })

  function onApply(values: { types: typeof typeSel; statuses: typeof statusSel }) {
    setTypeSel(values.types)
    setStatusSel(values.statuses)
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
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
          form.reset({ types: typeSel, statuses: statusSel })
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
          <Menu.Content w="380px" p="3">
            <Stack gap="4" asChild>
              <form onSubmit={form.handleSubmit(onApply)}>
                <TaskFilterFields control={form.control} statuses={statuses} />
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
