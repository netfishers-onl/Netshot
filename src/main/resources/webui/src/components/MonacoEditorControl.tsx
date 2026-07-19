import { useCallback } from "react"
import { FieldValues, UseControllerProps, useController } from "react-hook-form"
import MonacoEditor, { MonacoEditorProps } from "./MonacoEditor"

export type MonacoEditorControlProps<T extends FieldValues> = {
  required?: boolean
} & MonacoEditorProps &
  UseControllerProps<T>

export default function MonacoEditorControl<T extends FieldValues>(props: MonacoEditorControlProps<T>) {
  const { name, defaultValue, rules, control, required = false, ...other } = props

  const { field } = useController({
    name,
    defaultValue,
    rules: {
      required,
      ...rules,
    },
    control,
  })

  const handleChange = useCallback(
    (value: string) => {
      field.onChange(value)
    },
    [field]
  )

  return (
    <MonacoEditor
      value={field.value as string}
      onModelChange={handleChange}
      onBlur={field.onBlur}
      {...other}
    />
  )
}
