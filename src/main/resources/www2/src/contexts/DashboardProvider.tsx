import api from "@/api";
import { QUERIES, getUserLevelLabel } from "@/constants";
import useToast from "@/hooks/useToast";
import { Level, User } from "@/types";
import { Center, Spinner, Stack, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { ReactNode, createContext, useContext, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

export type DashboardContextType = {
  user: User;
  isAdmin: boolean;
  isExecuteReadWrite: boolean;
  isReadWrite: boolean;
  isOperator: boolean;
  isVisitor: boolean;
  level: string;
};

export const DashboardContext = createContext<DashboardContextType>(null!);
export const useDashboard = () => useContext(DashboardContext);

export type DashboardProviderProps = {
  children: ReactNode;
};

/**
 * Dashboard context
 * @note available only when the user is connected
 */
export function DashboardProvider({ children }: DashboardProviderProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();

  /**
   * Get user data
   */
  const { data: user, isLoading } = useQuery([QUERIES.USER], api.user.me, {
    onError() {
      toast.error({
        title: t("You're not authenticated"),
        description: t("Please log in again"),
      });
      navigate("/signin");
    },
  });

  /**
   * Compute user level to check role permission into the application
   */
  const isAdmin = useMemo(() => {
    return user?.level === Level.Admin;
  }, [user]);

  const isOperator = useMemo(() => {
    return user?.level === Level.Operator;
  }, [user]);

  const isExecuteReadWrite = useMemo(() => {
    return user?.level === Level.ReadWriteCommandOnDevice;
  }, [user]);

  const isReadWrite = useMemo(() => {
    return user?.level === Level.ReadWrite;
  }, [user]);

  const isVisitor = useMemo(() => {
    return user?.level === Level.Visitor;
  }, [user]);

  const level = useMemo(() => getUserLevelLabel(user?.level), [user]);

  const ctx = useMemo(
    () => ({
      user,
      isAdmin,
      isExecuteReadWrite,
      isOperator,
      isReadWrite,
      isVisitor,
      level,
    }),
    [
      user,
      isAdmin,
      isExecuteReadWrite,
      isOperator,
      isReadWrite,
      isVisitor,
      level,
    ]
  );

  return isLoading ? (
    <Center h="100vh">
      <Stack spacing="3" alignItems="center">
        <Spinner size="lg" />
        <Text>{t("Loading application")}</Text>
      </Stack>
    </Center>
  ) : (
    <DashboardContext.Provider value={ctx}>
      {children}
    </DashboardContext.Provider>
  );
}
