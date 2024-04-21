import api from "@/api";
import { Brand, SigninIllustration } from "@/components";
import FormControl, { FormControlType } from "@/components/FormControl";
import useToast from "@/hooks/useToast";
import { Button, Heading, Stack } from "@chakra-ui/react";
import { useMutation } from "@tanstack/react-query";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

type SigninForm = {
  username: string;
  password: string;
};

function SigninScreen() {
  const {
    control,
    handleSubmit,
    formState: { isValid },
  } = useForm<SigninForm>({
    defaultValues: {
      username: "",
      password: "",
    },
  });
  const toast = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const mutation = useMutation(api.auth.signin, {
    onSuccess() {
      navigate("/app");
    },
    onError() {
      toast.error({
        title: t("Authentication failed"),
        description: t("Username or password is incorrect"),
      });
    },
  });

  const submit = useCallback(
    (values: SigninForm) => {
      mutation.mutate(values);
    },
    [mutation]
  );

  return (
    <Stack direction="row" spacing="0" h="100vh">
      <Stack justifyContent="center" alignItems="center" flex="1">
        <Stack mx="auto" width="40%" spacing="12">
          <Brand />
          <Stack spacing="6">
            <Heading as="h4" fontSize="2xl">
              {t("Welcome back")}
            </Heading>
            <Stack as="form" spacing="5" onSubmit={handleSubmit(submit)}>
              <FormControl
                isRequired
                control={control}
                name="username"
                label="Username"
                placeholder={t("Enter your username")}
                rules={{
                  required: true,
                }}
              />
              <FormControl
                isRequired
                type={FormControlType.Password}
                control={control}
                name="password"
                label="Password"
                placeholder={t("Enter password")}
                rules={{
                  required: true,
                }}
              />
              <Button
                type="submit"
                isLoading={mutation.isLoading}
                isDisabled={!isValid}
                variant="primary"
              >
                {t("Sign in")}
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="center"
        bg="green.1000"
        flex="1"
      >
        <SigninIllustration />
      </Stack>
    </Stack>
  );
}

export default SigninScreen;
