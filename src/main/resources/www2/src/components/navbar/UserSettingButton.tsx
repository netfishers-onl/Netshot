import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { UpdateUserPayload } from "@/api/user";
import { QUERIES, USER_LEVEL_OPTIONS, getUserLevelOption } from "@/constants";
import { useDashboard } from "@/contexts";
import { Dialog } from "@/dialog";
import { useToast } from "@/hooks";
import { Level, Option } from "@/types";
import { Alert, AlertDescription, Stack } from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MouseEvent, ReactElement, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import FormControl, { FormControlType } from "../FormControl";
import Select from "../Select";

export type UserSettingButtonProps = {
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

type UserForm = {
  username: string;
  level: Option<Level>;
  password: string;
  newPassword: string;
  confirmNewPassword: string;
};

export default function UserSettingButton(props: UserSettingButtonProps) {
  const { renderItem } = props;
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user } = useDashboard();

  const defaultValues = useMemo(
    () =>
      ({
        username: user?.username,
        level: getUserLevelOption(user?.level),
        password: "",
        newPassword: "",
        confirmNewPassword: "",
      } as UserForm),
    [user]
  );

  const hasRemoteUser = useMemo(() => !user?.local, [user]);

  const form = useForm<UserForm>({
    mode: "onChange",
    defaultValues,
  });

  const mutation = useMutation(
    async (payload: UpdateUserPayload) => api.user.update(user?.id, payload),
    {
      onSuccess() {
        dialog.close();

        toast.success({
          title: t("Success"),
          description: t("Your setting has been successfully updated"),
        });

        queryClient.invalidateQueries([QUERIES.USER]);
      },
      onError(err: NetshotError) {
        toast.error(err);
      },
    }
  );

  const onSubmit = useCallback(
    async (values: UserForm) => {
      mutation.mutate({
        username: values.username,
        password: values.password,
        newPassword: values.newPassword,
      });
    },
    [mutation]
  );

  const dialog = Dialog.useForm({
    title: t("Settings"),
    description: (
      <Stack spacing="6">
        <FormControl
          label={t("Username")}
          placeholder={t("e.g. admin")}
          control={form.control}
          isReadOnly
          name="username"
        />
        <Select
          control={form.control}
          isReadOnly
          name="level"
          options={USER_LEVEL_OPTIONS}
          label={t("Role")}
        />
        {hasRemoteUser ? (
          <Alert variant="success">
            <AlertDescription>
              {t("You are remotely authenticated")}
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <FormControl
              type={FormControlType.Password}
              label={t("Current password")}
              placeholder={t("enter your password")}
              isRequired
              control={form.control}
              name="password"
            />
            <FormControl
              type={FormControlType.Password}
              label={t("Password")}
              placeholder={t("enter your new password")}
              isRequired
              control={form.control}
              name="newPassword"
            />
            <FormControl
              type={FormControlType.Password}
              label={t("Confirm password")}
              placeholder={t("confirm your new password")}
              isRequired
              control={form.control}
              name="confirmNewPassword"
              rules={{
                validate(value, values) {
                  return (
                    value === values.confirmNewPassword ||
                    t("Password doesn't match")
                  );
                },
              }}
            />
          </>
        )}
      </Stack>
    ),
    form,
    isLoading: mutation.isLoading,
    size: "2xl",
    onSubmit,
    onCancel() {
      form.reset(defaultValues);
    },
    submitButton: {
      label: t("Apply changes"),
    },
  });

  return renderItem(dialog.open);
}
