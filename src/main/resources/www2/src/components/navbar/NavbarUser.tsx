import api from "@/api";
import { useDashboard } from "@/contexts";
import { Dialog } from "@/dialog";
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
import { MouseEvent, ReactElement, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Icon from "../Icon";
import UserSettingButton from "./UserSettingButton";

type AboutModalProps = {
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

function AboutModal(props: AboutModalProps) {
  const { renderItem } = props;

  const { t } = useTranslation();

  const dialog = Dialog.useAlert({
    title: t("About Netshot"),
    description: (
      <Stack spacing="8">
        <Stack>
          <Text>
            {t(
              "Thank you for using Netshot. Netshot is a free product, provided by NetFishers."
            )}
          </Text>
        </Stack>
        <Stack>
          <Text>{t("Connected to Netshot version 0.0.0")}</Text>
          <Text>
            Website:{" "}
            <Text
              as="a"
              href="http://www.netfishers.onl/netshot"
              target="_blank"
            >
              http://www.netfishers.onl/netshot
            </Text>
          </Text>
          <Text>
            Contact:{" "}
            <Text as="a" href="netshot@netfishers.onl" target="_blank">
              netshot@netfishers.onl
            </Text>
          </Text>
        </Stack>
        <Stack>
          <Text fontWeight="medium">
            {t(
              "Should you need any help or new features, feel free to contact us!"
            )}
          </Text>
        </Stack>
        <Stack>
          <Text>
            {t(
              'Netshot is distributed "as is", without warranty. NetFishers people can\'t be held responsible for any damage caused to your devices or you network by the usage of Netshot. Netshot has no relationship with the network device vendors.'
            )}
          </Text>
          <Button
            alignSelf="start"
            variant="link"
            as="a"
            href="/api/LICENSE.txt"
            target="_blank"
          >
            {t("See Netshot licensing details")}
          </Button>
        </Stack>
        <Stack>
          <Text>{t("Netshot makes use of the following libraries:")}</Text>
          <Text>
            {t(
              "Hibernate Quartz Jsch Apache Commons Grizzly Jersey Jackson Java DiffUtils SLF4j React ChakraUI framer-motion @tanstack/react-query Chart.js Jasypt JRadius Apache PO Tablesort Swagger ..."
            )}
          </Text>
        </Stack>
        <Text>
          {t(
            "Netshot, Copyright 2014-{{ year }}, NetFishers, All Rights Reserved",
            { year: new Date().getFullYear() }
          )}
        </Text>
      </Stack>
    ),
    size: "lg",
  });

  const open = useCallback(
    (evt: MouseEvent<HTMLButtonElement>) => {
      evt.stopPropagation();
      dialog.open();
    },
    [dialog]
  );

  return renderItem(open);
}

export default function NavbarUser() {
  const { user, level } = useDashboard();
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
        <MenuItem
          as="a"
          href="https://github.com/netfishers-onl/Netshot/wiki/Netshot-User-Guide"
          target="_blank"
          icon={<Icon name="helpCircle" />}
        >
          {t("User guide")}
        </MenuItem>
        <MenuItem
          as="a"
          href={`${import.meta.env.VITE_API_URL}/api-browser/`}
          target="_blank"
          icon={<Icon name="cloud" />}
        >
          {t("API Documentation")}
        </MenuItem>
        <AboutModal
          renderItem={(open) => (
            <MenuItem onClick={open} icon={<Icon name="info" />}>
              {t("About")}
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
