import { useEffect } from "react"
import { useController, UseControllerProps, useForm } from "react-hook-form"
import { QueryBuilderValue } from "./types"

export type UseQueryBuilderFormConfig<T> = {
  required?: boolean
} & UseControllerProps<T>

export function useQueryBuilder<T>(config: UseQueryBuilderFormConfig<T>) {
  const { name, control, defaultValue, required = false } = config

  const { field } = useController({
    name,
    control,
    defaultValue,
    rules: {
      required,
    },
  })

  const form = useForm<{ query: string }>({
    defaultValues: {
      query: (field.value as QueryBuilderValue)?.query ?? "",
    },
  })

  useEffect(() => {
    const { unsubscribe } = form.watch((values) => {
      field.onChange(values)
    })
    return () => unsubscribe()
  }, [form])

  return { form, field }
}
