import { DeviceAutocomplete, Icon } from "@/components";
import { SimpleDevice } from "@/types";
import {
  Center,
  Heading,
  IconButton,
  Stack,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { useCallback } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import GroupDeviceBox from "./GroupDeviceBox";
import { AddGroupForm } from "./types";

export type StaticGroupListProps = {};

export default function StaticGroupList() {
  const { t } = useTranslation();
  const form = useFormContext<AddGroupForm>();

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "staticDevices",
  });

  const addDevice = useCallback(
    (device: SimpleDevice) => {
      append(device);
    },
    [append]
  );

  return (
    <>
      <DeviceAutocomplete onChange={addDevice} />
      <Stack flex="1">
        {fields.length > 0 ? (
          <>
            {fields.map((device, index) => (
              <GroupDeviceBox device={device} key={device?.id}>
                <Tooltip title={t("Remove device")}>
                  <IconButton
                    aria-label={t("Remove device")}
                    icon={<Icon name="trash" />}
                    position="absolute"
                    top="2"
                    right="2"
                    variant="ghost"
                    colorScheme="green"
                    onClick={() => remove(index)}
                  />
                </Tooltip>
              </GroupDeviceBox>
            ))}
          </>
        ) : (
          <Center flex="1">
            <Stack alignItems="center" spacing="4">
              <Stack alignItems="center" spacing="1">
                <Heading size="md">{t("No devices selected")}</Heading>
                <Text color="grey.400">
                  {t("Please add equipment using the auto-complete above")}
                </Text>
              </Stack>
            </Stack>
          </Center>
        )}
      </Stack>
    </>
  );
}
