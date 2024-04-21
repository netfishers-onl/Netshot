import { Dialog } from "@/dialog";
import { DeviceConfig } from "@/types";
import { Button } from "@chakra-ui/react";
import { MouseEvent, useCallback } from "react";
import { useTranslation } from "react-i18next";
import DeviceConfigurationCompareView from "./DeviceConfigurationCompareView";

export type DeviceConfigurationCompareButtonProps = {
  id: number;
  config: DeviceConfig;
};

export default function DeviceConfigurationViewButton(
  props: DeviceConfigurationCompareButtonProps
) {
  const { config, id } = props;
  const { t } = useTranslation();

  const dialog = Dialog.useAlert({
    title: t("Compare changes"),
    description: <DeviceConfigurationCompareView config={config} id={id} />,
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

  return (
    <Button colorScheme="green" variant="ghost" onClick={open}>
      {t("Compare")}
    </Button>
  );
}
