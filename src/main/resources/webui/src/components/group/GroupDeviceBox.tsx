import { SimpleDevice } from "@/types";
import { Stack, Tag, Text } from "@chakra-ui/react";
import { PropsWithChildren } from "react";

export type GroupDeviceBoxProps = PropsWithChildren<{
  device: SimpleDevice;
}>;

export default function GroupDeviceBox(props: GroupDeviceBoxProps) {
  const { device, children } = props;
  return (
    <Stack
      p="4"
      spacing="3"
      border="1px"
      borderColor="grey.100"
      bg="white"
      borderRadius="2xl"
      boxShadow="sm"
      position="relative"
    >
      <Stack spacing="0">
        <Text fontSize="xs" color="grey.400">
          {device?.mgmtAddress?.ip}
        </Text>
        <Text fontWeight="medium">{device?.name}</Text>
      </Stack>
      <Tag alignSelf="start" colorScheme="grey">
        {device?.family}
      </Tag>
      {children}
    </Stack>
  );
}
