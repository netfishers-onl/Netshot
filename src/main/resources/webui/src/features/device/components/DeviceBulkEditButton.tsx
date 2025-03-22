import api, { UpdateDevicePayload } from "@/api";
import { NetshotError } from "@/api/httpClient";
import { Checkbox, DomainSelect } from "@/components";
import { QUERIES } from "@/constants";
import { Dialog } from "@/dialog";
import { useToast } from "@/hooks";
import { Option, SimpleDevice } from "@/types";
import {
  Alert,
  AlertDescription,
  FormLabel,
  Checkbox as NativeCheckbox,
  Skeleton,
  Stack,
} from "@chakra-ui/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { MouseEvent, ReactElement, useCallback } from "react";
import { useForm, useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

type Form = {
  mgmtDomain: Option<number>;
  credentialSetIds: number[];
};

export type DeviceBulkEditButtonProps = {
  devices: SimpleDevice[];
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

function DeviceBulkEditForm() {
  const form = useFormContext();
  const { t } = useTranslation();

  const { data: credentialSets, isPending } = useQuery({
    queryKey: [QUERIES.CREDENTIAL_SET_LIST],
    queryFn: async () =>
      api.admin.getAllCredentialSets({
        offset: 0,
        limit: 999,
      })
  });

  const credentialSetIds = useWatch({
    control: form.control,
    name: "credentialSetIds",
  });

  const toggleCredentialSetId = useCallback(
    (id: number) => {
      const ids = [...credentialSetIds];
      const index = credentialSetIds.findIndex((i) => i === id);

      if (index !== -1) {
        ids.splice(index, 1);
      } else {
        ids.push(id);
      }

      form.setValue("credentialSetIds", ids);
    },
    [credentialSetIds]
  );

  return (
    <Stack spacing="6" px="6">
      <DomainSelect control={form.control} name="mgmtDomain" />
      <Stack spacing="3">
        <FormLabel>{t("Use the following credential set")}</FormLabel>
        {isPending ? (
          <Stack spacing="2">
            <Skeleton w="100%" h="36px" />
            <Skeleton w="100%" h="36px" />
            <Skeleton w="100%" h="36px" />
            <Skeleton w="100%" h="36px" />
          </Stack>
        ) : (
          <Stack spacing="2">
            {credentialSets.map((credentialSet) => (
              <NativeCheckbox
                defaultValue={credentialSetIds.includes(credentialSet?.id)}
                onChange={() => toggleCredentialSetId(credentialSet?.id)}
                key={credentialSet?.id}
                isChecked={credentialSetIds.includes(credentialSet?.id)}
              >
                {credentialSet?.name} ({credentialSet?.type})
              </NativeCheckbox>
            ))}
            <Checkbox control={form.control} name="autoTryCredentials">
              {t("In case of failure, also try all known credentials")}
            </Checkbox>
          </Stack>
        )}
      </Stack>
    </Stack>
  );
}

export default function DeviceBulkEditButton(props: DeviceBulkEditButtonProps) {
  const { devices, renderItem } = props;
  const { t } = useTranslation();
  const toast = useToast();

  const form = useForm<Form>({
    mode: "onChange",
    defaultValues: {
      credentialSetIds: [],
    },
  });

  const edit = useMutation({
    mutationFn: async (payload: Partial<UpdateDevicePayload>) =>
      api.device.update(payload?.id, payload),
    onError(err: NetshotError) {
      toast.error(err);
    },
  });

  const onSubmit = useCallback(
    async (data: Form) => {
      for (const device of devices) {
        await edit.mutateAsync({
          id: device?.id,
          mgmtDomain: data?.mgmtDomain?.value,
          credentialSetIds: data?.credentialSetIds,
        } as Partial<UpdateDevicePayload>);
      }

      dialog.close();

      toast.success({
        title: t("Success"),
        description: t("{{length}} devices has been successfully modified", {
          length: devices?.length,
        }),
      });

      form.reset();
    },
    [devices, edit]
  );

  const dialog = Dialog.useForm({
    title: t("Edit devices"),
    description: (
      <>
        <Stack px="6" mb="6">
          <Alert status="info" bg="blue.50">
            <AlertDescription color="blue.900">
              {t("The modifications will be applied to {{length}} devices", {
                length: devices?.length,
              })}
            </AlertDescription>
          </Alert>
        </Stack>
        <DeviceBulkEditForm />
      </>
    ),
    form,
    isLoading: edit.isPending,
    size: "2xl",
    variant: "floating",
    onSubmit,
    submitButton: {
      label: t("Apply changes"),
    },
  });

  return renderItem(dialog.open);
}
