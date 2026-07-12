import { TaskStatus } from "@/types"
import { Stack } from "@chakra-ui/react"
import { Control } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { TaskFilterFormValues } from "../hooks/useTaskFilterForm"
import TaskStatusSelect from "./TaskStatusSelect"
import TaskTypeSelect from "./TaskTypeSelect"

export type TaskFilterFieldsProps = {
  control: Control<TaskFilterFormValues>
  statuses: TaskStatus[]
}

export default function TaskFilterFields(props: TaskFilterFieldsProps) {
  const { control, statuses } = props
  const { t } = useTranslation()

  return (
    <Stack gap="4">
      <TaskTypeSelect control={control} name="types" label={t("common.type")} />
      <TaskStatusSelect
        control={control}
        name="statuses"
        statuses={statuses}
        label={t("common.status")}
      />
    </Stack>
  )
}
