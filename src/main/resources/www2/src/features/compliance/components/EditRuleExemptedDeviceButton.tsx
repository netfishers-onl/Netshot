import api, { RuleStateChangePayload } from "@/api";
import { NetshotError } from "@/api/httpClient";
import { DeviceAutocomplete, FormControl, Icon, Search } from "@/components";
import { FormControlType } from "@/components/FormControl";
import { Dialog } from "@/dialog";
import { useToast } from "@/hooks";
import { ExemptedDevice, Rule, SimpleDevice } from "@/types";
import { formatDate, search } from "@/utils";
import {
  Button,
  Flex,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Stack,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays } from "date-fns";
import { MouseEvent, ReactElement, useCallback, useState } from "react";
import { useForm, useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { QUERIES } from "../constants";

type Form = {
  device: SimpleDevice;
  expirationDate: string;
};

type AddRuleExemptedDeviceFormProps = {
  exemptedDevices: ExemptedDevice[];
};

function AddRuleExemptedDeviceForm(props: AddRuleExemptedDeviceFormProps) {
  const { exemptedDevices } = props;
  const { t } = useTranslation();
  const form = useFormContext<Form>();
  const selectedDevice = useWatch({
    control: form.control,
    name: "device",
  });

  const onChange = useCallback(
    (device: SimpleDevice) => {
      form.setValue("device", device);
    },
    [form]
  );

  const filterBy = useCallback(
    (options: SimpleDevice[]) => {
      return options.filter(
        (option) =>
          !exemptedDevices.map((device) => device.id).includes(option.id)
      );
    },
    [exemptedDevices]
  );

  return (
    <Stack spacing="4">
      <DeviceAutocomplete
        value={selectedDevice}
        onChange={onChange}
        filterBy={filterBy}
      />
      <FormControl
        type={FormControlType.Date}
        label={t("End date")}
        control={form.control}
        name="expirationDate"
      />
    </Stack>
  );
}

type AddRuleExemptedDeviceButtonProps = {
  policyId: number;
  rule: Rule;
  exemptedDevices: ExemptedDevice[];
};

function AddRuleExemptedDeviceButton(props: AddRuleExemptedDeviceButtonProps) {
  const { policyId, rule, exemptedDevices } = props;

  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  const form = useForm<Form>({
    mode: "onChange",
    defaultValues: {
      device: null,
      expirationDate: addDays(new Date(), 7).toISOString().substring(0, 10),
    },
  });

  const mutation = useMutation(
    async (payload: RuleStateChangePayload) =>
      api.rule.updateExemptedDevice(rule.id, payload),
    {
      onSuccess(res) {
        dialog.close();
        toast.success({
          title: t("Success"),
          description: t(
            "Rule {{name}} exempted devices has been successfully updated",
            {
              name: res?.name,
            }
          ),
        });

        queryClient.invalidateQueries([QUERIES.POLICY_RULE_LIST, policyId]);
        queryClient.invalidateQueries([QUERIES.RULE_DETAIL, policyId, res.id]);
        queryClient.invalidateQueries([QUERIES.RULE_EXEMPTED_DEVICES]);

        form.reset();
      },
      onError(err: NetshotError) {
        toast.error(err);
      },
    }
  );

  const onSubmit = useCallback(
    async (values: Form) => {
      const exemptions = exemptedDevices.reduce((previous, current) => {
        previous[current.id] = current.expirationDate;
        return previous;
      }, {});

      exemptions[values.device.id] = values.expirationDate;

      mutation.mutate({
        name: rule.name,
        exemptions,
        enabled: rule.enabled,
      });
    },
    [mutation, exemptedDevices, rule]
  );

  const dialog = Dialog.useForm({
    title: t("Add exempted device"),
    description: (
      <AddRuleExemptedDeviceForm exemptedDevices={exemptedDevices} />
    ),
    form,
    isLoading: mutation.isLoading,
    size: "2xl",
    onSubmit,
    onCancel() {
      form.reset();
    },
    submitButton: {
      label: t("Add"),
    },
  });

  return (
    <Button
      variant="primary"
      onClick={dialog.open}
      leftIcon={<Icon name="plus" />}
    >
      {t("Add")}
    </Button>
  );
}

export type EditRuleExemptedDeviceButtonProps = {
  policyId: number;
  rule: Rule;
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

export default function EditRuleExemptedDeviceButton(
  props: EditRuleExemptedDeviceButtonProps
) {
  const { policyId, rule, renderItem } = props;
  const { t } = useTranslation();
  const toast = useToast();
  const disclosure = useDisclosure();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState<string>("");

  const { data: exemptedDevices, isLoading } = useQuery(
    [QUERIES.RULE_EXEMPTED_DEVICES, rule?.id, query],
    () => api.rule.getAllExemptedDevice(rule?.id),
    {
      select(res) {
        return search(res, "name").with(query);
      },
      onError(err: NetshotError) {
        toast.error(err);
      },
    }
  );

  const updateMutation = useMutation(
    async (payload: RuleStateChangePayload) =>
      api.rule.updateExemptedDevice(rule.id, payload),
    {
      onSuccess() {
        queryClient.invalidateQueries([QUERIES.RULE_EXEMPTED_DEVICES]);
      },
      onError(err: NetshotError) {
        toast.error(err);
      },
    }
  );

  const open = useCallback(
    (evt: MouseEvent) => {
      evt.stopPropagation();
      disclosure.onOpen();
    },
    [disclosure]
  );

  const onQuery = useCallback((query: string) => {
    setQuery(query);
  }, []);

  const remove = useCallback(
    (device: ExemptedDevice) => {
      const exemptions = exemptedDevices
        .filter((exemptedDevice) => exemptedDevice.id !== device.id)
        .reduce((previous, current) => {
          previous[current.id] = current.expirationDate;
          return previous;
        }, {});

      updateMutation.mutate({
        enabled: rule.enabled,
        exemptions,
        name: rule.name,
      });
    },
    [updateMutation, exemptedDevices, rule]
  );

  return (
    <>
      {renderItem(open)}
      <Modal
        isOpen={disclosure.isOpen}
        isCentered
        motionPreset="slideInBottom"
        onClose={disclosure.onClose}
        size="2xl"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader
            as="h3"
            fontSize="xl"
            lineHeight="120%"
            fontWeight="bold"
          >
            {t("Exempted devices")}
            <ModalCloseButton />
          </ModalHeader>
          <ModalBody pb="7">
            <Stack spacing="6">
              <Stack direction="row" spacing="3">
                <Search
                  onQuery={onQuery}
                  placeholder={t("Search with device name or IP")}
                  flex="1"
                />

                <AddRuleExemptedDeviceButton
                  key={exemptedDevices?.length}
                  policyId={policyId}
                  rule={rule}
                  exemptedDevices={exemptedDevices}
                />
              </Stack>
              {isLoading ? (
                <Flex py="4" justifyContent="center" alignContent="center">
                  <Spinner />
                </Flex>
              ) : (
                <>
                  {exemptedDevices?.length > 0 ? (
                    <Stack spacing="4">
                      {exemptedDevices?.map((device) => (
                        <Stack
                          px="4"
                          py="4"
                          spacing="3"
                          border="1px"
                          borderColor="grey.100"
                          bg="white"
                          borderRadius="2xl"
                          boxShadow="sm"
                          key={device.id}
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                        >
                          <Stack spacing="1">
                            <Text fontWeight="medium">{device?.name}</Text>
                            <Text color="grey.400">
                              {t("Expires in ")}
                              {formatDate(device?.expirationDate, "dd/MM/yyyy")}
                            </Text>
                          </Stack>
                          <IconButton
                            variant="ghost"
                            colorScheme="green"
                            aria-label={t("Remove device")}
                            onClick={() => remove(device)}
                            icon={<Icon name="trash" />}
                          />
                        </Stack>
                      ))}
                    </Stack>
                  ) : (
                    <Flex
                      bg="grey.50"
                      borderRadius="xl"
                      py="4"
                      justifyContent="center"
                      alignContent="center"
                    >
                      <Text color="grey.500">
                        {t("No exempted device selected")}
                      </Text>
                    </Flex>
                  )}
                </>
              )}
            </Stack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
