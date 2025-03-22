import { Stack, Text } from "@chakra-ui/react";
import { NavLink } from "react-router";

export type SidebarLinkProps = {
  to: string;
  label: string;
  description: string;
};

export default function SidebarLink(props: SidebarLinkProps) {
  const { to, label, description } = props;

  return (
    <NavLink to={to}>
      {({ isActive }) => (
        <Stack
          borderRadius="xl"
          bg={isActive ? "green.50" : "white"}
          transition="all .2s ease"
          _hover={{
            bg: isActive ? "green.50" : "grey.50",
          }}
          px="4"
          py="3"
          spacing="0"
        >
          <Text fontWeight="medium">{label}</Text>
          <Text color="grey.400">{description}</Text>
        </Stack>
      )}
    </NavLink>
  );
}
