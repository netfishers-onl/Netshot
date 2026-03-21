import { Level } from "@/types"
import { Flex, Spacer, Stack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import Brand from "../Brand"
import Protected from "../Protected"
import NavbarLink from "./NavbarLink"
import NavbarUser from "./NavbarUser"

export default function Navbar() {
  const { t } = useTranslation()

  return (
    <Flex as="header" alignItems="center" px="5" h="72px" bg="green.1100">
      <Stack direction="row" gap="14">
        <Link to="/">
          <Brand
            css={{
              w: "119px",
            }}
            mode="dark"
          />
        </Link>

        <Stack direction="row" alignItems="center">
          <NavbarLink to="reports">{t("reports")}</NavbarLink>
          <NavbarLink to="devices">{t("devices")}</NavbarLink>
          <NavbarLink to="diagnostics">{t("diagnostics")}</NavbarLink>
          <NavbarLink to="compliance">{t("compliance")}</NavbarLink>
          <NavbarLink to="tasks">{t("tasks")}</NavbarLink>
          <Protected minLevel={Level.Admin}>
            <NavbarLink to="administration">{t("administration")}</NavbarLink>
          </Protected>
        </Stack>
      </Stack>
      <Spacer />
      <NavbarUser />
    </Flex>
  )
}
