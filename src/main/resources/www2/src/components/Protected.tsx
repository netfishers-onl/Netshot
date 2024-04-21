import { useDashboard } from "@/contexts";
import { Level } from "@/types";
import { PropsWithChildren, useMemo } from "react";
import { useTranslation } from "react-i18next";

export type ProtectedProps = PropsWithChildren<{
  roles: Level[];
}>;

export default function Protected(props: ProtectedProps) {
  const { children, roles } = props;
  const { t } = useTranslation();
  const { user } = useDashboard();
  const isAllowed = useMemo(() => roles.includes(user?.level), [roles, user]);

  return isAllowed ? children : null;
}
