import { useDashboard } from "@/contexts";
import { Dialog } from "@/dialog";
import { Level } from "@/types";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, Outlet } from "react-router-dom";

export type ProtectedRouteProps = {
  roles: Level[];
};

export default function ProtectedRoute(props: ProtectedRouteProps) {
  const { roles } = props;
  const { t } = useTranslation();
  const { user } = useDashboard();
  const isAllowed = useMemo(() => roles.includes(user?.level), [roles, user]);

  const dialog = Dialog.useAlert({
    title: t("Access denied"),
    description: t(
      "Access to this page is denied because you do not have sufficient rights."
    ),
  });

  useEffect(() => {
    if (!isAllowed) {
      dialog.open();
    }
  }, [isAllowed, dialog]);

  return isAllowed ? <Outlet /> : <Navigate to="/" />;
}
