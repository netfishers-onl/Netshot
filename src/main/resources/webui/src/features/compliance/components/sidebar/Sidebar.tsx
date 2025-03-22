import { Icon, Protected, SidebarLink } from "@/components";
import { Level } from "@/types";
import { Button, Divider, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { SidebarProvider } from "../../contexts";
import { SidebarContext } from "../../contexts/SidebarProvider";
import AddPolicyButton from "../AddPolicyButton";
import SidebarList from "./SidebarList";
import SidebarSearch from "./SidebarSearch";
import SidebarSearchList from "./SidebarSearchList";

export default function Sidebar() {
  const { t } = useTranslation();

  return (
    <SidebarProvider>
      <Stack w="300px" overflow="auto" spacing="0">
        <SidebarContext.Consumer>
          {({ query }) => (
            <>
              <SidebarSearch />
              <Divider />
              {!query && (
                <>
                  <Stack spacing="0" py="4" px="5">
                    <SidebarLink
                      to="./hardware"
                      label={t("Hardware")}
                      description={t("Hardware support status")}
                    />
                    <SidebarLink
                      to="./software"
                      label={t("Software")}
                      description={t("Software version compliance")}
                    />
                  </Stack>
                  <Divider />
                </>
              )}

              <Stack px="6" pt="6">
                <Text fontWeight="medium">{t("Configuration compliance")}</Text>
              </Stack>
              {query ? <SidebarSearchList /> : <SidebarList />}
              <Protected minLevel={Level.Operator}>
                <Divider />
                <Stack p="6">
                  <AddPolicyButton
                    renderItem={(open) => (
                      <Button leftIcon={<Icon name="plus" />} onClick={open}>
                        {t("Add policy")}
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
  );
}
