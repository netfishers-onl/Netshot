import { Box, Flex, Text } from "@chakra-ui/react";
import { PropsWithChildren } from "react";
import { NavLink } from "react-router";

type RouterTabProps = {
  to: string;
};

export default function RouterTab(props: PropsWithChildren<RouterTabProps>) {
  const { children, to } = props;
  return (
    <NavLink to={to}>
      {({ isActive }) => (
        <Flex
          h="44px"
          alignItems="center"
          justifyContent="center"
          position="relative"
        >
          <Text
            transition="all .2s ease"
            color={isActive ? "black" : "grey.400"}
          >
            {children}
          </Text>
          {isActive && (
            <Box
              position="absolute"
              w="100%"
              height="1px"
              bg="green.600"
              bottom="-1px"
              transition="all .2s ease"
            />
          )}
        </Flex>
      )}
    </NavLink>
  );
}
