import httpClient, { HttpEventType } from "@/api/httpClient";
import { Navbar } from "@/components";
import { Dialog } from "@/dialog";
import { Stack } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { Outlet, useNavigate } from "react-router-dom";

export default function MainScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  /**
   * Open session expired modal when catch 403 forbidden response from httpClient
   */
  const forbiddenDialog = Dialog.useAlert({
    title: t("Your session has expired"),
    description: t(
      "Oops, your session has expired. Please re-authenticate to continue"
    ),
  });

  httpClient.on(HttpEventType.Forbidden, () => {
    forbiddenDialog.open();
    navigate("/signin");
  });

  return (
    <Stack h="100vh" spacing="0">
      <Navbar />
      <Stack as="main" flex="1" overflow="auto">
        <Outlet />
      </Stack>
    </Stack>
  );
}
