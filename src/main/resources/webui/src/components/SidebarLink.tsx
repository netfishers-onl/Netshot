import { Stack, Text } from "@chakra-ui/react";
import { NavLink } from "react-router-dom";

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
          bg={isActive ? "grey.50" : "white"}
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
