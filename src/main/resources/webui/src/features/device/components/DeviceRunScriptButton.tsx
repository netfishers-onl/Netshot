import { Dialog } from "@/dialog";
import { Device, SimpleDevice } from "@/types";
import { MouseEvent, ReactElement, useCallback } from "react";
import { useTranslation } from "react-i18next";
import DeviceScriptView from "./DeviceScriptView";

export type DeviceRunScriptButtonProps = {
  devices: SimpleDevice[] | Device[];
  renderItem(open: (evt: MouseEvent) => void): ReactElement;
};

export default function DeviceRunScriptButton(
  props: DeviceRunScriptButtonProps
) {
  const { devices, renderItem } = props;
  const { t } = useTranslation();

  const dialog = Dialog.useAlert({
    title: t("Run device script"),
    description: <DeviceScriptView devices={devices} />,
    hideFooter: true,
    variant: "full-floating",
  });

  const open = useCallback(
    (evt: MouseEvent) => {
      evt.stopPropagation();
      dialog.open();
    },
    [dialog]
  );

  return renderItem(open);
}
