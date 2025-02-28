import { Stack } from "@chakra-ui/react";
import { PropsWithChildren } from "react";

export type SidebarProps = PropsWithChildren<{}>;

export default function Sidebar(props: SidebarProps) {
  const { children } = props;

  return (
    <Stack w="300px" overflow="auto" spacing="0">
      {children}
    </Stack>
  );
}
