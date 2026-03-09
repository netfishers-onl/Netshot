import { FormControl } from "@/components"
import { FormControlType } from "@/components/FormControl"
import validators from "@/utils/validators"
import { Stack } from "@chakra-ui/react"
import { useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"

export type DomainForm = {
  name: string
  description: string
  ipAddress: string
}

export default function AdministrationDomainForm() {
  const form = useFormContext<DomainForm>()
  const { t } = useTranslation()

  return (
    <Stack gap="6">
      <FormControl
        label={t("Name")}
        placeholder={t("e.g. my domain name")}
        required
        control={form.control}
        name="name"
      />
      <FormControl
        type={FormControlType.LongText}
        label={t("Description")}
        placeholder={t("e.g. describe the domain")}
        required
        control={form.control}
        name="description"
      />
      <FormControl
        label={t("Server IP address")}
        placeholder={t("e.g. 10.4.3.8")}
        required
        control={form.control}
        name="ipAddress"
        rules={{
          ...validators.ip(),
        }}
      />
    </Stack>
  )
}
