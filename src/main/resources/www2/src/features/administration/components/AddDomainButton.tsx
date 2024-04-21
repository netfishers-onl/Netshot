import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { Dialog } from "@/dialog";
import { useToast } from "@/hooks";
import { Domain } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MouseEvent, ReactElement, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { QUERIES } from "../constants";
import AdministrationDomainForm, {
  DomainForm,
} from "./AdministrationDomainForm";

export type AddDomainButtonProps = {
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

export default function AddDomainButton(props: AddDomainButtonProps) {
  const { renderItem } = props;
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();

  const form = useForm<DomainForm>({
    mode: "onChange",
    defaultValues: {
      name: "",
      description: "",
      ipAddress: "",
    },
  });

  const mutation = useMutation(
    async (payload: Partial<Domain>) => api.admin.createDomain(payload),
    {
      onSuccess(res) {
        dialog.close();
        form.reset();

        toast.success({
          title: t("Success"),
          description: t("Domain {{name}} has been successfully created", {
            name: res?.name,
          }),
        });

        queryClient.invalidateQueries([QUERIES.ADMIN_DEVICE_DOMAINS]);
      },
      onError(err: NetshotError) {
        toast.error(err);
      },
    }
  );

  const onSubmit = useCallback(
    async (values: DomainForm) => {
      mutation.mutate({
        name: values.name,
        description: values.description,
        ipAddress: values.ipAddress,
      });
    },
    [mutation]
  );

  const dialog = Dialog.useForm({
    title: t("Create domain"),
    description: <AdministrationDomainForm />,
    form,
    isLoading: mutation.isLoading,
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
