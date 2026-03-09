import { Box, Heading, Spacer, Stack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { Brand } from "@/components"
import { SigninForm } from "@/features/auth"

export function SigninScreen() {
  const { t } = useTranslation()

  return (
    <Stack direction="row" gap="0" h="100vh">
      <Stack justifyContent="center" alignItems="center" flex="1">
        <Stack mx="auto" width="40%" gap="12">
          <Stack gap="6">
            <Stack gap="10">
              <Brand css={{ w: 140 }} />
              <Heading as="h4" fontWeight="semibold" fontSize="2xl">
                {t("Please sign in")}
              </Heading>
            </Stack>
            <SigninForm />
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
        <Spacer />
        <Heading fontSize="8xl" color="white" fontWeight="medium" maxW="400px" lineHeight="100%">
          {t("Network orchestration ")}
          <Box as="span" color="green.500">
            {t("made easy.")}
          </Box>
        </Heading>
      </Stack>
    </Stack>
  )
}
