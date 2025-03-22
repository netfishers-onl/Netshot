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
import { useCallback, useRef, useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import GroupDeviceBox from "./GroupDeviceBox";
import { AddGroupForm } from "./types";

export type StaticGroupListProps = {};

export default function StaticGroupList() {
  const { t } = useTranslation();
  const form = useFormContext<AddGroupForm>();
  // Increase the version to reset the search cache
  const [cacheVersion, setCacheVersion] = useState<number>(1);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "staticDevices",
    keyName: "uid",
  });

  const addDevice = useCallback(
    (device: SimpleDevice) => {
      setCacheVersion(v => v + 1);
      append(device);
    },
    [append]
  );

  const removeDevice = useCallback((index: number) => {
    setCacheVersion(v => v + 1);
    remove(index);
  }, [remove]);

  const excludeSelected = useCallback(
    (options: SimpleDevice[]): SimpleDevice[] => {
      const selectedIds: number[] = fields.map((f, i) => f.id);
      return options.filter((o) => !selectedIds.includes(o.id));
    },
  [fields]);

  return (
    <>
      <DeviceAutocomplete
        onChange={addDevice}
        filterBy={excludeSelected}
        cacheOptions={cacheVersion}
      />
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
                    onClick={() => removeDevice(index)}
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
