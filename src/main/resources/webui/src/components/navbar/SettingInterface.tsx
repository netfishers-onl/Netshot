import { useLanguageOptions } from "@/hooks"
import { Stack } from "@chakra-ui/react"
import { useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Select } from "../Select"

type FormData = {
  language: string
}

export function SettingInterface() {
  const { t, i18n } = useTranslation()
  const { options } = useLanguageOptions()

  const form = useForm<FormData>({
    defaultValues: {
      language: i18n.language,
    },
  })

  const language = useWatch({
    control: form.control,
    name: "language",
  })

  useEffect(() => {
    i18n.changeLanguage(language)
  }, [language])

  return (
    <Stack gap="5" pt="7" flex="1" overflow="auto">
      <Stack gap="6">
        <Select control={form.control} name="language" options={options} label={t("Language")} />
      </Stack>
    </Stack>
  )
}
