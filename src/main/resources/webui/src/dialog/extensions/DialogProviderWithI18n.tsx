import { PropsWithChildren } from "react"
import { useTranslation } from "react-i18next"
import { DialogProvider, DialogProviderConfig } from "../DialogProvider"

export function DialogProviderWithI18n({ children }: PropsWithChildren) {
  const { t } = useTranslation()

  const dialogProviderConfig: DialogProviderConfig = {
    form: {
      submitButton: {
        label: t("Submit"),
      },
      cancelButton: {
        label: t("Cancel"),
      },
    },
    confirm: {
      confirmButton: {
        label: t("Confirm"),
      },
      cancelButton: {
        label: t("Cancel"),
      },
    },
    alert: {
      closeButton: {
        label: t("OK"),
      },
    },
  }

  return <DialogProvider config={dialogProviderConfig}>{children}</DialogProvider>
}
