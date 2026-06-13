import api from "@/api"
import { Diagnostic } from "@/types"
import { sortAlphabetical } from "@/utils"
import { Center, Spinner, Stack, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { QUERIES } from "../../constants"
import DiagnosticItem from "./DiagnosticItem"

export default function SidebarList() {
  const { t } = useTranslation()

  const { data, isPending } = useQuery({
    queryKey: [QUERIES.DIAGNOSTIC_INFINITE_LIST],
    queryFn: () => api.diagnostic.getAll(),
    select: (res: Diagnostic[]) => sortAlphabetical(res, "name"),
  })

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
    <Stack gap="0" py="4" px="5" overflow="auto" flex="1">
      {data?.map((diagnostic) => (
        <DiagnosticItem diagnostic={diagnostic} key={diagnostic?.id} />
      ))}
    </Stack>
  )
}
