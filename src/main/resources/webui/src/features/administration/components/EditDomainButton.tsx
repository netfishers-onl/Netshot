import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { Dialog } from "@/dialog";
import { useToast } from "@/hooks";
import { Domain } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MouseEvent, ReactElement, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { QUERIES } from "../constants";
import AdministrationDomainForm, {
  DomainForm,
} from "./AdministrationDomainForm";

export type EditDomainButtonProps = {
  domain: Domain;
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

export default function EditDomainButton(props: EditDomainButtonProps) {
  const { domain, renderItem } = props;
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();

  const defaultValues = useMemo(
    () => ({
      name: domain?.name,
      description: domain?.description,
      ipAddress: domain?.ipAddress,
    }),
    [domain]
  );

  const form = useForm<DomainForm>({
    mode: "onChange",
    defaultValues,
  });

  const mutation = useMutation({
    mutationFn: async (payload: Partial<Domain>) =>
      api.admin.updateDomain(domain?.id, payload),
    onSuccess(res) {
      dialog.close();
      toast.success({
        title: t("Success"),
        description: t("Domain {{name}} has been successfully updated", {
          name: res?.name,
        }),
      });

      queryClient.invalidateQueries({ queryKey: [QUERIES.ADMIN_DEVICE_DOMAINS] });
    },
    onError(err: NetshotError) {
      toast.error(err);
    },
  });

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
    title: t("Edit domain"),
    description: <AdministrationDomainForm />,
    form,
    isLoading: mutation.isPending,
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
