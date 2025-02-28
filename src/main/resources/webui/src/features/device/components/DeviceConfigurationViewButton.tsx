import { Dialog } from "@/dialog";
import { DeviceTypeAttribute } from "@/types";
import { ReactElement, useCallback } from "react";
import { useTranslation } from "react-i18next";
import DeviceConfigurationView from "./DeviceConfigurationView";

/**
 * @todo: Impossible de voir ou télécharger adminConfiguration et xrPackages
 */
export type DeviceConfigurationViewButtonProps = {
  id: number;
  attribute: DeviceTypeAttribute;
  renderItem(open: () => void): ReactElement;
};

export default function DeviceConfigurationViewButton(
  props: DeviceConfigurationViewButtonProps
) {
  const { id, attribute, renderItem } = props;
  const { t } = useTranslation();

  const dialog = Dialog.useAlert({
    title: t(attribute?.title),
    description: <DeviceConfigurationView id={id} attribute={attribute} />,
    size: "5xl",
  });

  const open = useCallback(() => {
    dialog.open();
  }, [dialog]);

  return renderItem(open);
}
