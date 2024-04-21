import { Center, Heading, Stack, Text } from "@chakra-ui/react";
import { PropsWithChildren } from "react";

export type EmptyResultProps = {
  title: string;
  description: string;
};

export default function EmptyResult(
  props: PropsWithChildren<EmptyResultProps>
) {
  const { title, description, children } = props;

  return (
    <Center flex="1">
      <Stack spacing="6" alignItems="center">
        <Stack spacing="2" alignItems="center">
          <Heading as="h4" fontSize="xl">
            {title}
          </Heading>
          <Text color="grey.400">{description}</Text>
        </Stack>
        {children}
      </Stack>
    </Center>
  );
}
