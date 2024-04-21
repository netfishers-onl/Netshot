import { DeviceConfig } from "@/types";
import { formatDate } from "@/utils";
import {
  Stack,
  StackProps,
  SystemStyleObject,
  Tag,
  Text,
} from "@chakra-ui/react";
import { useMemo } from "react";

export type DeviceConfigurationCompareItemProps = {
  isSelected?: boolean;
  config: DeviceConfig;
} & StackProps;

export default function DeviceConfigurationCompareItem(
  props: DeviceConfigurationCompareItemProps
) {
  const { isSelected, config, ...other } = props;

  const changeDate = useMemo(() => {
    return formatDate(config?.changeDate, "yyyy-MM-dd");
  }, [config]);

  const selectedStyle = useMemo(() => {
    if (!isSelected) {
      return {};
    }

    return {
      borderColor: "green.500",
    } as SystemStyleObject;
  }, [isSelected]);

  return (
    <Stack
      spacing="2"
      p="4"
      borderColor="grey.100"
      borderWidth="1px"
      borderRadius="2xl"
      bg="white"
      cursor="pointer"
      transition="all .2s ease"
      sx={selectedStyle}
      {...other}
    >
      <Text fontWeight="semibold">{changeDate}</Text>
      <Stack direction="row" spacing="4">
        {Boolean(config?.attributes?.type) && (
          <Tag colorScheme="grey">{config?.attributes?.type}</Tag>
        )}
        <Tag colorScheme="green">{config?.author}</Tag>
      </Stack>
    </Stack>
  );
}
