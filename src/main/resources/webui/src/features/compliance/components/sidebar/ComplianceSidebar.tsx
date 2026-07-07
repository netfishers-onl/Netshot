import { Protected, SidebarLink } from "@/components"
import { LuPlus } from "react-icons/lu"
import { Level } from "@/types"
import { Button, Separator, Stack, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
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
                  <AddPolicyTrigger>
                    <Button>
                      <LuPlus />
                      {t("policy.add")}
                    </Button>
                  </AddPolicyTrigger>
                </Stack>
              </Protected>
            </>
          )}
        </ComplianceSidebarContext.Consumer>
      </Stack>
    </ComplianceSidebarProvider>
  )
}
