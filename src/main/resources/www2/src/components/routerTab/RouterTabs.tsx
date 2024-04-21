import { Box, Divider, Stack } from "@chakra-ui/react";
import { PropsWithChildren } from "react";

export default function RouterTabs(props: PropsWithChildren<{}>) {
  const { children } = props;

  return (
    <Box>
      <Stack direction="row" spacing="8">
        {children}
      </Stack>
      <Divider bg="grey.100" />
    </Box>
  );
}
