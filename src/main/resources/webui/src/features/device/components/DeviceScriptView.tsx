import api from "@/api"
import Search from "@/components/Search"
import { QUERIES } from "@/constants"
import { Device, Script, SimpleDevice } from "@/types"
import { sortAlphabetical } from "@/utils"
import { Center, Spinner, Stack } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { CreateDeviceScriptButton } from "./CreateDeviceScriptButton"
import DeviceScriptEditor from "./DeviceScriptEditor"
import DeviceScriptItem from "./DeviceScriptItem"

export type DeviceScriptViewProps = {
  devices: SimpleDevice[] | Device[]
}

export default function DeviceScriptView(props: DeviceScriptViewProps) {
  const { devices } = props
  const { t } = useTranslation()
  const [query, setQuery] = useState<string>("")
  const [selected, setSelected] = useState<Script>(null)
  const [pagination] = useState({
    limit: 40,
    offset: 0,
  })

  const { data: scripts, isPending } = useQuery({
    queryKey: [QUERIES.SCRIPT_LIST, query, pagination.offset],
    queryFn: async () => api.script.getAll(pagination),
    select(data: Script[]) {
      return sortAlphabetical(data, "name").filter((item) => item.name?.startsWith(query))
    },
  })

  const onQuery = (value: string) => {
    setQuery(value)
  }

  const onQueryClear = () => {
    setQuery("")
  }

  return (
    <Stack direction="row" gap="7" overflow="auto" flex="1">
      <Stack w="340px" overflow="auto">
        <Stack direction="row">
          <Search onQuery={onQuery} onClear={onQueryClear} placeholder={t("Search...")} />
          <CreateDeviceScriptButton devices={devices} onCreated={(script) => setSelected(script)} />
        </Stack>
        <Stack gap="2" overflow="auto" flex="1">
          {isPending ? (
            <Center flex="1">
              <Spinner />
            </Center>
          ) : (
            <>
              {scripts?.map((script) => (
                <DeviceScriptItem
                  key={script?.id}
                  script={script}
                  onClick={() => setSelected(script)}
                  isSelected={script?.name === selected?.name}
                />
              ))}
            </>
          )}
        </Stack>
      </Stack>
      {selected && (
        <DeviceScriptEditor key={selected?.id} devices={devices} scriptId={selected?.id} />
      )}
    </Stack>
  )
}
