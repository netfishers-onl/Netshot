import { Badge, Icon, Stack, Text } from "@chakra-ui/react"
import { forwardRef, Ref, useMemo } from "react"
import { NavLink } from "react-router"

import { Diagnostic, DiagnosticType } from "@/types"

import { LuRegex } from "react-icons/lu"
import { SiJavascript, SiPython } from "react-icons/si"

type DiagnosticBoxProps = {
  diagnostic: Diagnostic
}

const DiagnosticItem = forwardRef((props: DiagnosticBoxProps, ref: Ref<HTMLDivElement>) => {
  const { diagnostic } = props

  const iconEl = useMemo(() => {
    if (diagnostic.type === DiagnosticType.Javascript) {
      return <SiJavascript />
    } else if (diagnostic.type === DiagnosticType.Python) {
      return <SiPython />
    } else {
      return <LuRegex />
    }
  }, [diagnostic])

  const isDisabled = !diagnostic?.enabled

  return (
    <NavLink to={`./${diagnostic?.id}`}>
      {({ isActive }) => (
        <Stack
          px="3"
          gap="1"
          height="44px"
          justifyContent="center"
          bg={isActive ? "green.50" : "white"}
          transition="all .2s ease"
          _hover={{
            bg: isActive ? "green.50" : "grey.50",
          }}
          borderRadius="md"
          ref={ref}
        >
          <Stack direction="row" gap="3" alignItems="center">
            <Icon color="green.600" size="md" opacity={isDisabled ? 0.5 : 1}>
              {iconEl}
            </Icon>
            <Stack gap="0">
              <Text lineClamp={1} opacity={isDisabled ? 0.5 : 1}>{diagnostic?.name}</Text>
              {diagnostic?.targetGroup && (
                <Badge colorPalette="grey" size="sm" w="fit-content">
                  {diagnostic?.targetGroup?.name}
                </Badge>
              )}
            </Stack>
          </Stack>
        </Stack>
      )}
    </NavLink>
  )
})

export default DiagnosticItem
