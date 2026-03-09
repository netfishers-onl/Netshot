import i18n from "@/i18n"
import { Option, SchedulePriority, TaskScheduleType } from "@/types"
import { Stack } from "@chakra-ui/react"
import { addMinutes, format, setHours, setMinutes } from "date-fns"
import { useEffect } from "react"
import { useForm, useFormContext, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import FormControl, { FormControlType } from "./FormControl"
import { Select } from "./Select"

enum ScheduleType {
  Asap = "asap",
  AtTime = "at-time",
  AtDateTime = "at-date-time",
  Repeat = "repeat",
}

export type ScheduleFormType = {
  schedule: {
    scheduleType: TaskScheduleType
    scheduleReference: Date
    scheduleFactor: number
    schedulePriority: SchedulePriority
  }
}

export const SCHEDULE_TYPE_OPTIONS = [
  {
    label: i18n.t("Run once, as soon as possible"),
    value: ScheduleType.Asap,
  },
  {
    label: i18n.t("Run once, in"),
    value: ScheduleType.AtTime,
  },
  {
    label: i18n.t("Run once, at"),
    value: ScheduleType.AtDateTime,
  },
  {
    label: i18n.t("Schedule as repeating event"),
    value: ScheduleType.Repeat,
  },
]

export const REPEAT_FREQUENCY_OPTIONS = [
  {
    label: i18n.t("Hour(s)"),
    value: "hourly",
  },
  {
    label: i18n.t("Day(s)"),
    value: "daily",
  },
  {
    label: i18n.t("Week(s)"),
    value: "weekly",
  },
  {
    label: i18n.t("Month(s)"),
    value: "monthly",
  },
] as Option<"hourly" | "daily" | "weekly" | "monthly">[]

export const MINUTE_OPTIONS = [
  {
    label: i18n.t("5 min"),
    value: 5,
  },
  {
    label: i18n.t("10 min"),
    value: 10,
  },
  {
    label: i18n.t("15 min"),
    value: 15,
  },
  {
    label: i18n.t("20 min"),
    value: 20,
  },
  {
    label: i18n.t("25 min"),
    value: 25,
  },
  {
    label: i18n.t("30 min"),
    value: 30,
  },
  {
    label: i18n.t("35 min"),
    value: 35,
  },
  {
    label: i18n.t("40 min"),
    value: 40,
  },
  {
    label: i18n.t("45 min"),
    value: 45,
  },
  {
    label: i18n.t("50 min"),
    value: 50,
  },
  {
    label: i18n.t("55 min"),
    value: 55,
  },
]

export const FREQUENCY_OPTIONS = [
  {
    label: i18n.t("Hour(s)"),
    value: "hourly",
  },
  {
    label: i18n.t("Day(s)"),
    value: "daily",
  },
  {
    label: i18n.t("Week(s)"),
    value: "weekly",
  },
  {
    label: i18n.t("Month(s)"),
    value: "monthly",
  },
]

export const SCHEDULE_PRIORITY_OPTIONS = [
  {
    label: i18n.t("Low"),
    value: SchedulePriority.Low,
  },
  {
    label: i18n.t("Normal"),
    value: SchedulePriority.Normal,
  },
  {
    label: i18n.t("High"),
    value: SchedulePriority.High,
  },
]

export type FormData = {
  type: ScheduleType
  date: string
  time: string
  minute: number
  every: number
  frequency: "hourly" | "daily" | "weekly" | "monthly"
  priority: string
}

export default function ScheduleForm() {
  const { t } = useTranslation()

  const parentForm = useFormContext<ScheduleFormType>()
  const scheduleForm = useForm<FormData>({
    defaultValues: {
      type: SCHEDULE_TYPE_OPTIONS[0].value,
      every: 1,
      date: format(new Date(), "yyyy-MM-dd"),
      time: format(new Date(), "HH:mm"),
      minute: MINUTE_OPTIONS[0].value,
      frequency: REPEAT_FREQUENCY_OPTIONS[0].value,
      priority: SCHEDULE_PRIORITY_OPTIONS[1].value.toString(),
    },
  })

  const selectedScheduleType = useWatch({
    control: scheduleForm.control,
    name: "type",
  })

  useEffect(() => {
    // Set outer default values
    parentForm.setValue("schedule.scheduleReference", new Date())
    parentForm.setValue("schedule.scheduleFactor", 1)
    parentForm.setValue("schedule.scheduleType", TaskScheduleType.Asap)
    parentForm.setValue("schedule.schedulePriority", SchedulePriority.Normal)

    // When schedule form change: format, parse and set values to outer form
    const watcher = scheduleForm.watch(
      ({ type, date, time, every, frequency, minute, priority }) => {
        let scheduleType: TaskScheduleType = TaskScheduleType.Asap
        let scheduleReference: Date = new Date()

        if (type === ScheduleType.AtTime) {
          scheduleType = TaskScheduleType.At
          scheduleReference = addMinutes(new Date(), minute)
        } else if (type === ScheduleType.AtDateTime) {
          scheduleType = TaskScheduleType.At

          const [hours, minutes] = time.split(":")

          scheduleReference = new Date(date)
          scheduleReference = setHours(scheduleReference, +hours)
          scheduleReference = setMinutes(scheduleReference, +minutes)
        } else if (type === ScheduleType.Repeat) {
          const [hours, minutes] = time.split(":")

          scheduleReference = new Date(date)
          scheduleReference = setHours(scheduleReference, +hours)
          scheduleReference = setMinutes(scheduleReference, +minutes)

          if (frequency === "hourly") {
            scheduleType = TaskScheduleType.Hourly
          } else if (frequency === "daily") {
            scheduleType = TaskScheduleType.Daily
          } else if (frequency === "weekly") {
            scheduleType = TaskScheduleType.Weekly
          } else if (frequency === "monthly") {
            scheduleType = TaskScheduleType.Monthly
          }
        }

        parentForm.setValue("schedule.scheduleReference", scheduleReference)
        parentForm.setValue("schedule.scheduleFactor", +every)
        parentForm.setValue("schedule.scheduleType", scheduleType)
        parentForm.setValue("schedule.schedulePriority", +priority)
      }
    )

    return () => {
      watcher?.unsubscribe()
    }
  }, [parentForm.setValue, scheduleForm.watch])

  // Re-init all fields when schedule type change
  useEffect(() => {
    scheduleForm.resetField("date")
    scheduleForm.resetField("time")
    scheduleForm.resetField("every")
    scheduleForm.resetField("minute")
    scheduleForm.resetField("frequency")
    scheduleForm.resetField("priority")
  }, [selectedScheduleType, scheduleForm.setValue])

  return (
    <>
      <Select options={SCHEDULE_TYPE_OPTIONS} control={scheduleForm.control} name="type" />
      {selectedScheduleType === ScheduleType.AtTime && (
        <Select options={MINUTE_OPTIONS} control={scheduleForm.control} name="minute" />
      )}
      {(selectedScheduleType === ScheduleType.AtDateTime ||
        selectedScheduleType === ScheduleType.Repeat) && (
        <Stack direction="row" gap="4">
          <FormControl
            label={t("Date")}
            control={scheduleForm.control}
            name="date"
            type={FormControlType.Date}
          />
          <FormControl
            label={t("Time")}
            control={scheduleForm.control}
            name="time"
            type={FormControlType.Time}
          />
        </Stack>
      )}
      {selectedScheduleType === ScheduleType.Repeat && (
        <Stack direction="row" gap="4" alignItems="flex-end">
          <FormControl
            label={t("Every")}
            control={scheduleForm.control}
            name="every"
            type={FormControlType.Number}
          />
          <Select options={FREQUENCY_OPTIONS} control={scheduleForm.control} name="frequency" />
        </Stack>
      )}
      <Select
        label={t("Priority")}
        options={SCHEDULE_PRIORITY_OPTIONS}
        control={scheduleForm.control}
        name="priority"
      />
    </>
  )
}
