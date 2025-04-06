import api, { CreateGroupPayload } from "@/api";
import { NetshotError } from "@/api/httpClient";
import { BoxWithIconButton, FormControl, Switch } from "@/components";
import QueryBuilderButton from "@/components/QueryBuilderButton";
import { QueryBuilderValue } from "@/components/QueryBuilderControl";
import { QUERIES } from "@/constants";
import { useToast } from "@/hooks";
import { GroupType } from "@/types";
import {
  Box,
  Button,
  Divider,
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Tag,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MouseEvent,
  ReactElement,
  useCallback,
  useMemo,
  useState,
} from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import DynamicGroupDeviceList from "./DynamicGroupDeviceList";
import StaticGroupDeviceList from "./StaticGroupList";
import { AddGroupForm, FormStep } from "./types";

export type AddGroupButtonProps = {
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

export default function AddGroupButton(props: AddGroupButtonProps) {
  const { renderItem } = props;
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [groupType, setGroupType] = useState<GroupType>(null);
  const [formStep, setFormStep] = useState(FormStep.Type);
  const { isOpen, onClose, onOpen } = useDisclosure();
  const [size, setSize] = useState("2xl");

  const title = useMemo(() => {
    if (formStep === FormStep.Type) {
      return t("Choose group type");
    }

    return t("Create {{type}} group", {
      type: groupType === GroupType.Static ? t("static") : t("dynamic"),
    });
  }, [t, formStep, groupType]);

  const form = useForm<AddGroupForm>({
    mode: "onChange",
    defaultValues: {
      name: "",
      folder: "",
      visibleInReports: true,
      staticDevices: [],
      driver: null,
      query: "",
    },
  });

  const query = useWatch({
    control: form.control,
    name: "query",
  });

  const driver = useWatch({
    control: form.control,
    name: "driver",
  });

  const createMutation = useMutation({
    mutationFn: async (values: AddGroupForm) => {
      let payload: CreateGroupPayload = {
        folder: values.folder,
        name: values.name,
        type: groupType,
        hiddenFromReports: !values.visibleInReports,
      };

      if (groupType === GroupType.Static) {
        payload.staticDevices = values.staticDevices.map((device) => device.id);
      }
      else if (groupType === GroupType.Dynamic) {
        payload = {
          ...payload,
          driver: values.driver?.value?.name,
          query: values.query,
        };
      }

      await api.group.create(payload);
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: [QUERIES.DEVICE_GROUPS] });
      close();
    },
    onError(err: NetshotError) {
      toast.error(err);
    },
  });

  const close = useCallback(() => {
    onClose();

    // Wait modal disppeared before re-init (blink effect)
    setTimeout(() => {
      setFormStep(FormStep.Type);
      setGroupType(null);
      setSize("2xl");
      form.reset();
    }, 100);
  }, [onClose]);

  const next = useCallback(() => {
    setFormStep(FormStep.Details);
    setSize("5xl");
  }, []);

  const submit = useCallback((values: AddGroupForm) => {
    createMutation.mutate(values);
  }, []);

  const updateQuery = useCallback(
    (values: QueryBuilderValue) => {
      form.setValue("driver", values.driver);
      form.setValue("query", values.query);
    },
    [form]
  );

  return (
    <FormProvider {...form}>
      {renderItem(onOpen)}
      <Modal
        blockScrollOnMount={false}
        isCentered
        size={size}
        isOpen={isOpen}
        onClose={close}
      >
        <ModalOverlay />
        <ModalContent
          h={formStep === FormStep.Details ? "80vh" : null}
          containerProps={{
            as: "form",
            onSubmit: form.handleSubmit(submit),
          }}
        >
          <ModalHeader as="h3" fontSize="2xl" fontWeight="semibold">
            {title}
            <ModalCloseButton />
          </ModalHeader>
          <ModalBody flex="1" display="flex">
            {formStep === FormStep.Type && (
              <Stack direction="row" spacing="5">
                <BoxWithIconButton
                  title={t("Static")}
                  description={t("Create simple static group of devices")}
                  icon="server"
                  isActive={groupType === GroupType.Static}
                  onClick={() => setGroupType(GroupType.Static)}
                />
                <BoxWithIconButton
                  title={t("Dynamic")}
                  description={t(
                    "Create a dynamically populated group of devices"
                  )}
                  icon="code"
                  isActive={groupType === GroupType.Dynamic}
                  onClick={() => setGroupType(GroupType.Dynamic)}
                />
              </Stack>
            )}

            {formStep === FormStep.Details && (
              <Stack direction="row" spacing="9" flex="1">
                <Stack spacing="9" w="340px" overflowY="auto">
                  <Stack spacing="5">
                    <Heading as="h4" size="md">
                      {t("Informations")}
                    </Heading>
                    <FormControl
                      isRequired
                      control={form.control}
                      name="name"
                      label={t("Name")}
                      placeholder={t("Enter the group name")}
                    />
                    <FormControl
                      isRequired
                      control={form.control}
                      name="folder"
                      label={t("Folder")}
                      placeholder={t("e.g. folder A / Subfolder A / ...")}
                      helperText={t("Use slashes to give a folder path")}
                    />
                    <Divider />
                    <Switch
                      label={t("Reports")}
                      description={t("Show this group in reports")}
                      control={form.control}
                      name="visibleInReports"
                    />
                  </Stack>
                  {groupType === GroupType.Dynamic && (
                    <>
                      <Divider />
                      <Stack spacing="5">
                        <Stack spacing="2">
                          <Heading as="h4" size="md">
                            {t("Populate")}
                          </Heading>
                          <Text color="grey.400">
                            {t(
                              "Define the search criteria to dynamically populate the group"
                            )}
                          </Text>
                        </Stack>
                        {driver && (
                          <Tag colorScheme="grey" alignSelf="start">
                            {t("Device type: ")} {driver.label}
                          </Tag>
                        )}
                        {query?.length > 0 && (
                          <Box
                            p="3"
                            borderWidth="1px"
                            borderColor="grey.100"
                            borderRadius="xl"
                          >
                            <Text fontFamily="mono">{query}</Text>
                          </Box>
                        )}
                        <QueryBuilderButton
                          value={{
                            query,
                            driver,
                          }}
                          renderItem={(open) => (
                            <Button alignSelf="start" onClick={open}>
                              {t("Edit query")}
                            </Button>
                          )}
                          onSubmit={updateQuery}
                        />
                      </Stack>
                    </>
                  )}
                </Stack>
                <Stack flex="1" spacing="5" overflowY="auto">
                  <Heading as="h4" size="md">
                    {t(
                      groupType === GroupType.Static
                        ? "Selected devices"
                        : "Device list preview"
                    )}
                  </Heading>
                  {groupType === GroupType.Static && (
                    <StaticGroupDeviceList />
                  )}
                  {groupType === GroupType.Dynamic && (
                    <DynamicGroupDeviceList
                      driver={driver}
                      query={query}
                      onUpdateQuery={updateQuery}
                    />
                  )}
                </Stack>
              </Stack>
            )}
          </ModalBody>
          <ModalFooter>
            <Stack direction="row" spacing="3">
              <Button onClick={close}>{t("Cancel")}</Button>
              {formStep === FormStep.Type ? (
                <Button variant="primary" onClick={next}>
                  {t("Next")}
                </Button>
              ) : (
                <Button
                  type="submit"
                  isDisabled={!form.formState.isValid}
                  isLoading={createMutation.isPending}
                  variant="primary"
                >
                  {t("Create")}
                </Button>
              )}
            </Stack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </FormProvider>
  );
}
