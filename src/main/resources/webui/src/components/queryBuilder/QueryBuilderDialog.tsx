import { FieldValues, UseControllerProps } from "react-hook-form"
import { useQueryBuilder } from "./useQueryBuilder"
import { QueryBuilderForm } from "./QueryBuilderForm"

export type QueryBuilderDialogProps<T extends FieldValues> = {
  required?: boolean
} & UseControllerProps<T>

export function QueryBuilderDialog<T extends FieldValues>(props: QueryBuilderDialogProps<T>) {
  const { control, defaultValue, name, required = false } = props
  const { form } = useQueryBuilder({ control, name, defaultValue, required })
  const [query] = form.watch(["query"])

  return (
    <QueryBuilderForm
      value={query ?? ""}
      onChange={(q) => form.setValue("query", q)}
    />
  )
}
