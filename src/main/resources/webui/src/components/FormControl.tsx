import { Tooltip } from "@/components/ui/tooltip"
import {
  Combobox,
  DatePicker,
  type DatePickerValueChangeDetails,
  Field,
  IconButton,
  Input,
  InputGroup,
  type InputProps,
  Portal,
  SystemStyleObject,
  Textarea,
  useListCollection,
} from "@chakra-ui/react"
import { CalendarDate, parseDate, type DateValue } from "@internationalized/date"
import { forwardRef, ReactElement, ReactNode, RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useController, UseControllerProps } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { LuCalendar, LuEye, LuEyeOff, LuLock, LuLockOpen, LuX } from "react-icons/lu"

export const PASSWORD_UNCHANGED = null

const MAX_SUGGESTIONS = 20

export enum FormControlType {
  Text = "text",
  Password = "password",
  LongText = "longtext",
  File = "file",
  Number = "number",
  Date = "date",
  DateTime = "datetime",
  Time = "time",
  Url = "url",
}

export type FormControlProps<T> = {
  label?: string
  type?: FormControlType
  helperText?: string
  uppercase?: boolean
  rows?: number
  onFocus?(): void
  suffix?: ReactNode
  prefix?: ReactNode
  allowUnchanged?: boolean
  clearable?: boolean
  suggestions?: string[]
} & Omit<InputProps, "recipe"> &
  Omit<SystemStyleObject, "recipe"> &
  UseControllerProps<T>

declare module "react" {
  function forwardRef<T, P = object>(
    render: (props: P, ref: React.Ref<T>) => React.ReactNode | null
  ): (props: P & React.RefAttributes<T>) => React.ReactNode | null
}

