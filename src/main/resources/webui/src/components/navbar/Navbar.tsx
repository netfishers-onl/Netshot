import { Flex, Spacer, Stack } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import Brand from "../Brand";
import NavbarLink from "./NavbarLink";
import NavbarUser from "./NavbarUser";
import Protected from "../Protected";
import { Level } from "@/types";

export default function Navbar() {
  const { t } = useTranslation();

  return (
    <Flex as="header" alignItems="center" px="5" h="72px" bg="green.1100">
      <Stack direction="row" spacing="14">
        <Link to="/">
          <Brand
            sx={{
              w: "119px",
            }}
            mode="dark"
          />
        </Link>

        <Stack direction="row" alignItems="center">
          <NavbarLink to="reports">{t("Reports")}</NavbarLink>
          <NavbarLink to="devices">{t("Devices")}</NavbarLink>
          <NavbarLink to="diagnostics">{t("Diagnostics")}</NavbarLink>
          <NavbarLink to="compliance">{t("Compliance")}</NavbarLink>
          <NavbarLink to="tasks">{t("Tasks")}</NavbarLink>
          <Protected minLevel={Level.Admin}>
            <NavbarLink to="administration">{t("Administration")}</NavbarLink>
          </Protected>
        </Stack>
      </Stack>
      <Spacer />
      <NavbarUser />
    </Flex>
  );
}
