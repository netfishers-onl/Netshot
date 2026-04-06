import { Option } from "@/types"
import { splitProps } from "@/utils"
import {
  Select as ChakraSelect,
  Field,
  FieldRootProps,
  HStack,
  IconButton,
  Portal,
  SelectRootProps,
  SelectValueChangeDetails,
  Skeleton,
  useListCollection,
} from "@chakra-ui/react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { ReactElement, useEffect, useMemo, useRef } from "react"
import { flushSync } from "react-dom"
import { FieldPath, FieldValues, useController, UseControllerProps } from "react-hook-form"
import Icon from "./Icon"

export type SelectProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
  T,
> = {
  label?: string
  placeholder?: string
  helperText?: string
  isLoading?: boolean
  isClearable?: boolean
  options: Option<T>[]
  noOptionsMessage?: ReactElement | string
  fieldProps?: FieldRootProps
  itemToString?(item: Option<T>): string
  itemToValue?(item: Option<T>): string
  onSelectItem?(item: T | T[], options: Option<T>[]): void
} & Omit<SelectRootProps, "collection" | "name" | "value" | "onValueChange"> &
  UseControllerProps<TFieldValues, TName>

export function Select<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>, T>(
  props: SelectProps<TFieldValues, TName, T>
) {
  const {
    options = [],
    label,
    placeholder,
    helperText,
    required,
    readOnly,
    disabled,
    multiple,
    isLoading,
    isClearable,
    noOptionsMessage,
    fieldProps = {},
    onBlur,
    onFocus,
    itemToString,
    itemToValue,
    onSelectItem,
    ...selectRootProps
  } = props

  const [controllerProps] = splitProps(props, [
    "name",
    "rules",
    "shouldUnregister",
    "defaultValue",
    "control",
    "disabled",
    "exact",
  ])

  const { field, fieldState } = useController({
    ...controllerProps,
    rules: {
      ...(controllerProps.rules || {}),
      required,
    },
  })

  const contentRef = useRef<HTMLDivElement | null>(null)
  const isDisabled = disabled || isLoading
  const getItemString = itemToString || ((item: Option<T>) => item.label)
  const getItemValue = itemToValue || ((item: Option<T>) => String(item.value))

  const { collection, set } = useListCollection<Option<T>>({
    initialItems: [],
    itemToString: getItemString,
    itemToValue: getItemValue,
  })

  const virtualizer = useVirtualizer({
    count: collection.size,
    getScrollElement: () => contentRef.current,
    estimateSize: () => 40,
    overscan: 10,
    scrollPaddingEnd: 32,
  })

  const optionsMap = useMemo(() => {
    return new Map<string, Option<T>>(options.map((option) => [getItemValue(option), option]))
  }, [options, getItemValue])

  const onValueChange = (details: SelectValueChangeDetails<Option<T>>) => {
    if (!details.value || details.value.length === 0) {
      field.onChange(null)
      return
    }

    if (multiple) {
      const selectedOptions = details.value.map((val) => optionsMap.get(val))

      field.onChange(selectedOptions.map(getItemValue))
      onSelectItem?.(
        selectedOptions.map((opt) => opt.value),
        options
      )
    } else {
      const selectedOption = optionsMap.get(details.value[0])

      if (selectedOption) {
        field.onChange(selectedOption.value === null ? null : getItemValue(selectedOption))
        onSelectItem?.(selectedOption.value, options)
      }
    }
  }

  const handleScrollToIndexFn = (details: { index: number }) => {
    flushSync(() => {
      virtualizer.scrollToIndex(details.index, {
        align: "center",
        behavior: "auto",
      })
    })
  }

  useEffect(() => {
    set(options)
  }, [options])

  const value = useMemo(() => {
    if (multiple) {
      return field.value ? field.value : []
    }

    return field.value !== null && field.value !== undefined ? [String(field.value)] : [""]
  }, [field, isLoading, multiple])

  return (
    <Field.Root
      required={required}
      readOnly={readOnly}
      disabled={isDisabled}
      invalid={false}
      {...fieldProps}
    >
      {label && (
        <Field.Label>
          {label}
          <Field.RequiredIndicator />
        </Field.Label>
      )}
      <ChakraSelect.Root
        size="lg"
        name={field.name}
        value={value}
        multiple={multiple}
        onValueChange={onValueChange}
        onInteractOutside={() => {
          field.onBlur()
        }}
        onBlur={onBlur}
        onFocus={onFocus}
        collection={collection}
        disabled={isDisabled}
        scrollToIndexFn={handleScrollToIndexFn}
        {...selectRootProps}
      >
        <ChakraSelect.HiddenSelect />
        <ChakraSelect.Control>
          <ChakraSelect.Trigger>
            <ChakraSelect.ValueText placeholder={placeholder} />
          </ChakraSelect.Trigger>
          <ChakraSelect.IndicatorGroup>
            {isClearable && value?.length > 0 && (
              <ChakraSelect.ClearTrigger asChild>
                <IconButton size="sm" variant="ghost">
                  <Icon name="x" />
                </IconButton>
              </ChakraSelect.ClearTrigger>
            )}
            <ChakraSelect.Indicator />
          </ChakraSelect.IndicatorGroup>
        </ChakraSelect.Control>
        <Portal>
          <ChakraSelect.Positioner>
            <ChakraSelect.Content ref={contentRef}>
              {isLoading ? (
                <>
                  <Skeleton w="100%" h="48px" />
                  <Skeleton w="100%" h="48px" />
                  <Skeleton w="100%" h="48px" />
                </>
              ) : options?.length > 0 ? (
                <div
                  style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: "100%",
                    position: "relative",
                  }}
                >
                  {virtualizer.getVirtualItems().map((virtualItem) => {
                    const item = collection.items[virtualItem.index]

                    return (
                      <ChakraSelect.Item
                        item={item}
                        key={item.label}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: `${virtualItem.size}px`,
                          transform: `translateY(${virtualItem.start}px)`,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        <ChakraSelect.ItemText>{item.label}</ChakraSelect.ItemText>
                        <ChakraSelect.ItemIndicator />
                      </ChakraSelect.Item>
                    )
                  })}
                </div>
              ) : (
                <HStack justifyContent="center" h="42px">
                  {noOptionsMessage || "No options available"}
                </HStack>
              )}
            </ChakraSelect.Content>
          </ChakraSelect.Positioner>
        </Portal>
      </ChakraSelect.Root>
      {helperText && <Field.HelperText>{helperText}</Field.HelperText>}
      {fieldState.error && <Field.ErrorText>{fieldState.error?.message}</Field.ErrorText>}
    </Field.Root>
  )
}
