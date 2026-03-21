import { Center, Spinner, Stack, Text } from "@chakra-ui/react"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { usePoliciesWithSearch } from "../../api"
import { useSidebar } from "../../contexts/SidebarProvider"
import PolicyItem from "../PolicyItem"

export default function SidebarSearchList() {
  const ctx = useSidebar()
  const { t } = useTranslation()

  const { data: policies, isPending, isSuccess } = usePoliciesWithSearch(ctx.query)

  useEffect(() => {
    if (isSuccess) {
      ctx.setTotal(policies?.length)
      ctx.setData(policies)
    }
  }, [policies, isSuccess])

  if (isPending) {
    return (
      <Stack alignItems="center" justifyContent="center" py="6">
        <Spinner />
      </Stack>
    )
  }

  if (policies?.length === 0) {
    return (
      <Center flex="1">
        <Text>{t("noPolicyFound")}</Text>
      </Center>
    )
  }

  return (
    <Stack p="6" gap="3" overflow="auto">
      {policies?.map((policy) => (
        <PolicyItem key={policy?.id} policy={policy} />
      ))}
    </Stack>
  )
}
