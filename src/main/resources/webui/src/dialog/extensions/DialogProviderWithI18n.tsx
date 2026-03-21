import { PropsWithChildren } from "react"
import { useTranslation } from "react-i18next"
import { DialogProvider, DialogProviderConfig } from "../DialogProvider"

export function DialogProviderWithI18n({ children }: PropsWithChildren) {
  const { t } = useTranslation()

  const dialogProviderConfig: DialogProviderConfig = {
    form: {
      submitButton: {
        label: t("submit"),
      },
      cancelButton: {
        label: t("cancel"),
      },
    },
    confirm: {
      confirmButton: {
        label: t("confirm"),
      },
      cancelButton: {
        label: t("cancel"),
      },
    },
    alert: {
      closeButton: {
        label: t("ok"),
      },
    },
  }

  return <DialogProvider config={dialogProviderConfig}>{children}</DialogProvider>
}
