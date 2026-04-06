import { useDomains } from "@/features/administration/api"
import { Text } from "@chakra-ui/react"
import { FieldPath, FieldValues } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Select, SelectProps } from "./Select"
import { getAnyOption } from "@/utils"

export type DomainSelectProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = Omit<SelectProps<TFieldValues, TName, string | number | null>, "options"> & {
  withAny?: boolean
}

export default function DomainSelect<T>(props: DomainSelectProps<T>) {
  const { control, name, required, readOnly, multiple = false, withAny = false, ...rest } = props

  const { t } = useTranslation()

  const { isPending, data = [] } = useDomains()
  const anyOption = getAnyOption(t)

  const domainOptions = data.map((domain) => ({
    label: domain?.name,
    value: domain?.id as string | number | null,
  }))

  const options = withAny
    ? [anyOption, ...domainOptions]
    : domainOptions

  return (
    <Select
      label={t("domain")}
      placeholder={t("selectADomain")}
      control={control}
      name={name}
      readOnly={readOnly}
      required={required}
      isLoading={isPending}
      noOptionsMessage={<Text>{t("noDomainFound")}</Text>}
      options={options}
      multiple={multiple}
      itemToString={(item) => String(item?.label)}
      itemToValue={(item) => item.value === null ? "" : item.value.toString()}
      {...rest}
    />
  )
}
