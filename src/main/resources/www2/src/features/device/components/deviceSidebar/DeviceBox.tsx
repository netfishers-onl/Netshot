import { getDeviceLevelOption } from "@/constants";
import { DeviceStatus, SimpleDevice } from "@/types";
import { getSoftwareLevelColor } from "@/utils";
import { Stack, Tag, Text } from "@chakra-ui/react";
import { LegacyRef, MouseEvent, forwardRef, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useDeviceSidebar } from "../../contexts/DeviceSidebarProvider";

type DeviceBoxProps = {
  device: SimpleDevice;
};

export default forwardRef(
  (props: DeviceBoxProps, ref: LegacyRef<HTMLDivElement>) => {
    const { device } = props;

    const { t } = useTranslation();
    const ctx = useDeviceSidebar();
    const navigate = useNavigate();
    const isSelected = useMemo(() => ctx.isSelected(device?.id), [device, ctx]);
    const isDisabled = useMemo(
      () => device?.status === DeviceStatus.Disabled,
      [device]
    );

    /**
     * Device selection logic
     * @description
     * click: select a device
     * cmd+click: select device by device
     * shift+click: select device range
     */
    const onSelected = useCallback(
      (evt: MouseEvent<HTMLDivElement>) => {
        if (evt.metaKey) {
          if (ctx.isSelected(device.id)) {
            ctx.setSelected((prev) => prev.filter((d) => d.id !== device.id));
          } else {
            ctx.setSelected((prev) => [...prev, device]);
          }
        } else if (evt.shiftKey) {
          if (ctx.selected.length === 0) {
            return;
          }

          const firstIndex = ctx.data.findIndex(
            (d) => d.id === ctx.selected[0].id
          );
          const lastIndex = ctx.data.findIndex((d) => d.id === device.id);

          if (lastIndex === -1) {
            return;
          }

          const dataClone = [...ctx.data];
          let range: SimpleDevice[] = [];

          if (firstIndex < lastIndex) {
            range = dataClone.slice(firstIndex, lastIndex + 1);
          } else {
            range = dataClone.slice(lastIndex, firstIndex);
          }

          ctx.setSelected(range);
        } else {
          navigate(`./${device?.id}/general`);
          ctx.setSelected([device]);
        }
      },
      [device, ctx, navigate]
    );

    const level = useMemo(
      () => getDeviceLevelOption(device?.softwareLevel),
      [device]
    );

    return (
      <Stack
        onClick={onSelected}
        spacing="1"
        px="2"
        py="2"
        bg={isSelected ? "green.50" : "white"}
        transition="all .2s ease"
        _hover={{
          bg: isSelected ? "green.50" : "grey.50",
        }}
        borderRadius="xl"
        ref={ref}
        opacity={isDisabled ? 0.5 : 1}
        userSelect="none"
        cursor="pointer"
      >
        <Stack spacing="0">
          <Text fontSize="xs" color={isSelected ? "green.500" : "grey.400"}>
            {device?.mgmtAddress?.ip}
          </Text>
          <Text fontWeight="medium">{device?.name}</Text>
        </Stack>
        <Stack direction="row" spacing="3">
          <Tag alignSelf="start" colorScheme={isSelected ? "green" : "grey"}>
            {device?.family}
          </Tag>
          <Tag colorScheme={getSoftwareLevelColor(level?.value)}>
            {level?.label}
          </Tag>
        </Stack>
      </Stack>
    );
  }
);
