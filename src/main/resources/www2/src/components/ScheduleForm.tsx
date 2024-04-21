import { Option, TaskScheduleType } from "@/types";
import { Stack } from "@chakra-ui/react";
import { addMinutes, format, setHours, setMinutes } from "date-fns";
import { useEffect, useMemo } from "react";
import { useForm, useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import FormControl, { FormControlType } from "./FormControl";
import Select from "./Select";

enum ScheduleType {
  Asap,
  AtTime,
  AtDateTime,
  Repeat,
}

export type ScheduleFormType = {
  schedule: {
    scheduleType: TaskScheduleType;
    scheduleReference: Date;
    scheduleFactor: number;
  };
};

export default function ScheduleForm() {
  const { t } = useTranslation();

  const typeOptions = useMemo(
    () => [
      {
        label: t("Run once, as soon as possible"),
        value: ScheduleType.Asap,
      },
      {
        label: t("Run once, in"),
        value: ScheduleType.AtTime,
      },
      {
        label: t("Run once, at"),
        value: ScheduleType.AtDateTime,
      },
      {
        label: t("Schedule as repeating event"),
        value: ScheduleType.Repeat,
      },
    ],
    []
  );

  const repeatFrequencyOptions = useMemo(
    () =>
      [
        {
          label: t("Hour(s)"),
          value: "hourly",
        },
        {
          label: t("Day(s)"),
          value: "daily",
        },
        {
          label: t("Week(s)"),
          value: "weekly",
        },
        {
          label: t("Month(s)"),
          value: "monthly",
        },
      ] as Option<"hourly" | "daily" | "weekly" | "monthly">[],
    []
  );

  const minuteOptions = useMemo(
    () => [
      {
        label: t("5 min"),
        value: 5,
      },
      {
        label: t("10 min"),
        value: 10,
      },
      {
        label: t("15 min"),
        value: 15,
      },
      {
        label: t("20 min"),
        value: 20,
      },
      {
        label: t("25 min"),
        value: 25,
      },
      {
        label: t("30 min"),
        value: 30,
      },
      {
        label: t("35 min"),
        value: 35,
      },
      {
        label: t("40 min"),
        value: 40,
      },
      {
        label: t("45 min"),
        value: 45,
      },
      {
        label: t("50 min"),
        value: 50,
      },
      {
        label: t("55 min"),
        value: 55,
      },
    ],
    []
  );

  const frequencyOptions = useMemo(
    () => [
      {
        label: t("Hour(s)"),
        value: "hourly",
      },
      {
        label: t("Day(s)"),
        value: "daily",
      },
      {
        label: t("Week(s)"),
        value: "weekly",
      },
      {
        label: t("Month(s)"),
        value: "monthly",
      },
    ],
    []
  );

  const defaultValues = useMemo(
    () => ({
      type: typeOptions[0],
      every: 1,
      date: format(new Date(), "yyyy-MM-dd"),
      time: format(new Date(), "HH:mm"),
      minute: minuteOptions[0],
      frequency: repeatFrequencyOptions[0],
    }),
    [typeOptions, minuteOptions, repeatFrequencyOptions, format]
  );

  const parentForm = useFormContext<ScheduleFormType>();
  const scheduleForm = useForm<{
    type: Option<ScheduleType>;
    date: string;
    time: string;
    minute: Option<number>;
    every: number;
    frequency: Option<"hourly" | "daily" | "weekly" | "monthly">;
  }>({
    defaultValues,
  });

  const selectedScheduleType = useWatch({
    control: scheduleForm.control,
    name: "type",
  });

  useEffect(() => {
    // Set outer default values
    parentForm.setValue("schedule.scheduleReference", new Date());
    parentForm.setValue("schedule.scheduleFactor", 1);
    parentForm.setValue("schedule.scheduleType", TaskScheduleType.Asap);

    // When schedule form change: format, parse and set values to outer form
    const watcher = scheduleForm.watch(
      ({ type, date, time, every, frequency, minute }) => {
        let scheduleType: TaskScheduleType = TaskScheduleType.Asap;
        let scheduleReference: Date = new Date();

        if (type.value === ScheduleType.AtTime) {
          scheduleType = TaskScheduleType.At;
          scheduleReference = addMinutes(new Date(), minute.value);
        } else if (type.value === ScheduleType.AtDateTime) {
          scheduleType = TaskScheduleType.At;

          const [hours, minutes] = time.split(":");

          scheduleReference = new Date(date);
          scheduleReference = setHours(scheduleReference, +hours);
          scheduleReference = setMinutes(scheduleReference, +minutes);
        } else if (type.value === ScheduleType.Repeat) {
          const [hours, minutes] = time.split(":");

          scheduleReference = new Date(date);
          scheduleReference = setHours(scheduleReference, +hours);
          scheduleReference = setMinutes(scheduleReference, +minutes);

          if (frequency.value === "hourly") {
            scheduleType = TaskScheduleType.Hourly;
          } else if (frequency.value === "daily") {
            scheduleType = TaskScheduleType.Daily;
          } else if (frequency.value === "weekly") {
            scheduleType = TaskScheduleType.Weekly;
          } else if (frequency.value === "monthly") {
            scheduleType = TaskScheduleType.Monthly;
          }
        }

        parentForm.setValue("schedule.scheduleReference", scheduleReference);
        parentForm.setValue("schedule.scheduleFactor", +every);
        parentForm.setValue("schedule.scheduleType", scheduleType);
      }
    );

    return () => {
      watcher?.unsubscribe();
    };
  }, [parentForm.setValue, scheduleForm.watch]);

  // Re-init all fields when schedule type change
  useEffect(() => {
    scheduleForm.resetField("date");
    scheduleForm.resetField("time");
    scheduleForm.resetField("every");
    scheduleForm.resetField("minute");
    scheduleForm.resetField("frequency");
  }, [selectedScheduleType, scheduleForm.setValue]);

  return (
    <>
      <Select
        options={typeOptions}
        control={scheduleForm.control}
        name="type"
      />
      {selectedScheduleType?.value === ScheduleType.AtTime && (
        <Select
          options={minuteOptions}
          control={scheduleForm.control}
          name="minute"
        />
      )}

      {(selectedScheduleType?.value === ScheduleType.AtDateTime ||
        selectedScheduleType?.value === ScheduleType.Repeat) && (
        <Stack direction="row" spacing="4">
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

      {selectedScheduleType?.value === ScheduleType.Repeat && (
        <Stack direction="row" spacing="4" alignItems="flex-end">
          <FormControl
            label={t("Every")}
            control={scheduleForm.control}
            name="every"
            type={FormControlType.Number}
          />
          <Select
            options={frequencyOptions}
            control={scheduleForm.control}
            name="frequency"
          />
        </Stack>
      )}
    </>
  );
}
