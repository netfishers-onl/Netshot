import { useDashboard } from "@/contexts";
import { Flex, Spacer, Stack } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Brand from "../Brand";
import NavbarLink from "./NavbarLink";
import NavbarUser from "./NavbarUser";

export default function Navbar() {
  const { t } = useTranslation();
  const { isAdmin } = useDashboard();

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
          <NavbarLink to="report">{t("Reports")}</NavbarLink>
          <NavbarLink to="device">{t("Devices")}</NavbarLink>
          <NavbarLink to="diagnostic">{t("Diagnostics")}</NavbarLink>
          <NavbarLink to="compliance">{t("Compliance")}</NavbarLink>
          <NavbarLink to="task">{t("Tasks")}</NavbarLink>
          {isAdmin && (
            <NavbarLink to="administration">{t("Administration")}</NavbarLink>
          )}
        </Stack>
      </Stack>
      <Spacer />
      <NavbarUser />
    </Flex>
  );
}
