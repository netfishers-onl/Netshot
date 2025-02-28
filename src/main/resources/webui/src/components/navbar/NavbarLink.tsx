import { Button } from "@chakra-ui/react";
import { PropsWithChildren } from "react";
import { NavLink } from "react-router-dom";

type NavbarLinkProps = PropsWithChildren<{
  to: string;
}>;

export default function NavbarLink(props: NavbarLinkProps) {
  const { to, children } = props;

  return (
    <NavLink to={to}>
      {({ isActive }) => (
        <Button size="sm" variant="navbar" isActive={isActive}>
          {children}
        </Button>
      )}
    </NavLink>
  );
}
