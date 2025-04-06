import {
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Spacer,
  Stack,
  Tag,
  Text,
} from "@chakra-ui/react";
import { forwardRef, LegacyRef, MouseEvent, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useMatch, useNavigate } from "react-router";

import { Icon } from "@/components";
import { getDeviceLevelOption } from "@/constants";
import { DeviceSoftwareLevel, DeviceStatus, SimpleDevice } from "@/types";
import { getSoftwareLevelColor } from "@/utils";

import { useDeviceSidebar } from "../../contexts/device-sidebar";

type DeviceBoxProps = {
  device: SimpleDevice;
};

const DeviceBox = forwardRef(
  (props: DeviceBoxProps, ref: LegacyRef<HTMLDivElement>) => {
    const { device } = props;

    const { t } = useTranslation();
    const ctx = useDeviceSidebar();
    const navigate = useNavigate();
    const sectionMatch = useMatch("/app/devices/:id/:section");
    const currentSection = useMemo(() => sectionMatch?.params.section ?? "general", [sectionMatch]);
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
          }
          else {
            range = dataClone.slice(lastIndex, firstIndex);
          }

          ctx.setSelected(range);
        }
        else {
          navigate(`./${device?.id}/${currentSection}`);
          ctx.setSelected([device]);
        }
      },
      [device, ctx, navigate, currentSection]
    );

    const level = useMemo(
      () => getDeviceLevelOption(device?.softwareLevel),
      [device]
    );

    const compliant = useMemo<boolean>(() => {
      if (
        [
          DeviceSoftwareLevel.NON_COMPLIANT,
          DeviceSoftwareLevel.UNKNOWN,
        ].includes(device.softwareLevel)
      ) {
        return false;
      }

      if (!device.configCompliant) {
        return false;
      }

      if (device.eol) {
        return false;
      }

      if (device.eos) {
        return false;
      }
      
      return true;
    }, [device]);

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
        userSelect="none"
        cursor="pointer"
      >
        <Stack spacing="0">
          <Text
            opacity={isDisabled ? 0.5 : 1}
            fontSize="xs"
            color={isSelected ? "green.500" : "grey.400"}
          >
            {device?.mgmtAddress}
          </Text>
          <Text opacity={isDisabled ? 0.5 : 1} fontWeight="medium">
            {device?.name}
          </Text>
        </Stack>
        <Stack direction="row" spacing="3">
          <Tag
            opacity={isDisabled ? 0.5 : 1}
            alignSelf="start"
            colorScheme={isSelected ? "green" : "grey"}
          >
            {device?.family}
          </Tag>
          <Spacer />

          <Popover trigger="hover">
            <PopoverTrigger>
              {compliant ? (
                <Tag gap="1" colorScheme="green">
                  <Icon size={14} name="checkCircle" />
                </Tag>
              ) : (
                <Tag gap="1" colorScheme="red">
                  <Icon size={14} name="alertTriangle" />
                </Tag>
              )}
            </PopoverTrigger>
            <PopoverContent w="340px">
              <PopoverBody p="4">
                <Text size="md" fontWeight="bold" mb="3">
                  {t("Status summary")}
                </Text>
                <Stack spacing="2">
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Text>{t("Software compliance")}</Text>
                    <Tag bg={getSoftwareLevelColor(level?.value)}>
                      {level?.label}
                    </Tag>
                  </Stack>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Text>{t("Configuration compliance")}</Text>
                    <Tag colorScheme={device.configCompliant ? "green" : "red"}>
                      {t(
                        device.configCompliant ? "Compliant" : "Non compliant"
                      )}
                    </Tag>
                  </Stack>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Text>{t("Hardware compliance")}</Text>
                    <Tag colorScheme={(device.eos || device.eol) ? "red" : "green"}>
                      {device.eol ?
                        t("End of life") :
                        (device.eos ?
                          t("End of sale") :
                          t("Up to date"))}
                    </Tag>
                  </Stack>
                </Stack>
              </PopoverBody>
            </PopoverContent>
          </Popover>
        </Stack>
      </Stack>
    );
  }
);

export default DeviceBox;
