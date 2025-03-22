import {
  Alert,
  Avatar,
  Button,
  ButtonGroup,
  ListItem,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Spacer,
  Stack,
  Text,
  UnorderedList,
} from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MouseEvent, ReactElement, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import api from "@/api";
import { getUserLevelLabel, QUERIES } from "@/constants";
import { useAuth } from "@/contexts";
import { Dialog } from "@/dialog";
import useToast from "@/hooks/useToast";
import { User } from "@/types";

import Icon from "../Icon";
import UserSettingButton from "./UserSettingButton";

const LIBRARIES = [
  "Hibernate",
  "Quartz",
  "Jsch",
  "Apache Commons",
  "Grizzly",
  "Jersey",
  "Jackson",
  "Java DiffUtils",
  "SLF4j",
  "React",
  "ChakraUI",
  "framer-motion",
  "@tanstack/react-query",
  "Chart.js",
  "JRadius",
  "Apache PO",
  "Swagger",
];

function AboutContent() {
  const { t } = useTranslation();


  const { data: serverInfo } = useQuery({
    queryKey: [QUERIES.SERVER_INFO],
    queryFn: api.auth.serverInfo,
  });

  const serverVersion = useMemo(() => serverInfo?.serverVersion,
    [serverInfo]);

  return (
    <Stack spacing="4">
      <Alert status="info" bg="blue.50">
        {t(
          "Connected to Netshot version {{ version }}", {
            version: serverVersion,
          })}
      </Alert>
      <Stack>
        <Text as="b">
          {t("Thank you for using Netshot. Netshot is free open-source software.")}
        </Text>
        <Text>
          {t(
            "Copyright 2014-{{ year }}, Netshot SASU, All Rights Reserved",
            { year: new Date().getFullYear() }
          )}
        </Text>
      </Stack>
      <Stack>
        <ButtonGroup justifyContent="center" variant="outline" isAttached>
          <Button
            as="a"
            target="_blank"
            leftIcon={<Icon name="home" />}
            href="https://www.netshot.net"
          >
            {t("Home page")}
          </Button>
          <Button
            as="a"
            target="_blank"
            leftIcon={<Icon name="atSign" />}
            href="mailto:contact@netshot.net"
          >
            {t("Contact")}
          </Button>
          <Button
            as="a"
            target="_blank"
            leftIcon={<Icon name="gitHub" />}
            href="https://github.com/netfishers-onl/Netshot"
          >
            {t("Source code")}
          </Button>
        </ButtonGroup>
      </Stack>
      <Stack>
        <Text fontWeight="medium">
          {t("Feel free to contact us, we offer services including support and specific development for Netshot.")}
        </Text>
      </Stack>
      <Stack>
        <Text>
          {t(
            "Netshot is distributed \"as is\", without warranty. Netshot SASU can't be held responsible for any damage caused to your devices or you network by the usage of Netshot. Netshot has no relationship with the network device vendors."
          )}
        </Text>
      </Stack>
      <Stack>
        <Text>{t("Netshot makes use of the following libraries:")}</Text>
        <UnorderedList>
          {LIBRARIES.map((lib) => (
            <ListItem display="inline-list-item" marginRight="2">
              {lib}
            </ListItem>
          ))}
        </UnorderedList>
      </Stack>
    </Stack>
  );
}

type AboutModalProps = {
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

function AboutModal(props: AboutModalProps) {
  const { renderItem } = props;
  const { t } = useTranslation();

  const dialog = Dialog.useAlert({
    title: t("About Netshot"),
    description: <AboutContent />,
    size: "xl",
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
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const toast = useToast();

  const levelLabel = useMemo(() => getUserLevelLabel(user?.level), [user]);

  const logoutMutation = useMutation({
    mutationFn: api.auth.signout,
    onError() {
      // @note: The request doesn't return JSON
      toast.error({
        title: t("Error"),
        description: t("An error occured"),
      });
    },
    onSuccess() {
      toast.success({
        title: t("Logout"),
        description: t("You have successfully logged out from Netshot."),
      });
      queryClient.setQueryData<User>([QUERIES.USER], null);
    }
  });

  const logout = useCallback(() => {
    logoutMutation.mutate(user?.id);
  }, [logoutMutation, user?.id]);

  if (!user) {
    return null;
  }

  return (
    <Menu placement="bottom-end">
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
              {levelLabel}
            </Text>
          </Stack>
          <Spacer />
          <Icon color="white" name="chevronDown" />
        </Stack>
      </MenuButton>

      <MenuList>
        <UserSettingButton
          renderItem={(open) => (
            <MenuItem icon={<Icon name="user" />} onClick={open}>
              {t("User Settings")}
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
