import { Checkbox as NativeCheckbox } from "@chakra-ui/react"
import { FocusEventHandler, PropsWithChildren } from "react"
import { Control, FieldPath, Path, PathValue, useController } from "react-hook-form"

export type CheckboxProps<T> = {
  control: Control<T>
  name: FieldPath<T>
  defaultValue?: PathValue<T, Path<T>>
  value?: PathValue<T, Path<T>>
  onFocus?: FocusEventHandler<HTMLElement>
  onChange?(value: PathValue<T, FieldPath<T>>): void
  onBlur?: FocusEventHandler<HTMLElement>
}

export default function Checkbox<T>(props: PropsWithChildren<CheckboxProps<T>>) {
  const { children, name, control, defaultValue, value } = props
  const { field } = useController({
    name,
    control,
    defaultValue,
  })

  return (
    <NativeCheckbox.Root
      onCheckedChange={(evt) => field.onChange(evt.checked)}
      onBlur={field.onBlur}
      ref={field.ref}
      checked={field.value as boolean}
      value={String(value)}
    >
      <NativeCheckbox.HiddenInput />
      <NativeCheckbox.Control />
      <NativeCheckbox.Label fontSize="md" fontWeight="normal">
        {children}
      </NativeCheckbox.Label>
    </NativeCheckbox.Root>
  )
}
