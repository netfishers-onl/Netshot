import { QUERIES } from "@/constants"
import { useQuery } from "@tanstack/react-query"
import { fetchDomains } from "./fetcher"

export function useDomains() {
  return useQuery({
    queryKey: [QUERIES.DOMAIN_LIST],
    queryFn: fetchDomains,
  })
}
