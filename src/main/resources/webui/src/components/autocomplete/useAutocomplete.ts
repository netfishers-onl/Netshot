import { useDebounce } from "@/hooks"
import { useListCollection, UseListCollectionProps } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { InputValueChangeDetails } from "node_modules/@chakra-ui/react/dist/types/components/combobox/namespace"
import { useEffect, useMemo, useState } from "react"
import { WithFilterBy } from "./types"

type UseAutocompleteConfig<T extends object, R = unknown> = {
  queryKey: string[]
  queryFn(query: string): Promise<R>
  select(data: R): T[]
} & UseListCollectionProps<T> &
  WithFilterBy<T>

export function useAutocomplete<T extends object, R>(config: UseAutocompleteConfig<T, R>) {
  const { queryKey, queryFn, select, filterBy, ...collectionConfig } = config

  const [query, setQuery] = useState<string>("")
  const debouncedQuery = useDebounce(query, 200)

  const { collection, set } = useListCollection<T>({
    initialItems: [],
    limit: 40,
    ...collectionConfig,
  })

  const {
    data: entities = [],
    isPending,
    isError,
  } = useQuery({
    queryKey: [...queryKey, query],
    queryFn() {
      return queryFn(query)
    },
    select(result) {
      return select(result)
    },
  })

  const filteredEntities = useMemo(() => {
    return filterBy ? filterBy(entities) : entities
  }, [entities, filterBy])

  useEffect(() => {
    set(filteredEntities)
  }, [filteredEntities])

  return {
    entities: filteredEntities,
    query,

    isPending,
    isError,
    collection,
    onInputValueChange: (evt: InputValueChangeDetails) => {
      setQuery(evt.inputValue)
    },
    inputValue: debouncedQuery,
  }
}
