import api from "@/api"
import { Diagnostic } from "@/types"
import { search, sortAlphabetical } from "@/utils"
import { Center, Spinner, Stack, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useCallback, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { QUERIES } from "../../constants"
import { useDiagnosticSidebar } from "../../contexts/DiagnosticSidebarProvider"
import DiagnosticItem from "./DiagnosticItem"

export default function DeviceSidebarSearchList() {
  const ctx = useDiagnosticSidebar()
  const { t } = useTranslation()

  const { data, isPending, isSuccess } = useQuery({
    queryKey: [QUERIES.DIAGNOSTIC_SEARCH_LIST, ctx.query],
    queryFn: async () => {
      return api.diagnostic.getAll()
    },
    select: useCallback(
      (res: Diagnostic[]): Diagnostic[] => {
        return sortAlphabetical(search(res, "name").with(ctx.query), "name")
      },
      [ctx.query]
    ),
  })

  useEffect(() => {
    if (isSuccess) {
      ctx.setTotal(data.length)
      ctx.setData(data)
    }
  }, [isSuccess, data, ctx])

  if (isPending) {
    return (
      <Stack alignItems="center" justifyContent="center" py="6" flex="1">
        <Spinner />
      </Stack>
    )
  }

  if (data?.length === 0) {
    return (
      <Center flex="1">
        <Text>{t("diagnostic.notFound")}</Text>
      </Center>
    )
  }

  return (
    <Stack p="6" gap="1" overflow="auto" flex="1">
      {data?.map((diagnostic) => (
        <DiagnosticItem diagnostic={diagnostic} key={diagnostic?.id} />
      ))}
    </Stack>
  )
}
