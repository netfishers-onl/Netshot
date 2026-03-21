import { Icon, Protected, SidebarLink } from "@/components"
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
                      to="./hardware"
                      label={t("hardware")}
                      description={t("hardwareSupportStatus")}
                    />
                    <SidebarLink
                      to="./software"
                      label={t("software")}
                      description={t("softwareVersionCompliance")}
                    />
                  </Stack>
                  <Separator />
                </>
              )}

              <Stack px="6" pt="6">
                <Text fontWeight="medium">{t("configurationCompliance")}</Text>
              </Stack>
              {query ? <SidebarSearchList /> : <SidebarList />}
              <Protected minLevel={Level.Operator}>
                <Separator />
                <Stack p="6">
                  <AddPolicyButton
                    renderItem={(open) => (
                      <Button onClick={open}>
                        <Icon name="plus" />
                        {t("addPolicy")}
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
