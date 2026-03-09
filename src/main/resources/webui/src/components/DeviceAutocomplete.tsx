import api, { DeviceSearchResult } from "@/api"
import { SimpleDevice } from "@/types"
import { Combobox, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { useAutocomplete, WithFilterBy } from "./autocomplete"
import { Autocomplete, AutocompleteProps } from "./autocomplete/Autocomplete"

export type DeviceAutocompleteProps = Omit<
  AutocompleteProps<SimpleDevice>,
  "collection" | "renderItem"
> &
  WithFilterBy<SimpleDevice>

export default function DeviceAutocomplete(props: DeviceAutocompleteProps) {
  const {
    filterBy,
    placeholder,
    onSelectItem,
    selectionBehavior = "clear",
    ...autocompleteProps
  } = props

  const { t } = useTranslation()

  const { entities, query, isPending, ...autocompleteConfig } = useAutocomplete<
    SimpleDevice,
    DeviceSearchResult
  >({
    initialItems: [],
    itemToString: (item) => item.name,
    itemToValue: (item) => item.id.toString(),
    queryKey: ["autocomplete:device"],
    queryFn(query) {
      return api.device.search({
        query: `[Name] CONTAINSNOCASE "${query}"`,
      })
    },
    select(data) {
      return data.devices
    },
    filterBy,
  })

  const notFoundMessage = (
    <Text>{t(query?.length > 0 ? "No device found" : "Start typing to find device by name")} </Text>
  )

  return (
    <Autocomplete
      onValueChange={(evt) => {
        const device = entities.find((item) => item.id === +evt.value[0])

        if (!device) {
          return
        }

        onSelectItem(device)
      }}
      {...autocompleteConfig}
      placeholder={placeholder || t("Search device...")}
      notFoundMessage={notFoundMessage}
      openOnClick={true}
      selectionBehavior={selectionBehavior}
      closeOnSelect={true}
      isLoading={isPending}
      renderItem={(item) => (
        <Combobox.Item item={item} key={item.id}>
          {item.name}
          <Combobox.ItemIndicator />
        </Combobox.Item>
      )}
      {...autocompleteProps}
    />
  )
}
