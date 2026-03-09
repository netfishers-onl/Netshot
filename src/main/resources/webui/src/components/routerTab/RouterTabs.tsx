import { Box, Separator, Stack } from "@chakra-ui/react"
import { PropsWithChildren } from "react"

export default function RouterTabs(props: PropsWithChildren) {
  const { children } = props

  return (
    <Box>
      <Stack direction="row" gap="8">
        {children}
      </Stack>
      <Separator bg="grey.100" />
    </Box>
  )
}
