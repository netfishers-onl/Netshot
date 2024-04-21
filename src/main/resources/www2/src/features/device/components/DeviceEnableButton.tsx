import api from "@/api";
import { UpdateDevicePayload } from "@/api/device";
import { NetshotError } from "@/api/httpClient";
import { Dialog } from "@/dialog";
import { useToast } from "@/hooks";
import { Device } from "@/types";
import { Text } from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MouseEvent, ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { QUERIES } from "../constants";

export type DeviceEnableButtonProps = {
  device: Device;
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

export default function DeviceEnableButton(props: DeviceEnableButtonProps) {
  const { device, renderItem } = props;
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const toast = useToast();

  const mutation = useMutation(
    async (payload: Partial<UpdateDevicePayload>) =>
      api.device.update(device?.id, payload),
    {
      onSuccess() {
        queryClient.invalidateQueries([QUERIES.DEVICE_DETAIL, device?.id]);
        dialog.close();
      },
      onError(err: NetshotError) {
        toast.error(err);
      },
    }
  );

  const dialog = Dialog.useConfirm({
    title: t("Enable device"),
    description: (
      <Text>
        {t("You are about to enable the device {{deviceName}}", {
          deviceName: device?.name,
        })}{" "}
        <Text as="span">
          {t("({{deviceIp}})", {
            deviceIp: device?.mgmtAddress || t("N/A"),
          })}
        </Text>
      </Text>
    ),
    isLoading: mutation.isLoading,
    onConfirm() {
      mutation.mutate({
        enabled: true,
      });
    },
    confirmButton: {
      label: t("Enable"),
    },
  });

  return renderItem(dialog.open);
}
