import { Dialog } from "@/dialog";
import { Config } from "@/types";
import { MouseEvent, ReactElement, useCallback } from "react";
import { useTranslation } from "react-i18next";
import ReportConfigurationCompareEditor from "./ReportConfigurationCompareEditor";

type ReportConfigurationCompareModalProps = {
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
  config: Config;
};

export default function ReportConfigurationCompareModal(
  props: ReportConfigurationCompareModalProps
) {
  const { renderItem, config } = props;
  const { t } = useTranslation();

  const dialog = Dialog.useAlert({
    title: t("Compare changes"),
    description: <ReportConfigurationCompareEditor config={config} />,
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
