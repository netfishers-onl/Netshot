import { useAuth } from "@/contexts";
import { Dialog } from "@/dialog";
import { Level } from "@/types";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, Outlet } from "react-router";

export type ProtectedRouteProps = {
  minLevel: Level;
};

export default function ProtectedRoute(props: ProtectedRouteProps) {
  const { minLevel } = props;
  const { user } = useAuth();
  const isAllowed = useMemo(() => (user?.level || 0) >= minLevel, [minLevel, user]);

  if (!isAllowed) {
    return null;
  }

  return (
    <Outlet />
  );
}
