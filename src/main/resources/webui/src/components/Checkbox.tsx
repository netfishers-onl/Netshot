import { Checkbox as ChakraCheckbox } from "@chakra-ui/react"
import { PropsWithChildren } from "react"
import { Control, FieldPath, FieldValues, Path, PathValue, useController } from "react-hook-form"

export type CheckboxProps<T extends FieldValues> = {
  control: Control<T>
  name: FieldPath<T>
  defaultValue?: PathValue<T, Path<T>>
  value?: PathValue<T, Path<T>>
}

export default function Checkbox<T extends FieldValues>(props: PropsWithChildren<CheckboxProps<T>>) {
  const { children, name, control, defaultValue, value } = props
  const { field } = useController({
    name,
    control,
    defaultValue,
  })

  return (
    <ChakraCheckbox.Root
      onCheckedChange={(evt) => field.onChange(evt.checked)}
      onBlur={field.onBlur}
      ref={field.ref}
      checked={field.value as boolean}
      value={String(value)}
    >
      <ChakraCheckbox.HiddenInput />
      <ChakraCheckbox.Control />
      <ChakraCheckbox.Label fontSize="md" fontWeight="normal">
        {children}
      </ChakraCheckbox.Label>
    </ChakraCheckbox.Root>
  )
}
