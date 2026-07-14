import { Select, SelectProps } from "@/components/Select"
import { Option, TaskType } from "@/types"
import { Icon } from "@chakra-ui/react"
import { useMemo } from "react"
import { FieldPath, FieldValues } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { TASK_TYPE_ICONS, TASK_TYPE_KEYS } from "../constants"

export type TaskTypeSelectProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = Omit<SelectProps<TFieldValues, TName, TaskType>, "options" | "multiple">

export default function TaskTypeSelect<TFieldValues extends FieldValues>(
  props: TaskTypeSelectProps<TFieldValues>
) {
  const { t } = useTranslation()

  const options = useMemo<Option<TaskType>[]>(
    () => TASK_TYPE_KEYS.map((type) => ({ label: t(`task.type.${type}`), value: type })),
    [t]
  )

  return (
    <Select
      placeholder={t("task.allTypes")}
      isClearable
      options={options}
      multiple
      renderIcon={(item) => <Icon size="sm">{TASK_TYPE_ICONS[item.value]}</Icon>}
      {...props}
    />
  )
}
