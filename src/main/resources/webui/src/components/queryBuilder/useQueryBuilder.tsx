import { DeviceType } from "@/types"
import { useController, UseControllerProps, useForm } from "react-hook-form"
import { AttributeName } from "./constants"
import { AttributeGroupType, QueryBuilderValue } from "./types"
import { useAttributeGroupOptions } from "./useAttributeGroupOptions"
import { useOperatorMapping } from "./useOperatorMapping"

export type UseQueryBuilderFormConfig<T> = {
  required?: boolean
} & UseControllerProps<T>

export function useQueryBuilder<T>(config: UseQueryBuilderFormConfig<T>) {
  const { name, control, defaultValue, required = false } = config
  const attributeGroupOptions = useAttributeGroupOptions()
  const operatorMapping = useOperatorMapping()

  const { field } = useController({
    name,
    control,
    defaultValue,
    rules: {
      required,
    },
  })

  const form = useForm<{
    query: string
    deviceType: DeviceType["name"]
    policy: string
    rule: string
    attributeGroup: AttributeGroupType
    attribute: AttributeName
  }>({
    defaultValues: {
      query: (field.value as QueryBuilderValue)?.query ?? "",
      deviceType: (field.value as QueryBuilderValue)?.driver ?? null,
      policy: null,
      rule: null,
      attributeGroup: attributeGroupOptions.getFirst().value,
      attribute: null,
    },
  })

  return {
    form,
    field,
    attributeGroupOptions,
    operatorMapping,
  }
}
