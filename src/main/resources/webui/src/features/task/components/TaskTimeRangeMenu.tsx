import { FormControl } from "@/components"
import { FormControlType } from "@/components/FormControl"
import { useLocalization } from "@/i18n"
import { Button, Menu, Portal, Separator, SimpleGrid, Stack, Text } from "@chakra-ui/react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { LuChevronDown, LuClock } from "react-icons/lu"
import { TIME_RANGE_PRESETS } from "../constants"
import { useTaskFilterStore } from "../stores/useTaskFilterStore"

type AbsoluteRangeForm = {
  from?: number
  to?: number
}

export default function TaskTimeRangeMenu() {
  const { t } = useTranslation()
  const { formatDayMonth, startOfNextDay } = useLocalization()
  const [open, setOpen] = useState(false)

  const preset = useTaskFilterStore((s) => s.preset)
  const customFrom = useTaskFilterStore((s) => s.customFrom)
  const customTo = useTaskFilterStore((s) => s.customTo)
  const setPreset = useTaskFilterStore((s) => s.setPreset)
  const setCustomRange = useTaskFilterStore((s) => s.setCustomRange)

  const form = useForm<AbsoluteRangeForm>({
    values: { from: customFrom ?? undefined, to: customTo ?? undefined },
  })

  function applyAbsoluteRange(values: AbsoluteRangeForm) {
    if (values.from && values.to) {
      setCustomRange(values.from, startOfNextDay(values.to) - 1)
      setOpen(false)
    }
  }

  function applyPreset(label: string) {
    setPreset(label)
    setOpen(false)
  }

  const hasCustomRange = customFrom != null && customTo != null
  const label = hasCustomRange
    ? `${formatDayMonth(customFrom)} – ${formatDayMonth(customTo)}`
    : t(preset)

  return (
    <Menu.Root open={open} onOpenChange={(e) => setOpen(e.open)}>
      <Menu.Trigger asChild>
        <Button>
          <LuClock />
          {t("task.timeRangeLabel", { label })}
          <LuChevronDown />
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content w="320px" p="3">
            <Stack gap="3">
              <Text fontSize="xs" fontWeight="semibold" color="grey.400" textTransform="uppercase" letterSpacing="wide">
                {t("task.quickRanges")}
              </Text>
              <SimpleGrid columns={2} gap="2">
                {TIME_RANGE_PRESETS.map((p) => {
                  const selected = preset === p.label && !hasCustomRange
                  return (
                    <Button
                      key={p.label}
                      size="sm"
                      justifyContent="start"
                      fontWeight={selected ? "semibold" : "normal"}
                      bg={selected ? "green.50" : undefined}
                      color={selected ? "green.700" : undefined}
                      borderColor={selected ? "green.100" : undefined}
                      onClick={() => applyPreset(p.label)}
                    >
                      {t(p.label)}
                    </Button>
                  )
                })}
              </SimpleGrid>
              <Separator />
              <Text fontSize="xs" fontWeight="semibold" color="grey.400" textTransform="uppercase" letterSpacing="wide">
                {t("task.absoluteRange")}
              </Text>
              <Stack gap="2" asChild>
                <form onSubmit={form.handleSubmit(applyAbsoluteRange)}>
                  <Stack direction="row" gap="2">
                    <FormControl control={form.control} name="from" type={FormControlType.Date} label={t("task.from")} flex="1" />
                    <FormControl control={form.control} name="to" type={FormControlType.Date} label={t("task.to")} flex="1" />
                  </Stack>
                  <Button type="submit" size="sm" variant="primary">
                    {t("common.applyFilters")}
                  </Button>
                </form>
              </Stack>
            </Stack>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  )
}
