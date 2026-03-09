import {
  Switch as ChakraSwitch,
  Field,
  Stack,
  SwitchCheckedChangeDetails,
  Text,
} from "@chakra-ui/react"
import { Control, FieldPath, useController } from "react-hook-form"
import { FormControlProps } from "./FormControl"

export type SwitchProps<T> = {
  control: Control<T>
  name: FieldPath<T>
  defaultValue?: boolean
  label?: string
  description?: string
} & FormControlProps<T>

export default function Switch<T>(props: SwitchProps<T>) {
  const { label, description, control, name, defaultValue, ...other } = props

  const { field } = useController({
    name,
    control,
    defaultValue,
  })

  const onChange = (details: SwitchCheckedChangeDetails) => {
    field.onChange(details.checked)
  }

  return (
    <Field.Root flexDirection="row" alignItems="start" justifyContent="space-between" {...other}>
      <Stack gap="0">
        <Field.Label mb="0">{label}</Field.Label>
        <Text color="grey.400">{description}</Text>
      </Stack>
      <ChakraSwitch.Root size="lg" checked={field.value as boolean} onCheckedChange={onChange}>
        <ChakraSwitch.HiddenInput />
        <ChakraSwitch.Control>
          <ChakraSwitch.Thumb />
        </ChakraSwitch.Control>
      </ChakraSwitch.Root>
    </Field.Root>
  )
}
