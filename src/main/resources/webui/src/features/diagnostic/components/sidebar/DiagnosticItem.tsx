import { Icon, Stack, Text } from "@chakra-ui/react"
import { forwardRef, Ref, useMemo } from "react"
import { NavLink } from "react-router"

import { Diagnostic, DiagnosticType } from "@/types"
import { Tooltip } from "@/components/ui/tooltip"

import { LuCircleX, LuRegex } from "react-icons/lu"
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
  const isAssigned = !!diagnostic?.targetGroup

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
          <Stack direction="row" gap="3" alignItems="center" justifyContent="space-between">
            <Stack direction="row" gap="3" alignItems="center" overflow="hidden">
              <Icon color="green.600" size="md" opacity={isDisabled ? 0.5 : 1} flexShrink="0">
                {iconEl}
              </Icon>
              <Text lineClamp={1} opacity={isDisabled ? 0.5 : 1}>{diagnostic?.name}</Text>
            </Stack>
            {!isAssigned && (
              <Tooltip content="Not assigned to any group">
                <Icon color="red.500" size="sm" flexShrink="0">
                  <LuCircleX />
                </Icon>
              </Tooltip>
            )}
          </Stack>
        </Stack>
      )}
    </NavLink>
  )
})

export default DiagnosticItem
