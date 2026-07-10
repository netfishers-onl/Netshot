import api from "@/api"
import { useDebounce } from "@/hooks"
import { SimpleDevice } from "@/types"
import { DeviceListItem } from "@/features/device/components"
import {
  Box,
  Center,
  type CollectionItem,
  Heading,
  IconButton,
  Input,
  InputGroup,
  Listbox,
  type ListboxRootProps,
  type ListboxValueChangeDetails,
  Stack,
  Text,
  useListCollection,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react"
import { useFormContext, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { LuArrowLeft, LuArrowRight, LuSearch } from "react-icons/lu"
import { GroupForm } from "./types"

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

export default function StaticGroupForm() {
  const { t } = useTranslation()
  const form = useFormContext<GroupForm>()

  const [deviceQuery, setDeviceQuery] = useState("")
  const debouncedQuery = useDebounce(deviceQuery, 200)
  const [leftValues, setLeftValues] = useState<string[]>([])
  const [rightValues, setRightValues] = useState<string[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const initialized = useRef(false)

  const formDevices = useWatch({ control: form.control, name: "staticDevices" })

  const leftCollection = useListCollection<SimpleDevice>({
    initialItems: [],
    itemToValue: (d) => d.id.toString(),
    itemToString: (d) => d.name,
  })

  const rightCollection = useListCollection<SimpleDevice>({
    initialItems: [],
    itemToValue: (d) => d.id.toString(),
    itemToString: (d) => d.name,
  })

  const { data: searchResult } = useQuery({
    queryKey: ["static-group:device:search", debouncedQuery],
    queryFn: () =>
      api.device.search({
        query: `[Name] containsnocase "${debouncedQuery}"`,
        limit: 20,
      }),
  })

  useEffect(() => {
    if (!initialized.current && (formDevices ?? []).length > 0) {
      initialized.current = true
      rightCollection.set(formDevices)
      setSelectedIds(new Set(formDevices.map((d) => d.id)))
    }
  }, [formDevices])

  useEffect(() => {
    const filtered = (searchResult?.devices ?? []).filter((d) => !selectedIds.has(d.id))
    leftCollection.set(filtered)
  }, [searchResult, selectedIds])

  function transferToRight() {
    const selected = leftCollection.collection.items.filter((item) =>
      leftValues.includes(leftCollection.collection.getItemValue(item))
    )
    rightCollection.append(...selected)
    const newIds = new Set(selectedIds)
    selected.forEach((d) => newIds.add(d.id))
    setSelectedIds(newIds)
    form.setValue("staticDevices", [...rightCollection.collection.items, ...selected])
    setLeftValues([])
  }

  function transferToLeft() {
    const removedIdSet = new Set(
      rightCollection.collection.items
        .filter((item) => rightValues.includes(rightCollection.collection.getItemValue(item)))
        .map((d) => d.id)
    )
    rightCollection.remove(...rightValues)
    const newIds = new Set(selectedIds)
    removedIdSet.forEach((id) => newIds.delete(id))
    setSelectedIds(newIds)
    form.setValue(
      "staticDevices",
      rightCollection.collection.items.filter((item) => !removedIdSet.has(item.id))
    )
    setRightValues([])
  }

  return (
    <Stack flex="1" gap="5" overflow="auto">
      <Heading as="h4" size="md">
        {t("group.members")}
      </Heading>
      <Stack direction="row" gap="4" alignItems="stretch" flex="1">
        <Stack flex="1" minW="0" gap="2">
          <InputGroup startElement={<LuSearch />}>
            <Input
              placeholder={t("device.search")}
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
                  <DeviceListItem device={device} />
                </Listbox.ItemText>
              )}
            />
          </Box>
          <Text textStyle="xs" color="fg.muted" px="3">{t("device.searchLimitNotice", { count: 20 })}</Text>
        </Stack>

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

        <Stack flex="1" minW="0" gap="2">
          <Box borderWidth="1px" borderColor="grey.100" borderRadius="xl" overflow="hidden">
            <ListboxRender
              collection={rightCollection.collection}
              value={rightValues}
              onValueChange={(e: ListboxValueChangeDetails) => setRightValues(e.value)}
              emptyMessage={t("device.noDevicesSelected")}
              renderItem={(device, _, itemLabel) => (
                <Listbox.ItemText>
                  <DeviceListItem device={device} />
                </Listbox.ItemText>
              )}
            />
          </Box>
        </Stack>
      </Stack>
    </Stack>
  )
}
