import { Icon } from "@chakra-ui/react"
import { Flex, Stack } from "@chakra-ui/react"
import { PropsWithChildren, useMemo } from "react"
import { LuTriangleAlert, LuCheck, LuX } from "react-icons/lu"

type AlertBoxProps = {
  type: "success" | "error" | "warning"
}

export default function AlertBox(props: PropsWithChildren<AlertBoxProps>) {
  const { children, type } = props

  const icon = useMemo(() => {
    const bg: string = {
      error: "red.50",
      warning: "yellow.50",
      success: "green.50",
    }[type]

    return (
      <Flex
        alignItems="center"
        justifyContent="center"
        w="32px"
        h="32px"
        bg={bg}
        borderRadius="full"
      >
        {type === "error" && <Icon color="red.800"><LuX /></Icon>}
        {type === "success" && <Icon color="green.800"><LuCheck /></Icon>}
        {type === "warning" && <Icon color="yellow.800"><LuTriangleAlert /></Icon>}
      </Flex>
    )
  }, [type])

  return (
    <Stack
      direction="row"
      gap="3"
      borderWidth="1px"
      borderColor="grey.100"
      borderRadius="2xl"
      alignSelf="start"
      py="4"
      px="5"
      alignItems="center"
    >
      {icon}
      {children}
    </Stack>
  )
}