function FormControl<T>(
  props: FormControlProps<T>,
  ref: RefObject<HTMLInputElement | HTMLTextAreaElement>
) {
  const {
    label,
    placeholder,
    control,
    name,
    defaultValue,
    rules = {},
    required,
    disabled,
    type = FormControlType.Text,
    helperText,
    uppercase = false,
    rows = 10,
    onFocus,
    autoFocus,
    suffix,
    prefix,
    autoComplete,
    variant,
    allowUnchanged = false,
    clearable = false,
    suggestions,
    ...other
  } = props

  const { t, i18n } = useTranslation()
  const [showPassword, setShowPassword] = useState(false)
  const [isUnchanged, setIsUnchanged] = useState(allowUnchanged)
  const passwordInputRef = useRef<HTMLInputElement>(null)
  const allSuggestionsRef = useRef<string[]>([])
  const { collection: suggestionCollection, set: setSuggestionItems } = useListCollection({
    initialItems: [] as { label: string; value: string }[],
    itemToValue: (item) => item.value,
    itemToString: (item) => item.label,
  })

  useEffect(() => {
    allSuggestionsRef.current = suggestions ?? []
    setSuggestionItems(
      (suggestions ?? []).slice(0, MAX_SUGGESTIONS).map((s) => ({ label: s, value: s }))
    )
  }, [suggestions])

  const {
    field,
    fieldState: { error },
  } = useController({
    control,
    name,
    rules: {
      required,
      ...rules,
    },
    defaultValue,
  })

  useEffect(() => {
    if (!allowUnchanged) return
    if (isUnchanged && field.value != PASSWORD_UNCHANGED) {
      setIsUnchanged(false)
      setShowPassword(false)
    } else if (!isUnchanged && field.value == PASSWORD_UNCHANGED) {
      setIsUnchanged(true)
      setShowPassword(false)
    }
  }, [field.value])

  useEffect(() => {
    if (!isUnchanged && allowUnchanged) {
      passwordInputRef.current?.focus()
    }
  }, [isUnchanged])

  const inputProps = {
    onChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
      field.onChange(uppercase ? e.target.value.toUpperCase() : e)
    },
    onBlur() {
      field.onBlur()
    },
    onFocus() {
      if (onFocus) onFocus()
    },
    placeholder,
    name,
    ref(inputRef) {
      field.ref(inputRef)

      if (ref) {
        ref.current = inputRef
      }
    },
    autoFocus,
    variant,
  }

  const togglePassword = useCallback(() => {
    if (isUnchanged) {
      setIsUnchanged(false)
      field.onChange("")
    } else {
      setShowPassword((prev) => !prev)
    }
  }, [isUnchanged, field])

  const lockPassword = useCallback(() => {
    setIsUnchanged(true)
    setShowPassword(false)
    field.onChange(PASSWORD_UNCHANGED)
  }, [field])

  const dateValue = useMemo<DateValue[]>(() => {
    const v = field.value as string
    if (!v) return []
    const parts = v.split("-")
    if (parts.length < 3) return []
    const year = parseInt(parts[0])
    const month = parseInt(parts[1])
    const day = parseInt(parts[2])
    if (isNaN(year) || isNaN(month) || isNaN(day)) return []
    return [new CalendarDate(year, month, day)]
  }, [field.value])

  const handleDateChange = useCallback(
    ({ value }: DatePickerValueChangeDetails) => {
      if (value.length === 0) {
        field.onChange("")
      } else {
        const d = value[0] as CalendarDate
        field.onChange(
          `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`
        )
      }
      field.onBlur()
    },
    [field]
  )

  return (
    <Field.Root required={required} disabled={disabled} {...other}>
      {label && (
        <Field.Label>
          {label}
          <Field.RequiredIndicator />
        </Field.Label>
      )}
      {[
        FormControlType.Text,
        FormControlType.Number,
        FormControlType.DateTime,
        FormControlType.Time,
        FormControlType.Url,
      ].includes(type) && (
        suggestions !== undefined ? (
          <Combobox.Root
            collection={suggestionCollection}
            inputValue={String(field.value ?? "")}
            onInputValueChange={({ inputValue }) => {
              const val = uppercase ? inputValue.toUpperCase() : inputValue
              field.onChange(val)
              const lower = inputValue.toLowerCase()
              setSuggestionItems(
                allSuggestionsRef.current
                  .filter((s) => s.toLowerCase().includes(lower))
                  .slice(0, MAX_SUGGESTIONS)
                  .map((s) => ({ label: s, value: s }))
              )
            }}
            onValueChange={({ value }) => {
              if (value[0] !== undefined) field.onChange(value[0])
            }}
            onInteractOutside={field.onBlur}
            onFocusOutside={field.onBlur}
            onFocus={() => { if (onFocus) onFocus() }}
            allowCustomValue
            openOnChange
            disabled={disabled}
          >
            <Combobox.Control>
              <Combobox.Input
                type={type}
                placeholder={placeholder}
                name={name}
                autoComplete="off"
                autoFocus={autoFocus}
                ref={(inputRef) => {
                  field.ref(inputRef)
                  if (ref) ref.current = inputRef
                }}
              />
              {suffix && (
                <Combobox.IndicatorGroup>
                  {suffix}
                </Combobox.IndicatorGroup>
              )}
            </Combobox.Control>
            <Portal>
              <Combobox.Positioner>
                <Combobox.Content>
                  {suggestionCollection.items.map((item) => (
                    <Combobox.Item key={item.value} item={item}>
                      <Combobox.ItemText>{item.label}</Combobox.ItemText>
                    </Combobox.Item>
                  ))}
                </Combobox.Content>
              </Combobox.Positioner>
            </Portal>
          </Combobox.Root>
        ) : (
          <InputGroup startElement={prefix} endElement={suffix}>
            <Input
              type={type}
              value={String(field.value as string)}
              autoComplete={autoComplete}
              {...inputProps}
            />
          </InputGroup>
        )
      )}
      {type === FormControlType.Date && (
        <DatePicker.Root
          value={dateValue}
          onValueChange={handleDateChange}
          locale={i18n.language}
          disabled={disabled}
          closeOnSelect
          format={(date) => `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`}
          parse={(value) => { try { return parseDate(value) } catch { return undefined } }}
          placeholder={t("common.datePlaceholder")}
        >
          <DatePicker.Control>
            <DatePicker.Input />
            <DatePicker.IndicatorGroup>
              {(clearable && dateValue.length > 0) ? (
                <DatePicker.ClearTrigger asChild>
                  <IconButton size="xs" variant="ghost" aria-label={t("common.clear")}>
                    <LuX />
                  </IconButton>
                </DatePicker.ClearTrigger>
              ) : (
                <DatePicker.Trigger asChild>
                  <IconButton size="xs" variant="ghost" aria-label={t("common.openCalendar")}>
                    <LuCalendar />
                  </IconButton>
                </DatePicker.Trigger>
              )}
            </DatePicker.IndicatorGroup>
          </DatePicker.Control>
          <Portal>
            <DatePicker.Positioner>
              <DatePicker.Content>
                <DatePicker.View view="day">
                  <DatePicker.Header />
                  <DatePicker.DayTable />
                </DatePicker.View>
                <DatePicker.View view="month">
                  <DatePicker.Header />
                  <DatePicker.MonthTable />
                </DatePicker.View>
                <DatePicker.View view="year">
                  <DatePicker.Header />
                  <DatePicker.YearTable />
                </DatePicker.View>
              </DatePicker.Content>
            </DatePicker.Positioner>
          </Portal>
        </DatePicker.Root>
      )}
      {type === FormControlType.Password && (
        <InputGroup
          startAddon={prefix}
          endElement={
            <>
              {allowUnchanged && !isUnchanged && (
                <Tooltip content={t("auth.passwordUnchanged")} positioning={{ placement: "top" }}>
                  <span>
                    <IconButton
                      size="xs"
                      variant="ghost"
                      rounded="l1"
                      aria-label={t("auth.passwordUnchanged")}
                      onClick={lockPassword}
                    >
                      <LuLockOpen />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
              <Tooltip
                content={isUnchanged ? t("auth.passwordUnchanged") : showPassword ? t("common.hidePassword") : t("common.showPassword")}
                positioning={{ placement: "top" }}
              >
                <span>
                  <IconButton
                    size="xs"
                    variant="ghost"
                    aria-label={isUnchanged ? t("auth.passwordUnchanged") : showPassword ? t("common.hidePassword") : t("common.showPassword")}
                    onClick={togglePassword}
                  >
                    {isUnchanged ? <LuLock /> : showPassword ? <LuEye /> : <LuEyeOff />}
                  </IconButton>
                </span>
              </Tooltip>
            </>
          }
        >
          <Input
            type={showPassword ? "text" : "password"}
            value={isUnchanged ? "••••••••" : String(field.value as string)}
            disabled={isUnchanged}
            {...inputProps}
            ref={(inputRef) => {
              inputProps.ref(inputRef)
              passwordInputRef.current = inputRef
            }}
          />
        </InputGroup>
      )}
      {type === FormControlType.LongText && (
        <Textarea rows={rows} value={field.value == null ? "" : String(field.value as string)} {...inputProps} />
      )}
      {helperText && <Field.HelperText>{helperText}</Field.HelperText>}
      {error && <Field.HelperText color="red.500">{error?.message}</Field.HelperText>}
    </Field.Root>
  )
}

export default forwardRef(FormControl)
