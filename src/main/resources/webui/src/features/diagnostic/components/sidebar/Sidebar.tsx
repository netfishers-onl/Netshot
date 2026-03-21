import { Protected } from "@/components"
import Icon from "@/components/Icon"
import { Level } from "@/types"
import { Button, Separator, Stack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { DiagnosticSidebarProvider } from "../../contexts"
import { DiagnosticSidebarContext } from "../../contexts/DiagnosticSidebarProvider"
import DiagnosticAddButton from "../DiagnosticAddButton"
import SidebarList from "./SidebarList"
import SidebarSearch from "./SidebarSearch"
import DeviceSidebarSearchList from "./SidebarSearchList"

export default function Sidebar() {
  const { t } = useTranslation()

  return (
    <DiagnosticSidebarProvider>
      <Stack w="300px" overflow="auto" gap="0">
        <DiagnosticSidebarContext.Consumer>
          {({ query }) => (
            <>
              <SidebarSearch />
              <Separator />

              {query ? <DeviceSidebarSearchList /> : <SidebarList />}
              <Protected minLevel={Level.ReadWrite}>
                <Separator />
                <Stack p="6">
                  <DiagnosticAddButton
                    renderItem={(open) => (
                      <Button onClick={open}>
                        <Icon name="plus" />
                        {t("addDiagnostic")}
                      </Button>
                    )}
                  />
                </Stack>
              </Protected>
            </>
          )}
        </DiagnosticSidebarContext.Consumer>
      </Stack>
    </DiagnosticSidebarProvider>
  )
}
