import api from "@/api"
import FormControl, { FormControlType } from "@/components/FormControl"
import { useAuth } from "@/contexts"
import { useSigninForm } from "@/hooks"
import { Button, Center, Spinner, Stack, Text } from "@chakra-ui/react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router"
import { useSigninMutation, useSigninWithOidcMutation } from "../api/queries"

export function SigninForm() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const form = useSigninForm()
  const { mutation, changePass } = useSigninMutation()
  const signinWithOidcMutation = useSigninWithOidcMutation()
  const { oidcInfo } = useAuth()
  const isOidcConnection = Boolean(oidcInfo?.endpoint && oidcInfo?.clientId)
  const [isOidcForm, setIsOidcForm] = useState<boolean>(isOidcConnection)
  const state = searchParams.get("state")
  const code = searchParams.get("code")

  const submit = form.handleSubmit((values) => {
    if (isOidcForm) {
      window.location.href = api.oidc.generateUrl(oidcInfo!.endpoint!, oidcInfo!.clientId!)
      return
    }
    mutation.mutate(values)
  })

  function toggleOidcForm() {
    setIsOidcForm((prev) => !prev)
  }

  useEffect(() => {
    if (!state || !code) return
    if (state !== api.oidc.getState()) return
    if (mutation.isPending || mutation.isSuccess) return

    api.oidc.removeState()
    signinWithOidcMutation.mutate(code)
  }, [state, code])

  if (signinWithOidcMutation.isPending) {
    return (
      <Center h="100vh">
        <Stack gap="3" alignItems="center">
          <Spinner size="lg" />
          <Text>{t("connectingViaSso")}</Text>
        </Stack>
      </Center>
    )
  }

  if (isOidcForm) {
    return (
      <Stack gap="2" asChild>
        <form onSubmit={submit}>
          <Button variant="primary" type="submit">
            {t("signInWithSso")}
          </Button>
          <Button variant="default" onClick={toggleOidcForm}>
            {t("signInWithUsername")}
          </Button>
        </form>
        {signinWithOidcMutation.isError && (
          <Text color="red.500">{t("SSO authentication error")}</Text>
        )}
      </Stack>
    )
  }

  return (
    <Stack gap="5" asChild>
      <form onSubmit={submit}>
        <FormControl
          required
          control={form.control}
          name="username"
          label="username"
          placeholder={t("enterYourUsername")}
          rules={{
            required: true,
          }}
          readOnly={changePass}
        />
        <FormControl
          required
          type={FormControlType.Password}
          control={form.control}
          name="password"
          label="password"
          placeholder={t("enterPassword")}
          rules={{
            required: true,
          }}
          readOnly={changePass}
        />
        {changePass && (
          <FormControl
            required
            type={FormControlType.Password}
            control={form.control}
            name="newPassword"
            label="New password"
            placeholder={t("enterNewPassword")}
            rules={{
              required: true,
            }}
            autoFocus
          />
        )}
        <Stack gap="2">
          <Button
            type="submit"
            loading={mutation.isPending}
            disabled={!form.formState.isValid}
            variant="primary"
          >
            {changePass ? t("changePasswordAndSignIn") : t("signIn")}
          </Button>
          {isOidcConnection && (
            <Button onClick={toggleOidcForm} variant="default">
              {t("signInWithSso")}
            </Button>
          )}
        </Stack>
      </form>
    </Stack>
  )
}
