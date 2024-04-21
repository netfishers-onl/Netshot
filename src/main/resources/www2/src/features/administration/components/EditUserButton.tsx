import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { HIDDEN_PASSWORD, getUserLevelOption } from "@/constants";
import { Dialog } from "@/dialog";
import { useToast } from "@/hooks";
import { User } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MouseEvent, ReactElement, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { QUERIES } from "../constants";
import AdministrationUserForm, { UserForm } from "./AdministrationUserForm";

export type EditUserButtonProps = {
  user: User;
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

export default function EditUserButton(props: EditUserButtonProps) {
  const { user, renderItem } = props;
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();

  const defaultValues = useMemo(
    () => ({
      username: user?.username,
      level: getUserLevelOption(user?.level),
      hasRemote: !user.local,
    }),
    [user]
  );

  const form = useForm<UserForm>({
    mode: "onChange",
    defaultValues: {
      ...defaultValues,
      password: HIDDEN_PASSWORD,
      confirmPassword: HIDDEN_PASSWORD,
    },
  });

  const mutation = useMutation(
    async (payload: Partial<User>) => api.admin.updateUser(user?.id, payload),
    {
      onSuccess(res) {
        dialog.close();
        toast.success({
          title: t("Success"),
          description: t("User {{username}} has been successfully updated", {
            username: res?.username,
          }),
        });

        queryClient.invalidateQueries([QUERIES.ADMIN_USERS]);
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
        level: values.level.value,
        local: !values.hasRemote,
        password: values.password === HIDDEN_PASSWORD ? "-" : values.password,
      });
    },
    [mutation]
  );

  const dialog = Dialog.useForm({
    title: t("Edit User"),
    description: <AdministrationUserForm />,
    form,
    isLoading: mutation.isLoading,
    size: "2xl",
    onSubmit,
    onCancel() {
      form.reset();
    },
    submitButton: {
      label: t("Apply changes"),
    },
  });

  return renderItem(dialog.open);
}
