import { Select, SelectProps } from "@/components/Select"
import TaskStatusBadge, { TASK_STATUS_CONFIG } from "@/components/TaskStatusBadge"
import { Option, TaskStatus } from "@/types"
import { Icon } from "@chakra-ui/react"
import { useMemo } from "react"
import { FieldPath, FieldValues } from "react-hook-form"
import { useTranslation } from "react-i18next"

export type TaskStatusSelectProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = Omit<SelectProps<TFieldValues, TName, TaskStatus>, "options" | "multiple"> & {
  statuses: TaskStatus[]
}

export default function TaskStatusSelect<TFieldValues extends FieldValues>(
  props: TaskStatusSelectProps<TFieldValues>
) {
  const { statuses, ...other } = props
  const { t } = useTranslation()

  const options = useMemo<Option<TaskStatus>[]>(
    () => statuses.map((status) => ({ label: t(TASK_STATUS_CONFIG[status].labelKey), value: status })),
    [statuses, t]
  )

  return (
    <Select
      placeholder={t("task.allStatuses")}
      isClearable
      options={options}
      multiple
      renderIcon={(item) => (
        <Icon size="sm" color={`${TASK_STATUS_CONFIG[item.value].colorPalette}.500`}>
          {TASK_STATUS_CONFIG[item.value].icon}
        </Icon>
      )}
      renderSelectedValue={(item) => <TaskStatusBadge status={item.value} />}
      {...other}
    />
  )
}
