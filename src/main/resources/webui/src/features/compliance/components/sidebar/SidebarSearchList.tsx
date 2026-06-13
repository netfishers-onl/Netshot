import { Center, Spinner, Stack, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { usePoliciesWithSearch } from "../../api"
import { useSidebar } from "../../contexts/SidebarProvider"
import PolicyItem from "./PolicyItem"

export default function SidebarSearchList() {
  const ctx = useSidebar()
  const { t } = useTranslation()

  const { data: policies, isPending } = usePoliciesWithSearch(ctx.query)

  if (isPending) {
    return (
      <Stack alignItems="center" justifyContent="center" py="6" flex="1">
        <Spinner />
      </Stack>
    )
  }

  if (policies?.length === 0) {
    return (
      <Center flex="1">
        <Text>{t("policy.notFound")}</Text>
      </Center>
    )
  }

  return (
    <Stack px="6" gap="3" overflow="auto" flex="1">
      {policies?.map((policy) => (
        <PolicyItem key={policy?.id} policy={policy} forceExpand />
      ))}
    </Stack>
  )
}
