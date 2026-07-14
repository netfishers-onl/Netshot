import { TaskStatus } from "@/types"
import { Button, Menu, Portal, Stack } from "@chakra-ui/react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { LuFilter } from "react-icons/lu"
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

  const typeSel = useActiveTaskFilterStore((s) => s.typeSel)
  const statusSel = useActiveTaskFilterStore((s) => s.statusSel)
  const setTypeSel = useActiveTaskFilterStore((s) => s.setTypeSel)
  const setStatusSel = useActiveTaskFilterStore((s) => s.setStatusSel)
  const resetFilters = useActiveTaskFilterStore((s) => s.resetFilters)

  const form = useTaskFilterForm({ typeSel, statusSel })

  function onApply(values: { types: typeof typeSel; statuses: typeof statusSel }) {
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
          form.reset({ types: typeSel, statuses: statusSel })
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
