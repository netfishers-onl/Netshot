import { Brand } from "@/components"
import { Button, Heading, Stack, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { LuHouse } from "react-icons/lu"
import { useNavigate } from "react-router"

export type NotFoundScreenProps = {
  /** Render as a standalone full-page (with brand, no navbar). Set to false when nested inside a layout that already has a navbar. */
  fullPage?: boolean
}

export function NotFoundScreen(props: NotFoundScreenProps) {
  const { fullPage = true } = props
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <Stack
      h={fullPage ? "100vh" : undefined}
      flex={fullPage ? undefined : "1"}
      alignItems="center"
      justifyContent="center"
      gap="8"
      px="4"
    >
      {fullPage && <Brand css={{ w: 140 }} />}
      <Stack gap="2" alignItems="center" textAlign="center">
        <Text fontSize="6xl" fontWeight="bold" color="green.600" lineHeight="1">
          404
        </Text>
        <Heading as="h4" fontSize="xl">
          {t("common.pageNotFound")}
        </Heading>
        <Text color="grey.400">{t("common.pageNotFoundDescription")}</Text>
      </Stack>
      <Button variant="primary" onClick={() => navigate(fullPage ? "/" : "/app")}>
        <LuHouse />
        {t("common.backToHome")}
      </Button>
    </Stack>
  )
}
