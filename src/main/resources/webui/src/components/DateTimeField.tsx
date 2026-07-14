import { useLocalization } from "@/i18n"
import { Box, DatePicker, Field, IconButton, Input, Portal } from "@chakra-ui/react"
import type { CalendarDateTime, DateValue } from "@internationalized/date"
import { ChangeEvent } from "react"
import { Control, FieldPath, FieldValues, useController } from "react-hook-form"
import { LuCalendar } from "react-icons/lu"
import { useTranslation } from "react-i18next"

export type TaskDateTimeFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = {
  control: Control<TFieldValues>
  name: TName
  label: string
  placeholder: string
}

/**
 * A date+time picker: the Ark/Chakra `DatePicker` calendar for the day, plus a
 * native time input embedded in its content (Chakra's "With Time" recipe),
 * bound to a single epoch-ms timestamp field. The text surface + calendar
 * icon button are styled to match the app's standard `FormControl` date
 * picker (`DatePicker.Input` + a small ghost `IconButton` trigger), since a
 * custom trigger is needed here to show time alongside the date.
 */
export default function TaskDateTimeField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>(props: TaskDateTimeFieldProps<TFieldValues, TName>) {
  const { control, name, label, placeholder } = props
  const { t } = useTranslation()
  const { formatDateTime, numberToCalendarDateTime, calendarDateTimeToTimestamp } = useLocalization()
  const { field } = useController({ control, name })

  const value = numberToCalendarDateTime(field.value as number | null | undefined)
  const values = value ? [value] : []

  function onDateChange(details: { value: DateValue[] }) {
    const picked = details.value[0] as CalendarDateTime | undefined
    if (!picked) {
      field.onChange(null)
      return
    }
    const merged = picked.set({
      hour: value?.hour ?? 0,
      minute: value?.minute ?? 0,
      second: 0,
      millisecond: 0,
    })
    field.onChange(calendarDateTimeToTimestamp(merged))
  }

  const timeValue = value
    ? `${String(value.hour).padStart(2, "0")}:${String(value.minute).padStart(2, "0")}`
    : ""

  function onTimeChange(e: ChangeEvent<HTMLInputElement>) {
    if (!value || !e.currentTarget.value) return
    const [hour, minute] = e.currentTarget.value.split(":").map(Number)
    field.onChange(calendarDateTimeToTimestamp(value.set({ hour, minute, second: 0, millisecond: 0 })))
  }

  return (
    <Field.Root flex="1">
      <Field.Label>{label}</Field.Label>
      <DatePicker.Root value={values} onValueChange={onDateChange} closeOnSelect={false} w="100%">
        <DatePicker.Control>
          <DatePicker.Trigger asChild unstyled>
            <Box
              as="button"
              flex="1"
              display="flex"
              alignItems="center"
              h="40px"
              px="3"
              minW="0"
              borderWidth="1px"
              borderColor="grey.100"
              borderRadius="xl"
              bg="white"
              fontSize="md"
              textAlign="start"
              color={value ? undefined : "grey.400"}
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
              cursor="pointer"
              _hover={{ borderColor: "grey.200" }}
            >
              {value ? formatDateTime(calendarDateTimeToTimestamp(value)) : placeholder}
            </Box>
          </DatePicker.Trigger>
          <DatePicker.IndicatorGroup>
            <DatePicker.Trigger asChild>
              <IconButton size="xs" variant="ghost" borderRadius="xl" aria-label={t("common.openCalendar")}>
                <LuCalendar />
              </IconButton>
            </DatePicker.Trigger>
          </DatePicker.IndicatorGroup>
        </DatePicker.Control>
        <Portal>
          <DatePicker.Positioner>
            <DatePicker.Content>
              <DatePicker.View view="day">
                <DatePicker.Header />
                <DatePicker.DayTable />
              </DatePicker.View>
              <Input type="time" value={timeValue} onChange={onTimeChange} disabled={!value} mt="2" />
            </DatePicker.Content>
          </DatePicker.Positioner>
        </Portal>
      </DatePicker.Root>
    </Field.Root>
  )
}
