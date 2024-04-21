import { SimpleDevice } from "@/types";
import { Stack, Tag, Text } from "@chakra-ui/react";
import { LegacyRef, forwardRef, useMemo } from "react";
import { NavLink } from "react-router-dom";
import { useDeviceSidebar } from "../../contexts/DeviceSidebarProvider";

type DeviceBoxProps = {
  device: SimpleDevice;
};

export default forwardRef(
  (props: DeviceBoxProps, ref: LegacyRef<HTMLDivElement>) => {
    const { device } = props;
    const ctx = useDeviceSidebar();
    const isSelected = useMemo(() => ctx.isSelected(device?.id), [device, ctx]);

    return (
      <NavLink to={`./${device?.id}`}>
        {({ isActive }) => (
          <Stack
            px="4"
            py="6"
            spacing="3"
            border="1px"
            borderColor={isSelected || isActive ? "transparent" : "grey.100"}
            bg={isSelected || isActive ? "green.50" : "white"}
            borderRadius="xl"
            boxShadow="sm"
            ref={ref}
          >
            <Stack spacing="0">
              <Text
                fontSize="xs"
                color={isSelected || isActive ? "green.500" : "grey.400"}
              >
                {device?.mgmtAddress?.ip}
              </Text>
              <Text fontWeight="medium">{device?.name}</Text>
            </Stack>
            <Tag
              alignSelf="start"
              colorScheme={isSelected || isActive ? "green" : "grey"}
            >
              {device?.family}
            </Tag>
          </Stack>
        )}
      </NavLink>
    );
  }
);
