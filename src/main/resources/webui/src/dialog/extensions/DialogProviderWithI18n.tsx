import { PropsWithChildren } from "react"
import { useTranslation } from "react-i18next"
import { DialogProvider, DialogProviderConfig } from "../DialogProvider"

export function DialogProviderWithI18n({ children }: PropsWithChildren) {
  const { t } = useTranslation()

  const dialogProviderConfig: DialogProviderConfig = {
    form: {
      submitButton: {
        label: t("common.submit"),
      },
      cancelButton: {
        label: t("common.cancel"),
      },
    },
    confirm: {
      confirmButton: {
        label: t("common.confirm"),
      },
      cancelButton: {
        label: t("common.cancel"),
      },
    },
    alert: {
      closeButton: {
        label: t("common.close"),
      },
    },
  }

  return <DialogProvider config={dialogProviderConfig}>{children}</DialogProvider>
}
