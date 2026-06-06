import { Combobox, ComboboxRootProps, Field, IconButton, ListCollection, Portal, Text } from "@chakra-ui/react"
import { ReactElement } from "react"
import { useTranslation } from "react-i18next"
import { LuX } from "react-icons/lu"

export type AutocompleteProps<T> = {
  label?: string
  placeholder?: string
  helperText?: string
  collection: ListCollection<T>
  notFoundMessage?: string | ReactElement
  loadingMessage?: string | ReactElement
  errorMessage?: string | ReactElement
  isClearable?: boolean
  isLoading?: boolean
  isError?: boolean
  onSelectItem?(item: T): void
  renderItem(item: T): ReactElement
} & ComboboxRootProps

export function Autocomplete<T>(props: AutocompleteProps<T>) {
  const { t } = useTranslation()
  const {
    label,
    placeholder = t("search2"),
    helperText,
    collection,
    notFoundMessage,
    loadingMessage,
    errorMessage,
    isClearable = true,
    required = false,
    disabled = false,
    readOnly = false,
    isLoading = false,
    isError = false,
    renderItem,
    ...comboboxProps
  } = props

  const resolvedNotFoundMessage = notFoundMessage ?? t("common.noResults")
  const resolvedLoadingMessage = loadingMessage ?? <Text>{t("common.loading")}</Text>
  const resolvedErrorMessage = errorMessage ?? <Text>{t("common.anErrorHasOccurred")}</Text>

  return (
    <Field.Root required={required} readOnly={readOnly} disabled={disabled}>
      {label && (
        <Field.Label>
          {label}
          <Field.RequiredIndicator />
        </Field.Label>
      )}
      <Combobox.Root collection={collection} size="lg" {...comboboxProps}>
        <Combobox.Control>
          <Combobox.Input placeholder={placeholder} />
          <Combobox.IndicatorGroup>
            <Combobox.Context>
              {(api) =>
                (isClearable && api.inputValue || api.value.length > 0) && (
                  <Combobox.ClearTrigger asChild>
                    <IconButton size="xs" variant="ghost" borderRadius="xl">
                      <LuX />
                    </IconButton>
                  </Combobox.ClearTrigger>
                )
              }
            </Combobox.Context>
            <Combobox.Trigger />
          </Combobox.IndicatorGroup>
        </Combobox.Control>

        {helperText && <Field.HelperText>{helperText}</Field.HelperText>}

        <Portal>
          <Combobox.Positioner>
            <Combobox.Content>
              {isLoading ? (
                resolvedLoadingMessage
              ) : isError ? (
                resolvedErrorMessage
              ) : (
                <>
                  <Combobox.Empty>{resolvedNotFoundMessage}</Combobox.Empty>
                  {collection.items.map((item) => renderItem(item))}
                </>
              )}
            </Combobox.Content>
          </Combobox.Positioner>
        </Portal>
      </Combobox.Root>
    </Field.Root>
  )
}
