import { addMonths } from "date-fns"
import api, { RuleStateChangePayload } from "@/api"
import { NetshotError } from "@/api/httpClient"
import { useDebounce, useToast } from "@/hooks"
import { LuArrowLeft, LuArrowRight, LuCalendar, LuSearch } from "react-icons/lu"
import { useDialogConfig } from "@/dialog"
import { ExemptedDevice, Rule, SimpleDevice } from "@/types"
import { useLocalization } from "@/i18n"
import {
  Box,
  Button,
  Center,
  CloseButton,
  type CollectionItem,
  DatePicker,
  Dialog,
  Field,
  IconButton,
  Input,
  InputGroup,
  Listbox,
  type ListboxRootProps,
  type ListboxValueChangeDetails,
  Portal,
  Stack,
  Text,
  useListCollection,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react"
import { useTranslation } from "react-i18next"
import { QUERIES } from "../constants"

type ListboxRenderProps<T extends CollectionItem> = {
  contentRef?: RefObject<HTMLDivElement>
  renderItem?: (item: T, itemValue: string, itemLabel: string) => ReactNode
  emptyMessage?: string
} & ListboxRootProps<T>

function ListboxRender<T extends CollectionItem>(props: ListboxRenderProps<T>) {
  const { collection, contentRef, renderItem, emptyMessage, ...rest } = props
  return (
    <Listbox.Root {...rest} collection={collection} selectionMode="multiple">
      <Listbox.Content minH="96" ref={contentRef}>
        {collection.items.length > 0 ? (
          collection.items.map((item) => {
            const itemValue = collection.getItemValue(item)
            const itemLabel = collection.stringifyItem(item)
            return (
              <Listbox.Item item={item} key={itemValue} flex="0">
                {renderItem ? (
                  renderItem(item, itemValue, itemLabel)
                ) : (
                  <Listbox.ItemText>{itemLabel}</Listbox.ItemText>
                )}
                <Listbox.ItemIndicator />
              </Listbox.Item>
            )
          })
        ) : (
          <Center boxSize="full" p="4" color="fg.muted" textStyle="sm">
            {emptyMessage}
          </Center>
        )}
      </Listbox.Content>
    </Listbox.Root>
  )
}

export type EditRuleExemptedDeviceDialogProps = {
  policyId: number
  rule: Rule
}

export default function EditRuleExemptedDeviceDialog(props: EditRuleExemptedDeviceDialogProps) {
  const { policyId, rule } = props
  const { t, i18n } = useTranslation()
  const { formatDate, numberToCalendarDate, calendarDateToTimestamp, datePlaceholder } = useLocalization()
  const now = Date.now()
  const toast = useToast()
  const dialogConfig = useDialogConfig()
  const queryClient = useQueryClient()

  const [deviceQuery, setDeviceQuery] = useState("")
  const debouncedQuery = useDebounce(deviceQuery, 200)
  const [leftValues, setLeftValues] = useState<string[]>([])
  const [rightValues, setRightValues] = useState<string[]>([])
  const [exemptedIds, setExemptedIds] = useState<Set<number>>(new Set())
  const [newExpirationDate, setNewExpirationDate] = useState<number>(() => addMonths(new Date(), 3).getTime())
  const initialized = useRef(false)

  const leftCollection = useListCollection<SimpleDevice>({
    initialItems: [],
    itemToValue: (d) => d.id.toString(),
    itemToString: (d) => d.name,
  })

  const rightCollection = useListCollection<ExemptedDevice>({
    initialItems: [],
    itemToValue: (d) => d.id.toString(),
    itemToString: (d) => d.name,
  })

  const { data: exemptedDevices } = useQuery({
    queryKey: [QUERIES.RULE_EXEMPTED_DEVICES, rule?.id],
    queryFn: () => api.rule.getAllExemptedDevices(rule?.id),
  })

  const { data: searchResult } = useQuery({
    queryKey: ["exemption:device:search", debouncedQuery],
    queryFn: () =>
      api.device.search({
        query: `[Name] containsnocase "${debouncedQuery}"`,
        limit: 20,
      }),
  })

  useEffect(() => {
    if (!initialized.current && exemptedDevices !== undefined) {
      initialized.current = true
      rightCollection.set(exemptedDevices)
      setExemptedIds(new Set(exemptedDevices.map((d) => d.id)))
    }
  }, [exemptedDevices])

  useEffect(() => {
    const filtered = (searchResult?.devices ?? []).filter((d) => !exemptedIds.has(d.id))
    leftCollection.set(filtered)
  }, [searchResult, exemptedIds])

  const updateMutation = useMutation({
    mutationFn: async (payload: RuleStateChangePayload) =>
      api.rule.updateExemptedDevice(rule.id, payload),
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  function transferToRight() {
    const selected = leftCollection.collection.items.filter((item) =>
      leftValues.includes(leftCollection.collection.getItemValue(item))
    )
    rightCollection.append(...selected.map((device) => ({ ...device, expirationDate: newExpirationDate } as unknown as ExemptedDevice)))
    setExemptedIds((prev) => {
      const next = new Set(prev)
      selected.forEach((d) => next.add(d.id))
      return next
    })
    setLeftValues([])
  }

  function transferToLeft() {
    const removedIds = rightCollection.collection.items
      .filter((item) => rightValues.includes(rightCollection.collection.getItemValue(item)))
      .map((d) => d.id)
    rightCollection.remove(...rightValues)
    setExemptedIds((prev) => {
      const next = new Set(prev)
      removedIds.forEach((id) => next.delete(id))
      return next
    })
    setRightValues([])
  }

  async function applyChanges() {
    const exemptions = rightCollection.collection.items.reduce(
      (acc, device) => {
        acc[device.id] = device.expirationDate
        return acc
      },
      {} as Record<number, number>
    )

    await updateMutation.mutateAsync({
      enabled: rule.enabled,
      exemptions,
      name: rule.name,
    })

    toast.success({
      title: t("common.success"),
      description: t("policy.rule.exemptedDevicesUpdated", { name: rule.name }),
    })

    queryClient.invalidateQueries({ queryKey: [QUERIES.POLICY_RULE_LIST, policyId] })
    queryClient.invalidateQueries({ queryKey: [QUERIES.RULE_DETAIL, policyId, rule.id] })
    queryClient.invalidateQueries({ queryKey: [QUERIES.RULE_EXEMPTED_DEVICES] })

    dialogConfig.close()
  }

  const dateValue = numberToCalendarDate(newExpirationDate)

  return (
    <Dialog.Root
      open={dialogConfig.props.isOpen}
      placement="center"
      motionPreset="slide-in-bottom"
      size="xl"
      variant={dialogConfig.props.variant}
      closeOnInteractOutside={false}
      scrollBehavior="inside"
      onOpenChange={(e) => {
        if (!e.open) dialogConfig.close()
      }}
      onExitComplete={() => {
        if (dialogConfig.props?.onCancel) dialogConfig.props.onCancel()
        dialogConfig.remove()
      }}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header as="h3" fontSize="2xl" fontWeight="semibold">
              {t("policy.rule.exemptedDevices")}
              <Dialog.CloseTrigger />
            </Dialog.Header>
            <Dialog.Body pb="7">
              <Stack direction="row" gap="4" alignItems="stretch">
                {/* Left column: search + device pool */}
                <Stack flex="1" gap="2">
                  <InputGroup startElement={<LuSearch />}>
                    <Input
                      placeholder="Search for a device to exempt"
                      value={deviceQuery}
                      onChange={(e) => setDeviceQuery(e.target.value)}
                    />
                  </InputGroup>
                  <Box borderWidth="1px" borderColor="grey.100" borderRadius="xl" overflow="hidden">
                    <ListboxRender
                      collection={leftCollection.collection}
                      value={leftValues}
                      onValueChange={(e: ListboxValueChangeDetails) => setLeftValues(e.value)}
                      emptyMessage={deviceQuery ? t("device.noDeviceFound") : t("device.startTypingToFind")}
                      renderItem={(device, _, itemLabel) => (
                        <Listbox.ItemText>
                          <Stack gap="0">
                            <Text fontWeight="medium" textStyle="sm">{itemLabel}</Text>
                            <Text textStyle="xs" color="fg.muted">{device.family}</Text>
                          </Stack>
                        </Listbox.ItemText>
                      )}
                    />
                  </Box>
                </Stack>

                {/* Transfer buttons */}
                <Stack gap="2" alignItems="center" justifyContent="center">
                  <IconButton
                    variant="outline"
                    aria-label={t("common.add")}
                    disabled={leftValues.length === 0}
                    onClick={transferToRight}
                  >
                    <LuArrowRight />
                  </IconButton>
                  <IconButton
                    variant="outline"
                    aria-label={t("common.remove")}
                    disabled={rightValues.length === 0}
                    onClick={transferToLeft}
                  >
                    <LuArrowLeft />
                  </IconButton>
                </Stack>

                {/* Right column: date selector + exempted devices */}
                <Stack flex="1" gap="2">
                  <Field.Root>
                    <Stack direction="row" alignItems="center" gap="3">
                      <Field.Label mb="0" whiteSpace="nowrap">
                        {t("time.endDate")}
                      </Field.Label>
                      <DatePicker.Root
                        value={dateValue ? [dateValue] : []}
                        onValueChange={({ value }) => {
                          if (value.length > 0) setNewExpirationDate(calendarDateToTimestamp(value[0]))
                        }}
                        locale={i18n.language}
                        closeOnSelect
                      >
                        <DatePicker.Control>
                          <DatePicker.Input placeholder={datePlaceholder} />
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
                    </Stack>
                  </Field.Root>
                  <Box borderWidth="1px" borderColor="grey.100" borderRadius="xl" overflow="hidden">
                    <ListboxRender
                      collection={rightCollection.collection}
                      value={rightValues}
                      onValueChange={(e: ListboxValueChangeDetails) => setRightValues(e.value)}
                      emptyMessage={t("policy.rule.noExemptedDeviceSelected")}
                      renderItem={(device, _, itemLabel) => (
                        <Listbox.ItemText>
                          <Stack gap="0">
                            <Text fontWeight="medium" textStyle="sm">{itemLabel}</Text>
                            <Text textStyle="xs" color={device.expirationDate < now ? "fg.error" : "fg.muted"}>
                              {t("time.expiresOn", { date: formatDate(device.expirationDate) })}
                            </Text>
                          </Stack>
                        </Listbox.ItemText>
                      )}
                    />
                  </Box>
                </Stack>
              </Stack>
            </Dialog.Body>
            <Dialog.Footer>
              <Stack direction="row" gap="3">
                <Button variant="default" onClick={() => dialogConfig.close()}>
                  {t("common.cancel")}
                </Button>
                <Button variant="primary" loading={updateMutation.isPending} onClick={applyChanges}>
                  {t("common.applyChanges")}
                </Button>
              </Stack>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" variant="outline" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
