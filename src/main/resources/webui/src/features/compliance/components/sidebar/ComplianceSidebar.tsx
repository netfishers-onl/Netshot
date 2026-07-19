import { Protected, SidebarLink } from "@/components"
import { LuChevronUp, LuCheck, LuPlus, LuTrophy } from "react-icons/lu"
import { Level, TaskType } from "@/types"
import { Button, Group, IconButton, Menu, Portal, Separator, Stack, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import AddTaskTrigger from "@/features/task/components/AddTaskTrigger"
import { ComplianceSidebarProvider } from "../../contexts"
import { ComplianceSidebarContext } from "../../contexts/ComplianceSidebarProvider"
import AddPolicyTrigger from "../AddPolicyTrigger"
import ComplianceSidebarList from "./ComplianceSidebarList"
import ComplianceSidebarSearch from "./ComplianceSidebarSearch"
import ComplianceSidebarSearchList from "./ComplianceSidebarSearchList"

export default function ComplianceSidebar() {
  const { t } = useTranslation()

  return (
    <ComplianceSidebarProvider>
      <Stack w="300px" overflow="hidden" gap="0">
        <ComplianceSidebarContext.Consumer>
          {({ query }) => (
            <>
              <ComplianceSidebarSearch />
              <Separator />
              {!query && (
                <>
                  <Stack gap="0" py="4" px="5">
                    <SidebarLink
                      to="./software"
                      label={t("common.software")}
                      description={t("compliance.software.versionLabel")}
                    />
                    <SidebarLink
                      to="./hardware"
                      label={t("common.hardware")}
                      description={t("compliance.hardware.supportStatus")}
                    />
                  </Stack>
                  <Separator />
                </>
              )}

              <Stack p="6">
                <Text fontWeight="medium">{t("device.config.compliance")}</Text>
              </Stack>
              {query ? <ComplianceSidebarSearchList /> : <ComplianceSidebarList />}
              <Protected minLevel={Level.Operator}>
                <Separator />
                <Stack p="6">
                  <Menu.Root positioning={{ placement: "top" }}>
                    <Group attached w="full">
                      <AddPolicyTrigger>
                        <Button flex="1">
                          <LuPlus />
                          {t("policy.add")}
                        </Button>
                      </AddPolicyTrigger>
                      <Menu.Trigger asChild>
                        <IconButton aria-label={t("common.actions")}>
                          <LuChevronUp />
                        </IconButton>
                      </Menu.Trigger>
                    </Group>
                    <Portal>
                      <Menu.Positioner>
                        <Menu.Content>
                          <AddTaskTrigger initialType={TaskType.CheckGroupCompliance}>
                            <Menu.Item value="check-compliance-on-group">
                              <LuCheck />
                              {t("compliance.checkConfigOfGroupAction")}
                            </Menu.Item>
                          </AddTaskTrigger>
                          <AddTaskTrigger initialType={TaskType.CheckGroupSoftware}>
                            <Menu.Item value="check-software-hardware-on-group">
                              <LuTrophy />
                              {t("compliance.checkSoftwareHardwareOfGroupAction")}
                            </Menu.Item>
                          </AddTaskTrigger>
                        </Menu.Content>
                      </Menu.Positioner>
                    </Portal>
                  </Menu.Root>
                </Stack>
              </Protected>
            </>
          )}
        </ComplianceSidebarContext.Consumer>
      </Stack>
    </ComplianceSidebarProvider>
  )
}
