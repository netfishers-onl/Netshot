import { Alert } from "@chakra-ui/react"
import { Box, Heading, Spacer, Stack } from "@chakra-ui/react"
import { Trans, useTranslation } from "react-i18next"

import { Brand } from "@/components"
import { useAuth } from "@/contexts"
import { SigninForm } from "@/features/auth"

export function SigninScreen() {
  const { t } = useTranslation()
  const { serverError } = useAuth()

  return (
    <Stack direction="row" gap="0" h="100vh">
      <Stack justifyContent="center" alignItems="center" flex="1">
        <Stack mx="auto" width="40%" gap="12">
          <Stack gap="6">
            <Stack gap="10">
              <Heading as="h4" fontWeight="semibold" fontSize="2xl">
                {t("pleaseSignIn")}
              </Heading>
            </Stack>
            {serverError ? (
              <Alert.Root bg="grey.50" border="1px solid {colors.grey.100}">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>{t("unableToContactTheServer")}</Alert.Title>
                  <Alert.Description>{t("pleaseCheckTheNetshotServerStatusRefreshThePageToTryAgain")}</Alert.Description>
                </Alert.Content>
              </Alert.Root>
            ) : (
              <SigninForm />
            )}
          </Stack>
        </Stack>
      </Stack>
      <Stack
        direction="column"
        p="60px"
        bg="green.1100"
        flex="0 0 50%"
        gap="5"
        justifyContent="center"
      >
        <Brand mode="dark" css={{ w: 140 }} />
        <Spacer />
        <Heading fontSize="8xl" color="white" fontWeight="medium" maxW="400px" lineHeight="100%">
          <Trans
            i18nKey="networkOrchestrationMadeEasy"
            components={{ green: <Box as="span" color="green.500" /> }}
          />
        </Heading>
      </Stack>
    </Stack>
  )
}
