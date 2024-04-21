import { Dialog } from "@/dialog";
import { ReactElement, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import DeviceConfigurationView from "./DeviceConfigurationView";

/**
 * @todo: Impossible de voir ou télécharger adminConfiguration et xrPackages
 */
export type DeviceConfigurationViewButtonProps = {
  id: number;
  type: "configuration" | "adminConfiguration" | "xrPackages";
  renderItem(open: () => void): ReactElement;
};

export default function DeviceConfigurationViewButton(
  props: DeviceConfigurationViewButtonProps
) {
  const { id, type, renderItem } = props;
  const { t } = useTranslation();

  const title = useMemo(() => {
    if (type === "configuration") {
      return t("Configuration changes");
    } else if (type === "adminConfiguration") {
      return t("Admin configuration changes");
    } else if (type === "xrPackages") {
      return t("XR packages changes");
    }
  }, [type]);

  const dialog = Dialog.useAlert({
    title,
    description: <DeviceConfigurationView id={id} type={type} />,
    size: "5xl",
  });

  const open = useCallback(() => {
    dialog.open();
  }, [dialog]);

  return renderItem(open);
}
