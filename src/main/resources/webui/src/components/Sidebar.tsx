import { Stack } from "@chakra-ui/react";
import { PropsWithChildren } from "react";

export type SidebarProps = PropsWithChildren;

export default function Sidebar(props: SidebarProps) {
  const { children } = props;

  return (
    <Stack w="full" h="full" overflow="auto" gap="0">
      {children}
    </Stack>
  );
}
