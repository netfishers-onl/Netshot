import { Avatar, Button, Menu, Portal, Spacer, Stack, Text } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import api from "@/api"
import { MeResult } from "@/api/user"
import { QUERIES } from "@/constants"
import { useAuth } from "@/contexts"
import useToast from "@/hooks/useToast"

import { useUserLevelOptions } from "@/hooks"
import { Icon } from "@chakra-ui/react"
import { FiChevronDown, FiCloud, FiHelpCircle, FiInfo, FiLogOut, FiSettings } from "react-icons/fi"
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
        title: t("common.error"),
        description: t("common.anErrorOccurred"),
      })
    },
    onSuccess() {
      toast.success({
        title: t("auth.logout"),
        description: t("auth.successfullyLoggedOut"),
      })
      queryClient.setQueryData<MeResult>([QUERIES.USER], (prev) => prev ? { ...prev, user: null } : prev)
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
            <Icon color="white"><FiChevronDown /></Icon>
          </Stack>
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content>
            <UserSettingButton
              renderItem={(open) => (
                <Menu.Item onSelect={open} value="settings">
                  <FiSettings />
                  {t("common.settings")}
                </Menu.Item>
              )}
            />
            <Menu.Item value="user-guide" asChild>
              <a
                href="https://github.com/netfishers-onl/Netshot/wiki/Netshot-User-Guide"
                target="_blank"
                rel="noreferrer"
              >
                <FiHelpCircle />
                {t("admin.userGuide")}
              </a>
            </Menu.Item>
            <Menu.Item value="api-doc" asChild>
              <a
                href={`${import.meta.env.VITE_API_URL}/api-browser/`}
                target="_blank"
                rel="noreferrer"
              >
                <FiCloud />
                {t("api.documentation")}
              </a>
            </Menu.Item>
            <AboutNetshotModal
              renderItem={(open) => (
                <Menu.Item onSelect={open} value="about">
                  <FiInfo />
                  {t("about.label")}
                </Menu.Item>
              )}
            />
            <Menu.Item onSelect={logout} value="logout">
              <FiLogOut />
              {t("auth.logout")}
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  )
}
