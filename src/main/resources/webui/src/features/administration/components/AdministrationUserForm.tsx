import { FormControl, Switch } from "@/components"
import { FormControlType } from "@/components/FormControl"
import { Select } from "@/components/Select"
import { useUserLevelOptions } from "@/hooks"
import { Stack, Text } from "@chakra-ui/react"
import { useEffect } from "react"
import { useFormContext, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"

export type UserForm = {
  username: string
  level: string
  isRemote: boolean
  password?: string
  confirmPassword?: string
  changePassword: boolean
}

export type AdministrationUserFormProps = {
  showChangePassword?: boolean
}

export default function AdministrationUserForm(props: AdministrationUserFormProps) {
  const { showChangePassword = false } = props
  const form = useFormContext<UserForm>()
  const { t } = useTranslation()
  const userLevelOptions = useUserLevelOptions()

  const isRemote = useWatch({
    control: form.control,
    name: "isRemote",
  })

  const changePassword = useWatch({
    control: form.control,
    name: "changePassword",
  })

  const password = useWatch({
    control: form.control,
    name: "password",
  })

  useEffect(() => {
    if (!isRemote) return

    form.setValue("password", "")
    form.setValue("confirmPassword", "")
  }, [isRemote])

  return (
    <Stack gap="6">
      <FormControl
        label={t("Username")}
        placeholder={t("E.g. {{example}}", { example: "admin" })}
        required
        control={form.control}
        name="username"
      />
      <Select
        required
        options={userLevelOptions.options}
        control={form.control}
        name="level"
        label={t("Role")}
        placeholder={t("Select role")}
      />
      <Stack direction="row" gap="6">
        <Stack gap="0" flex="1">
          <Text fontWeight="medium">{t("Remote user")}</Text>
          <Text color="grey.400">
            {t("User will be authenticated by a remote server (e.g. RADIUS)")}
          </Text>
        </Stack>
        <Switch w="initial" control={form.control} name="isRemote" />
      </Stack>
      {!isRemote && showChangePassword && (
        <Stack direction="row" gap="6">
          <Stack gap="0" flex="1">
            <Text fontWeight="medium">{t("Change password")}</Text>
          </Stack>
          <Switch w="initial" control={form.control} name="changePassword" />
        </Stack>
      )}
      {!isRemote && changePassword && (
        <>
          <FormControl
            required
            type={FormControlType.Password}
            control={form.control}
            name="password"
            label={t("Password")}
            placeholder={t("Enter password")}
          />
          <FormControl
            required
            type={FormControlType.Password}
            control={form.control}
            name="confirmPassword"
            label={t("Confirm password")}
            placeholder={t("Confirm password")}
            rules={{
              validate(value) {
                return value === password || t("Password doesn't match")
              },
            }}
          />
        </>
      )}
    </Stack>
  )
}
