import { useDomains } from "@/features/administration/api"
import { Text } from "@chakra-ui/react"
import { FieldPath, FieldValues } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Select, SelectProps } from "./Select"

export type DomainSelectProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = Omit<SelectProps<TFieldValues, TName, string | number>, "options">

export default function DomainSelect<T>(props: DomainSelectProps<T>) {
  const { control, name, required, readOnly, multiple = false } = props

  const { t } = useTranslation()

  const { isPending, data = [] } = useDomains()

  const options = data.map((domain) => ({
    label: domain?.name,
    value: domain?.id,
  }))

  return (
    <Select
      label={t("Domain")}
      placeholder={t("Select a domain")}
      control={control}
      name={name}
      readOnly={readOnly}
      required={required}
      isLoading={isPending}
      noOptionsMessage={<Text>{t("No domain found")}</Text>}
      options={options}
      multiple={multiple}
      itemToString={(item) => item?.label}
      itemToValue={(item) => item.value?.toString()}
    />
  )
}
