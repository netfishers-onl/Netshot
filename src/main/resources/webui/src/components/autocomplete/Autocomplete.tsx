import { Combobox, ComboboxRootProps, Field, ListCollection, Portal, Text } from "@chakra-ui/react"
import { ReactElement } from "react"

export type AutocompleteProps<T> = {
  label?: string
  placeholder?: string
  helperText?: string
  collection: ListCollection<T>
  notFoundMessage?: string | ReactElement
  loadingMessage?: string | ReactElement
  errorMessage?: string | ReactElement
  isLoading?: boolean
  isError?: boolean
  onSelectItem?(item: T): void
  renderItem(item: T): ReactElement
} & ComboboxRootProps

export function Autocomplete<T>(props: AutocompleteProps<T>) {
  const {
    label,
    placeholder = "search2",
    helperText,
    collection,
    notFoundMessage = "No result found",
    loadingMessage = <Text>{"loading..."}</Text>,
    errorMessage = <Text>{"An error has occurred"}</Text>,
    required = false,
    disabled = false,
    readOnly = false,
    isLoading = false,
    isError = false,
    renderItem,
    ...comboboxProps
  } = props

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
            {/* <Combobox.ClearTrigger /> */}
            <Combobox.Trigger />
          </Combobox.IndicatorGroup>
        </Combobox.Control>

        {helperText && <Field.HelperText>{helperText}</Field.HelperText>}

        <Portal>
          <Combobox.Positioner>
            <Combobox.Content>
              {isLoading ? (
                loadingMessage
              ) : isError ? (
                errorMessage
              ) : (
                <>
                  <Combobox.Empty>{notFoundMessage}</Combobox.Empty>
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
