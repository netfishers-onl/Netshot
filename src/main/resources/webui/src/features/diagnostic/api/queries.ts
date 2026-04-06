import api from "@/api"
import { QUERIES } from "@/constants"
import { useQuery } from "@tanstack/react-query"

export function useDiagnostics() {
  return useQuery({
    queryKey: [QUERIES.DIAGNOSTIC_LIST],
    queryFn: () =>
      api.diagnostic.getAll({}),
  })
}
