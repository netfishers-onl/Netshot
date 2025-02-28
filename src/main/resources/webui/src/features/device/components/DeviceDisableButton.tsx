import api, { UpdateDevicePayload } from "@/api";
import { NetshotError } from "@/api/httpClient";
import { QUERIES as GLOBAL_QUERIES } from "@/constants";
import { Dialog } from "@/dialog";
import { useToast } from "@/hooks";
import { Device, SimpleDevice } from "@/types";
import { Text } from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MouseEvent, ReactElement, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { QUERIES } from "../constants";

export type DeviceDisableButtonProps = {
  devices: SimpleDevice[] | Device[];
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

export default function DeviceDisableButton(props: DeviceDisableButtonProps) {
  const { devices, renderItem } = props;
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const toast = useToast();

  const mutation = useMutation(
    async (payload: Partial<UpdateDevicePayload>) =>
      api.device.update(payload?.id, payload),
    {
      onSuccess(res) {
        queryClient.invalidateQueries({
          queryKey: [GLOBAL_QUERIES.DEVICE_LIST],
          refetchType: "all",
        });
        queryClient.invalidateQueries([QUERIES.DEVICE_DETAIL, res?.id]);
        dialog.close();
      },
      onError(err: NetshotError) {
        toast.error(err);
      },
    }
  );

  const isMultiple = useMemo(() => devices.length > 1, [devices]);

  const dialog = Dialog.useConfirm({
    title: t(isMultiple ? "Disable devices" : "Disable device"),
    description: (
      <>
        {isMultiple ? (
          <>
            <Text>
              {t("You are about to disable the devices {{names}}", {
                names: devices.map((device) => device.name).join(", "),
              })}
            </Text>
          </>
        ) : (
          <>
            <Text>
              {t("You are about to disable the device {{deviceName}}", {
                deviceName: devices?.[0]?.name,
              })}{" "}
              <Text as="span">
                {t("({{deviceIp}})", {
                  deviceIp: devices?.[0]?.mgmtAddress || t("N/A"),
                })}
              </Text>
            </Text>
          </>
        )}
      </>
    ),
    isLoading: mutation.isLoading,
    onConfirm() {
      for (const device of devices) {
        mutation.mutate({
          id: device?.id,
          enabled: false,
        });
      }
    },
    confirmButton: {
      label: t(isMultiple ? "Disable all" : "Disable"),
      props: {
        colorScheme: "red",
      },
    },
  });

  return renderItem(dialog.open);
}
