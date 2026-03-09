import { Icon } from "@/components"
import { Flex, Stack, StackProps, Text } from "@chakra-ui/react"

export type DiagnosticBoxButtonProps = {
  icon: string
  label: string
  description: string
  isActive: boolean
} & StackProps

export default function DiagnosticBoxButton(props: DiagnosticBoxButtonProps) {
  const { icon, label, description, isActive, ...stackProps } = props

  return (
    <Stack
      direction="row"
      gap="4"
      border="1px solid"
      borderColor={isActive ? "green.400" : "grey.100"}
      borderRadius="2xl"
      transition="all .2s ease"
      p="5"
      bg="white"
      _hover={{
        borderColor: "green.400",
      }}
      _active={{
        bg: "green.50",
      }}
      cursor="pointer"
      {...stackProps}
    >
      <Flex
        alignItems="center"
        justifyContent="center"
        bg="green.50"
        w="32px"
        h="32px"
        borderRadius="md"
      >
        <Icon name={icon} color="green.800" />
      </Flex>
      <Stack gap="0">
        <Text fontWeight="semibold">{label}</Text>
        <Text color="grey.400">{description}</Text>
      </Stack>
    </Stack>
  )
}
