import { TaskStatus, TaskType } from "@/types"
import { useForm } from "react-hook-form"

export type TaskFilterFormValues = {
  types: TaskType[]
  statuses: TaskStatus[]
}

export type UseTaskFilterFormParams = {
  typeSel: TaskType[]
  statusSel: TaskStatus[]
}

/**
 * A react-hook-form instance backing the Type/Status `Select` filters, seeded
 * from the store's currently *applied* selection. Edits stay local to the form
 * until the caller explicitly commits them (e.g. on an "Apply" button) — nothing
 * here pushes changes back to the store automatically.
 */
export function useTaskFilterForm(params: UseTaskFilterFormParams) {
  const { typeSel, statusSel } = params

  return useForm<TaskFilterFormValues>({
    values: { types: typeSel, statuses: statusSel },
  })
}
