import { Protected } from "@/components"
import { LuPlus } from "react-icons/lu"
import { Level } from "@/types"
import { Button, Separator, Stack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { DiagnosticSidebarProvider } from "../../contexts"
import { DiagnosticSidebarContext } from "../../contexts/DiagnosticSidebarProvider"
import AddDiagnosticTrigger from "../AddDiagnosticTrigger"
import SidebarList from "./SidebarList"
import SidebarSearch from "./SidebarSearch"
import DeviceSidebarSearchList from "./SidebarSearchList"

export default function Sidebar() {
  const { t } = useTranslation()

  return (
    <DiagnosticSidebarProvider>
      <Stack w="300px" overflow="hidden" gap="0">
        <DiagnosticSidebarContext.Consumer>
          {({ query }) => (
            <>
              <SidebarSearch />
              <Separator />

              {query ? <DeviceSidebarSearchList /> : <SidebarList />}
              <Protected minLevel={Level.ReadWrite}>
                <Separator />
                <Stack p="6">
                  <AddDiagnosticTrigger>
                    <Button>
                      <LuPlus />
                      {t("diagnostic.add")}
                    </Button>
                  </AddDiagnosticTrigger>
                </Stack>
              </Protected>
            </>
          )}
        </DiagnosticSidebarContext.Consumer>
      </Stack>
    </DiagnosticSidebarProvider>
  )
}
