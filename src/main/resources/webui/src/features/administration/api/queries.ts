import { QUERIES } from "@/constants"
import { useQuery } from "@tanstack/react-query"
import { QUERIES as ADMIN_QUERIES } from "../constants"
import { fetchDomains, fetchVaultInstances } from "./fetcher"

export function useDomains() {
  return useQuery({
    queryKey: [QUERIES.DOMAIN_LIST],
    queryFn: fetchDomains,
  })
}

export function useVaultInstances() {
  return useQuery({
    queryKey: [ADMIN_QUERIES.ADMIN_VAULT_INSTANCES],
    queryFn: fetchVaultInstances,
  })
}
