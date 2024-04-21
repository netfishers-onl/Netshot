import api from "@/api";
import { useDashboard } from "@/contexts";
import useToast from "@/hooks/useToast";
import {
  Avatar,
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Spacer,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useMutation } from "@tanstack/react-query";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Icon from "../Icon";
import UserSettingButton from "./UserSettingButton";

export default function NavbarUser() {
  const { user, setUser, level } = useDashboard();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();

  const logoutMutation = useMutation(api.auth.signout, {
    onError() {
      // @note: La requête ne renvoie pas de JSON
      toast.error({
        title: t("Error"),
        description: t("An error occured"),
      });
    },
    onMutate() {
      navigate("/signin");
    },
  });

  const logout = useCallback(() => {
    logoutMutation.mutate(user?.id);
    setUser(null);
  }, [user]);

  if (!user) {
    return null;
  }

  return (
    <Menu matchWidth>
      <MenuButton
        variant="ghost"
        py="2"
        px="3"
        _hover={{
          bg: "green.1000",
        }}
        _active={{
          bg: "green.1000",
        }}
        height="auto"
        as={Button}
      >
        <Stack
          direction="row"
          spacing="4"
          borderRadius="2xl"
          alignItems="center"
          cursor="pointer"
          transition="all .2s ease"
          userSelect="none"
        >
          <Avatar size="md" name={user?.username} />
          <Stack spacing="1" alignItems="start">
            <Text fontWeight="600" color="white">
              {user?.username}
            </Text>
            <Text fontWeight="400" color="grey.400">
              {level}
            </Text>
          </Stack>
          <Spacer />
          <Icon color="white" name="chevronDown" />
        </Stack>
      </MenuButton>

      <MenuList>
        <UserSettingButton
          renderItem={(open) => (
            <MenuItem icon={<Icon name="settings" />} onClick={open}>
              {t("Settings")}
            </MenuItem>
          )}
        />
        <MenuItem onClick={logout} icon={<Icon name="logOut" />}>
          {t("Logout")}
        </MenuItem>
      </MenuList>
    </Menu>
  );
}
