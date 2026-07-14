import i18n from "@/i18n"
import { SchedulePriority, TaskScheduleType } from "@/types"
import { Stack, Text } from "@chakra-ui/react"
import { getLocalTimeZone, now } from "@internationalized/date"
import { useEffect, useMemo } from "react"
import { useForm, useFormContext, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import DateTimeField from "./DateTimeField"
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
    scheduleReference: number
    scheduleFactor: number
    schedulePriority: SchedulePriority
  }
}

export const SCHEDULE_TYPE_OPTIONS = [
  {
    label: i18n.t("task.runOnce"),
    value: ScheduleType.Asap,
  },
  {
    label: i18n.t("task.runOnceIn"),
    value: ScheduleType.AtTime,
  },
  {
    label: i18n.t("task.runOnceAt"),
    value: ScheduleType.AtDateTime,
  },
  {
    label: i18n.t("task.scheduleRepeating"),
    value: ScheduleType.Repeat,
  },
]


export const SCHEDULE_PRIORITY_OPTIONS = [
  {
    label: i18n.t("common.low"),
    value: SchedulePriority.Low,
  },
  {
    label: i18n.t("common.normal"),
    value: SchedulePriority.Normal,
  },
  {
    label: i18n.t("common.high"),
    value: SchedulePriority.High,
  },
]

export type FormData = {
  type: ScheduleType
  dateTime: number | undefined
  minute: number
  every: number
  frequency: "hourly" | "daily" | "weekly" | "monthly"
  priority: string
}

export default function ScheduleForm() {
  const { t } = useTranslation()

  const tz = getLocalTimeZone()
  const parentForm = useFormContext<ScheduleFormType>()
  const scheduleForm = useForm<FormData>({
    defaultValues: {
      type: SCHEDULE_TYPE_OPTIONS[0].value,
      every: 1,
      dateTime: now(tz).toDate().getTime(),
      minute: 5,
      frequency: "hourly",
      priority: SCHEDULE_PRIORITY_OPTIONS[1].value.toString(),
    },
  })

  const selectedScheduleType = useWatch({
    control: scheduleForm.control,
    name: "type",
  })

  const minute = useWatch({ control: scheduleForm.control, name: "minute" })
  const minuteCount = Number(minute) || 1

  const every = useWatch({ control: scheduleForm.control, name: "every" })
  const everyCount = Number(every) || 1
  const frequencyOptions = useMemo(
    () => [
      { label: t("hour", { count: everyCount }), value: "hourly" as const },
      { label: t("day", { count: everyCount }), value: "daily" as const },
      { label: t("week", { count: everyCount }), value: "weekly" as const },
      { label: t("month", { count: everyCount }), value: "monthly" as const },
    ],
    [everyCount, t]
  )

  useEffect(() => {
    // Set outer default values
    parentForm.setValue("schedule.scheduleReference", now(tz).toDate().getTime())
    parentForm.setValue("schedule.scheduleFactor", 1)
    parentForm.setValue("schedule.scheduleType", TaskScheduleType.Asap)
    parentForm.setValue("schedule.schedulePriority", SchedulePriority.Normal)

    // When schedule form change: format, parse and set values to outer form
    const watcher = scheduleForm.watch(
      ({ type, dateTime, every, frequency, minute, priority }) => {
        let scheduleType: TaskScheduleType = TaskScheduleType.Asap
        let scheduleReference: number = now(tz).toDate().getTime()

        if (type === ScheduleType.AtTime) {
          scheduleType = TaskScheduleType.At
          scheduleReference = now(tz).add({ minutes: minute }).toDate().getTime()
        } else if (type === ScheduleType.AtDateTime) {
          scheduleType = TaskScheduleType.At
          scheduleReference = dateTime
        } else if (type === ScheduleType.Repeat) {
          scheduleReference = dateTime

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
    scheduleForm.resetField("dateTime")
    scheduleForm.resetField("every")
    scheduleForm.resetField("minute")
    scheduleForm.resetField("frequency")
    scheduleForm.resetField("priority")
  }, [selectedScheduleType, scheduleForm.setValue])

  return (
    <>
      <Select
        label={t("task.schedule")}
        options={SCHEDULE_TYPE_OPTIONS}
        control={scheduleForm.control}
        name="type"
      />
      {selectedScheduleType === ScheduleType.AtTime && (
        <FormControl
          control={scheduleForm.control}
          name="minute"
          type={FormControlType.Number}
          required
          rules={{ min: { value: 1, message: t("common.mustBeAtLeastOne") } }}
          suffix={
            <Text color="grey.400" pr="5">
              {t("time.minute", { count: minuteCount })}
            </Text>
          }
        />
      )}
      {(selectedScheduleType === ScheduleType.AtDateTime ||
        selectedScheduleType === ScheduleType.Repeat) && (
        <DateTimeField
          control={scheduleForm.control}
          name="dateTime"
          label={t("time.dateTime")}
          placeholder={t("time.dateTime")}
        />
      )}
      {selectedScheduleType === ScheduleType.Repeat && (
        <Stack direction="row" gap="4" alignItems="flex-end">
          <FormControl
            label={t("time.every")}
            control={scheduleForm.control}
            name="every"
            type={FormControlType.Number}
          />
          <Select options={frequencyOptions} control={scheduleForm.control} name="frequency" />
        </Stack>
      )}
      <Select
        label={t("common.priority")}
        options={SCHEDULE_PRIORITY_OPTIONS}
        control={scheduleForm.control}
        name="priority"
      />
    </>
  )
}
