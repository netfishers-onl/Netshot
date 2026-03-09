import { Avatar, Button, Menu, Portal, Spacer, Stack, Text } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import api from "@/api"
import { QUERIES } from "@/constants"
import { useAuth } from "@/contexts"
import useToast from "@/hooks/useToast"
import { User } from "@/types"

import { useUserLevelOptions } from "@/hooks"
import Icon from "../Icon"
import { AboutNetshotModal } from "./AboutNetshotModal"
import UserSettingButton from "./UserSettingButton"

export default function NavbarUser() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const toast = useToast()
  const userLevelOptions = useUserLevelOptions()

  const levelLabel = useMemo(() => userLevelOptions.getLabelByValue(user?.level), [user])

  const logoutMutation = useMutation({
    mutationFn: api.auth.signout,
    onError() {
      // @note: The request doesn't return JSON
      toast.error({
        title: t("Error"),
        description: t("An error occured"),
      })
    },
    onSuccess() {
      toast.success({
        title: t("Logout"),
        description: t("You have successfully logged out from Netshot."),
      })
      queryClient.setQueryData<User>([QUERIES.USER], null)
    },
  })

  const logout = () => {
    logoutMutation.mutate(user?.id)
  }

  if (!user) {
    return null
  }

  return (
    <Menu.Root
      positioning={{
        placement: "bottom-end",
      }}
    >
      <Menu.Trigger asChild>
        <Button
          variant="ghost"
          py="2"
          px="3"
          _hover={{
            bg: "green.1000",
          }}
          _active={{
            bg: "green.1000",
          }}
          _expanded={{
            bg: "green.1000",
          }}
          height="auto"
        >
          <Stack
            direction="row"
            gap="4"
            borderRadius="2xl"
            alignItems="center"
            cursor="pointer"
            transition="all .2s ease"
            userSelect="none"
          >
            <Avatar.Root shape="rounded" size="md" bg="green.500">
              <Avatar.Fallback name={user?.username} />
              {/* <Avatar.Image src="/favicon/android-chrome-512x512.png" /> */}
            </Avatar.Root>
            <Stack gap="1" alignItems="start">
              <Text fontWeight="600" color="white" lineHeight="normal">
                {user?.username}
              </Text>
              <Text fontSize="sm" color="grey.400" lineHeight="normal">
                {levelLabel}
              </Text>
            </Stack>
            <Spacer />
            <Icon color="white" name="chevronDown" />
          </Stack>
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content>
            <UserSettingButton
              renderItem={(open) => (
                <Menu.Item onSelect={open} value="settings">
                  <Icon name="settings" />
                  {t("Settings")}
                </Menu.Item>
              )}
            />
            <Menu.Item value="user-guide" asChild>
              <a
                href="https://github.com/netfishers-onl/Netshot/wiki/Netshot-User-Guide"
                target="_blank"
                rel="noreferrer"
              >
                <Icon name="helpCircle" />
                {t("User guide")}
              </a>
            </Menu.Item>
            <Menu.Item value="api-doc" asChild>
              <a
                href={`${import.meta.env.VITE_API_URL}/api-browser/`}
                target="_blank"
                rel="noreferrer"
              >
                <Icon name="cloud" />
                {t("API Documentation")}
              </a>
            </Menu.Item>
            <AboutNetshotModal
              renderItem={(open) => (
                <Menu.Item onSelect={open} value="about">
                  <Icon name="info" />
                  {t("About")}
                </Menu.Item>
              )}
            />
            <Menu.Item onSelect={logout} value="logout">
              <Icon name="logOut" />
              {t("Logout")}
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  )
}
