import { Badge, Stack, Text } from "@chakra-ui/react"
import { forwardRef, LegacyRef, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { NavLink } from "react-router"

import { Diagnostic, DiagnosticType } from "@/types"

type DiagnosticBoxProps = {
  diagnostic: Diagnostic
}

const SidebarBox = forwardRef((props: DiagnosticBoxProps, ref: LegacyRef<HTMLDivElement>) => {
  const { diagnostic } = props
  const { t } = useTranslation()

  const type = useMemo(() => {
    if (diagnostic.type === DiagnosticType.Simple) {
      return t("simple")
    } else if (diagnostic.type === DiagnosticType.Javascript) {
      return t("javascript")
    } else if (diagnostic.type === DiagnosticType.Python) {
      return t("python")
    } else {
      return t("unknown3")
    }
  }, [diagnostic])

  return (
    <NavLink to={`./${diagnostic?.id}`}>
      {({ isActive }) => (
        <Stack
          px="2"
          py="2"
          gap="1"
          bg={isActive ? "green.50" : "white"}
          transition="all .2s ease"
          _hover={{
            bg: isActive ? "green.50" : "grey.50",
          }}
          borderRadius="xl"
          ref={ref}
          opacity={diagnostic?.enabled ? 1 : 0.5}
        >
          <Stack gap="0">
            <Text fontWeight="medium">{diagnostic?.name}</Text>
            <Text fontSize="xs" color={isActive ? "green.500" : "grey.400"}>
              {type}
            </Text>
          </Stack>
          <Stack direction="row" gap="2">
            {diagnostic?.targetGroup && (
              <Badge colorPalette={isActive ? "white" : "grey"}>
                {diagnostic?.targetGroup?.name}
              </Badge>
            )}
            <Badge colorPalette={diagnostic?.enabled ? "green" : "red"}>
              {diagnostic?.enabled ? t("enabled") : t("disabled")}
            </Badge>
          </Stack>
        </Stack>
      )}
    </NavLink>
  )
})

export default SidebarBox
