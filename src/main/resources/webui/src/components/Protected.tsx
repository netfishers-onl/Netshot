import { useAuth } from "@/contexts";
import { Level } from "@/types";
import { PropsWithChildren, useMemo } from "react";
import { useTranslation } from "react-i18next";

export type ProtectedProps = PropsWithChildren<{
  minLevel: Level;
}>;

export default function Protected(props: ProtectedProps) {
  const { children, minLevel } = props;
  const { user } = useAuth();
  const isAllowed = useMemo(() => (user?.level || 0) >= minLevel, [minLevel, user]);

  return isAllowed ? children : null;
}
