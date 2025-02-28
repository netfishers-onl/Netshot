import { Flex, Stack } from "@chakra-ui/react";
import { PropsWithChildren, useMemo } from "react";
import Icon from "./Icon";

type AlertBoxProps = {
  type: "success" | "error" | "warning";
};

export default function AlertBox(props: PropsWithChildren<AlertBoxProps>) {
  const { children, type } = props;

  const icon = useMemo(() => {
    let bg: string;

    if (type === "error") {
      bg = "red.50";
    } else if (type === "warning") {
      bg = "yellow.50";
    } else if (type === "success") {
      bg = "green.50";
    }

    return (
      <Flex
        alignItems="center"
        justifyContent="center"
        w="32px"
        h="32px"
        bg={bg}
        borderRadius="full"
      >
        {type === "error" && <Icon name="x" color="red.800" />}
        {type === "success" && <Icon name="check" color="green.800" />}
        {type === "warning" && <Icon name="alertTriangle" color="yellow.800" />}
      </Flex>
    );
  }, [type]);

  return (
    <Stack
      direction="row"
      spacing="3"
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
  );
}
