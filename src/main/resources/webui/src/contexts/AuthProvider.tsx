import { Center, Spinner, Stack, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import api from "@/api";
import { QUERIES } from "@/constants";

import { AuthContext } from "./auth";


export type AuthProviderProps = {
  children: ReactNode;
};

/**
 * Dashboard context
 * @note available only when the user is connected
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const { t } = useTranslation();

  const { data: user, isPending } = useQuery({
    queryKey: [QUERIES.USER],
    queryFn: api.user.me,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return isPending ? (
    <Center h="100vh">
      <Stack spacing="3" alignItems="center">
        <Spinner size="lg" />
        <Text>{t("Netshot is loading...")}</Text>
      </Stack>
    </Center>
  ) : (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  );
}
