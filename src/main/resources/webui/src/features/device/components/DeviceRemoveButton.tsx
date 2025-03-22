import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { QUERIES } from "@/constants";
import { Dialog } from "@/dialog";
import { useToast } from "@/hooks";
import { Device, SimpleDevice } from "@/types";
import { Text } from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MouseEvent, ReactElement, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { QUERIES as DEVICE_QUERIES } from "../constants";

export type DeviceRemoveButtonProps = {
  devices: SimpleDevice[] | Device[];
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

export default function DeviceRemoveButton(props: DeviceRemoveButtonProps) {
  const { devices, renderItem } = props;
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: async (id: number) => api.device.remove(id),
    onSuccess() {
      navigate("/app/devices");

      queryClient.invalidateQueries({ queryKey: [QUERIES.DEVICE_LIST] });
      queryClient.invalidateQueries({ queryKey: [DEVICE_QUERIES.DEVICE_SEARCH_LIST] });

      dialog.close();
    },
    onError(err: NetshotError) {
      toast.error(err);
    },
  });

  const isMultiple = useMemo(() => devices.length > 1, [devices]);

  const dialog = Dialog.useConfirm({
    title: t(isMultiple ? "Remove selected devices" : "Remove device"),
    description: (
      <>
        {isMultiple ? (
          <>
            {t("You are about to remove the devices {{names}}", {
              names: devices.map((device) => device.name).join(", "),
            })}
          </>
        ) : (
          <>
            <Text>
              {t("You are about to remove the device {{deviceName}}", {
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
    isLoading: mutation.isPending,
    onConfirm() {
      for (const device of devices) {
        mutation.mutate(device.id);
      }
    },
    confirmButton: {
      label: t(isMultiple ? "Remove all" : "remove"),
      props: {
        colorScheme: "red",
      },
    },
  });

  return renderItem(dialog.open);
}
