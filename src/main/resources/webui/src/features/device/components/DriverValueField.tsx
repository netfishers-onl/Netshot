import FormControl from "@/components/FormControl"
import { Select } from "@/components/Select"
import Switch from "@/components/Switch"
import { DriverOptionType } from "@/types"
import { Control, FieldPath, FieldValues } from "react-hook-form"

export type DriverValueFieldDefinition = {
  type: DriverOptionType
  label: string
  description?: string
  choices?: string[]
}

export type DriverValueFieldProps<T extends FieldValues> = {
  control: Control<T>
  name: FieldPath<T>
  definition: DriverValueFieldDefinition
}

/**
 * Renders a single driver-declared, user-provided field (a script `Input`
 * parameter or a per-device `Options` entry - both share the same
 * text/list/boolean type vocabulary), dispatching to the matching existing
 * widget rather than introducing new ones.
 */
export default function DriverValueField<T extends FieldValues>(props: DriverValueFieldProps<T>) {
  const { control, name, definition } = props

  if (definition.type === DriverOptionType.Boolean) {
    return <Switch control={control} name={name} label={definition.label} description={definition.description} />
  }

  if (definition.type === DriverOptionType.List) {
    const options = (definition.choices ?? []).map((choice) => ({ label: choice, value: choice }))
    return (
      <Select
        control={control}
        name={name}
        label={definition.label}
        helperText={definition.description}
        options={options}
        itemToString={(item) => item.label}
        itemToValue={(item) => item.value}
      />
    )
  }

  return (
    <FormControl
      control={control}
      name={name}
      label={definition.label}
      placeholder={definition.description}
    />
  )
}
