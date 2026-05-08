import { Protected, SidebarLink } from "@/components"
import { LuPlus } from "react-icons/lu"
import { Level } from "@/types"
import { Button, Separator, Stack, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { SidebarProvider } from "../../contexts"
import { SidebarContext } from "../../contexts/SidebarProvider"
import AddPolicyButton from "../AddPolicyButton"
import SidebarList from "./SidebarList"
import SidebarSearch from "./SidebarSearch"
import SidebarSearchList from "./SidebarSearchList"

export default function Sidebar() {
  const { t } = useTranslation()

  return (
    <SidebarProvider>
      <Stack w="300px" overflow="auto" gap="0">
        <SidebarContext.Consumer>
          {({ query }) => (
            <>
              <SidebarSearch />
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

              <Stack px="6" pt="6">
                <Text fontWeight="medium">{t("device.config.compliance")}</Text>
              </Stack>
              {query ? <SidebarSearchList /> : <SidebarList />}
              <Protected minLevel={Level.Operator}>
                <Separator />
                <Stack p="6">
                  <AddPolicyButton
                    renderItem={(open) => (
                      <Button onClick={open}>
                        <LuPlus />
                        {t("policy.add")}
                      </Button>
                    )}
                  />
                </Stack>
              </Protected>
            </>
          )}
        </SidebarContext.Consumer>
      </Stack>
    </SidebarProvider>
  )
}
