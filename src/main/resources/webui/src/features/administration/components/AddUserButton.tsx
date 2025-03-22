import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { USER_LEVEL_OPTIONS } from "@/constants";
import { Dialog } from "@/dialog";
import { useToast } from "@/hooks";
import { User } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MouseEvent, ReactElement, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { QUERIES } from "../constants";
import AdministrationUserForm, { UserForm } from "./AdministrationUserForm";

export type AddUserButtonProps = {
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

export default function AddUserButton(props: AddUserButtonProps) {
  const { renderItem } = props;
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();

  const form = useForm<UserForm>({
    mode: "onChange",
    defaultValues: {
      username: "",
      level: USER_LEVEL_OPTIONS[0],
      isRemote: false,
      password: "",
      confirmPassword: "",
      changePassword: true,
    },
  });

  const mutation = useMutation({
    mutationFn: async (payload: Partial<User>) => api.admin.createUser(payload),
    onSuccess(res) {
      dialog.close();
      toast.success({
        title: t("Success"),
        description: t("User {{username}} has been successfully created", {
          username: res?.username,
        }),
      });

      queryClient.invalidateQueries({ queryKey: [QUERIES.ADMIN_USERS] });
      form.reset();
    },
    onError(err: NetshotError) {
      toast.error(err);
    },
  });

  const onSubmit = useCallback(
    async (values: UserForm) => {
      mutation.mutate({
        username: values.username,
        level: values.level.value,
        local: !values.isRemote,
        password: values.password,
      });
    },
    [mutation]
  );

  const dialog = Dialog.useForm({
    title: t("Create User"),
    description: <AdministrationUserForm />,
    form,
    isLoading: mutation.isPending,
    size: "2xl",
    onSubmit,
    onCancel() {
      form.reset();
    },
    submitButton: {
      label: t("Create"),
    },
  });

  return renderItem(dialog.open);
}
