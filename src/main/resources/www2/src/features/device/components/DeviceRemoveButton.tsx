import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { QUERIES } from "@/constants";
import { Dialog } from "@/dialog";
import { useToast } from "@/hooks";
import { Device } from "@/types";
import { Text } from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MouseEvent, ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { QUERIES as DEVICE_QUERIES } from "../constants";

export type DeviceRemoveButtonProps = {
  device: Device;
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

export default function DeviceRemoveButton(props: DeviceRemoveButtonProps) {
  const { device, renderItem } = props;
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();

  const mutation = useMutation(async () => api.device.remove(device?.id), {
    onSuccess() {
      navigate("/app/device");

      queryClient.invalidateQueries([QUERIES.DEVICE_LIST]);
      queryClient.invalidateQueries([DEVICE_QUERIES.DEVICE_SEARCH_LIST]);

      dialog.close();
    },
    onError(err: NetshotError) {
      toast.error(err);
    },
  });

  const dialog = Dialog.useConfirm({
    title: t("Remove device"),
    description: (
      <Text>
        {t("You are about to remove the device {{deviceName}}", {
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
      mutation.mutate();
    },
    confirmButton: {
      label: t("remove"),
      props: {
        colorScheme: "red",
      },
    },
  });

  return renderItem(dialog.open);
}
