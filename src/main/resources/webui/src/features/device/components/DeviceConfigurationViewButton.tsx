import { ReactElement, useCallback } from "react";
import { useTranslation } from "react-i18next";

import { Dialog } from "@/dialog";
import { ConfigLongTextAttribute, DeviceAttributeDefinition } from "@/types";

import DeviceConfigurationView from "./DeviceConfigurationView";

export type DeviceConfigurationViewButtonProps = {
  id: number;
  attribute: ConfigLongTextAttribute;
  definition: DeviceAttributeDefinition;
  renderItem(open: () => void): ReactElement;
};

export default function DeviceConfigurationViewButton(
  props: DeviceConfigurationViewButtonProps
) {
  const { id, attribute, definition, renderItem } = props;
  const { t } = useTranslation();

  const dialog = Dialog.useAlert({
    title: t(definition?.title),
    description: <DeviceConfigurationView id={id} attribute={attribute} />,
    size: "5xl",
  });

  const open = useCallback(() => {
    dialog.open();
  }, [dialog]);

  return renderItem(open);
}
