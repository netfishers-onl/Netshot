import api from "@/api"
import { useQuery } from "@tanstack/react-query"
import { QUERIES } from "../constants"
import { useConfigChangeFilterStore } from "../stores/useConfigChangeFilterStore"

/**
 * Configuration changes matching the Configuration changes screen's applied
 * filters (date range, domain, group). Shared by the histogram and the change
 * list, which derive their views (day bins, day/search-narrowed rows) from the
 * same fetched set instead of issuing separate requests.
 */
export function useConfigChanges() {
  const from = useConfigChangeFilterStore((s) => s.from)
  const to = useConfigChangeFilterStore((s) => s.to)
  const domain = useConfigChangeFilterStore((s) => s.domain)
  const group = useConfigChangeFilterStore((s) => s.group)

  const { data = [], isPending, isFetching, refetch } = useQuery({
    queryKey: [QUERIES.REPORT_CONFIG_CHANGE_LIST, from, to, domain, group],
    queryFn: async () =>
      api.config.getAll({
        after: from,
        before: to,
        domain: domain != null ? [domain] : undefined,
        group: group != null ? [group] : undefined,
      }),
  })

  return { data, isPending, isFetching, refetch }
}
