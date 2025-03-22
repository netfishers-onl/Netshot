import httpClient, { HttpEventCallback, HttpEventType } from "@/api/httpClient";
import { Navbar } from "@/components";
import { QUERIES, REDIRECT_SEARCH_PARAM } from "@/constants";
import { useAuth } from "@/contexts";
import { Dialog } from "@/dialog";
import { User } from "@/types";
import { Stack } from "@chakra-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useNavigate } from "react-router";
import withQuery from "with-query";

enum AuthState {
  AUTH_REQUIRED = 0,
  AUTHENTICATED = 1,
  REAUTH_REQUIRED = 2,
};

export default function MainScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  // Whether there has alreawy been a successfully authentication
  const authState = useRef<AuthState>(AuthState.AUTH_REQUIRED);
  const queryClient = useQueryClient();

  const doRedirect = useCallback(() => {
    if (!location.pathname.startsWith("/signin")) {
      navigate(withQuery("/signin", {
        [REDIRECT_SEARCH_PARAM]: location.pathname,
      }));
    }
  }, [navigate]);

  const forbiddenDialog = Dialog.useAlert({
    title: t("Your session has expired"),
    description: t(
      "Please re-authenticate to continue."
    ),
    onCancel() {
      doRedirect();
    },
  });

  useEffect(() => {
    if (user) {
      authState.current = AuthState.AUTHENTICATED;
    }
    else if (authState.current !== AuthState.REAUTH_REQUIRED) {
      doRedirect();
    }
  }, [doRedirect, user]);

  const onForbidden = useCallback<HttpEventCallback>(
    (url: string, params: RequestInit, response: Response) => {
      if (authState.current === AuthState.AUTHENTICATED) {
        forbiddenDialog.open();
        authState.current = AuthState.REAUTH_REQUIRED;
      }
      queryClient.setQueryData<User>([QUERIES.USER], null);
    },
  [queryClient, forbiddenDialog]);

  useEffect(() => {
    // Register callback on forbidden (403) responses
    httpClient.on(HttpEventType.Forbidden, onForbidden);
    return () => {
      httpClient.off(HttpEventType.Forbidden);
    };
  }, [onForbidden]);

  return (
    <Stack h="100vh" spacing="0">
      <Navbar />
      <Stack as="main" flex="1" overflow="auto">
        <Outlet />
      </Stack>
    </Stack>
  );
}
