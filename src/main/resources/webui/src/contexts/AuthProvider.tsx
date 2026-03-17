import api from "@/api"
import { QUERIES } from "@/constants"
import { Center, Spinner, Stack, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { AuthContext } from "./auth"

export type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { t } = useTranslation()

  const { data, isPending, isError } = useQuery({
    queryKey: [QUERIES.USER],
    queryFn: api.user.me,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  if (isPending) {
    return (
      <Center h="100vh">
        <Stack gap="3" alignItems="center">
          <Spinner size="lg" />
          <Text>{t("Netshot is loading...")}</Text>
        </Stack>
      </Center>
    )
  }

  return (
    <AuthContext.Provider value={{ user: data?.user, oidcInfo: data?.oidcInfo, serverError: isError }}>
      {children}
    </AuthContext.Provider>
  )
}
