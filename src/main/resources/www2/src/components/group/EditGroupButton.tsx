import api from "@/api";
import { UpdateGroupPayload } from "@/api/group";
import { NetshotError } from "@/api/httpClient";
import { FormControl, Switch } from "@/components";
import QueryBuilderButton from "@/components/QueryBuilderButton";
import { QueryBuilderValue } from "@/components/QueryBuilderControl";
import { QUERIES } from "@/constants";
import { useToast } from "@/hooks";
import { DeviceType, Group, GroupType, Option, SimpleDevice } from "@/types";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MouseEvent, ReactElement, useCallback, useMemo } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import DynamicGroupDeviceList from "./DynamicGroupDeviceList";
import StaticGroupDeviceList from "./StaticGroupList";

type EditGroupForm = {
  name: string;
  folder: string;
  visibleInReports: boolean;
  staticDevices: SimpleDevice[];
  driver: Option<DeviceType>;
  query: string;
};

export type EditGroupButtonProps = {
  group: Group;
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

export default function EditGroupButton(props: EditGroupButtonProps) {
  const { group, renderItem } = props;
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { isOpen, onClose, onOpen } = useDisclosure();

  const title = useMemo(() => {
    return t("Edit {{type}} group", {
      type: group.type === GroupType.Static ? t("static") : t("dynamic"),
    });
  }, [t, group]);

  const form = useForm<EditGroupForm>({
    mode: "onChange",
    defaultValues: {
      name: group.name,
      folder: group.folder,
      visibleInReports: !group.hiddenFromReports,
      staticDevices: [],
      driver: null,
      query: group.query,
    },
  });

  // Get driver option from group
  const { isLoading: isDriverLoading } = useQuery(
    [QUERIES.DEVICE_TYPE_LIST],
    api.device.getAllType,
    {
      onSuccess(types) {
        const driverOption = types.find((type) => type.name === group.driver);

        if (driverOption) {
          form.setValue("driver", {
            label: driverOption.name,
            value: driverOption,
          });
        }
      },
      onError(err: NetshotError) {
        toast.error(err);
      },
      enabled: group.driver?.length > 0,
    }
  );

  // Get static devices from group
  const { isLoading: isStaticDeviceListLoading } = useQuery(
    [QUERIES.DEVICE_LIST, group.id, group.folder, group.name],
    async () =>
      api.device.getAll({
        group: group.id,
      }),
    {
      onSuccess(devices) {
        form.setValue("staticDevices", devices);
      },
      onError(err: NetshotError) {
        toast.error(err);
      },
    }
  );

  const query = useWatch({
    control: form.control,
    name: "query",
  });

  const driver = useWatch({
    control: form.control,
    name: "driver",
  });

  const mutation = useMutation(
    async (values: EditGroupForm) => {
      let payload: UpdateGroupPayload = {
        name: group.name,
        folder: group.folder,
        hiddenFromReports: !values.visibleInReports,
      };

      if (group.type === GroupType.Static) {
        payload.staticDevices = values.staticDevices.map((device) => device.id);
      } else if (group.type === GroupType.Dynamic) {
        payload = {
          ...payload,
          driver: values.driver?.value?.name,
          query: values.query,
        };
      }

      await api.group.update(group.id, payload);
    },
    {
      onSuccess() {
        onClose();
        queryClient.invalidateQueries([QUERIES.DEVICE_GROUPS]);
      },
      onError(err: NetshotError) {
        toast.error(err);
      },
    }
  );

  const submit = useCallback((values: EditGroupForm) => {
    mutation.mutate(values);
  }, []);

  const updateQuery = useCallback(
    (values: QueryBuilderValue) => {
      form.setValue("driver", values.driver);
      form.setValue("query", values.query);
    },
    [form]
  );

  const open = useCallback(
    (evt: MouseEvent<HTMLDivElement>) => {
      evt.stopPropagation();
      onOpen();
    },
    [onOpen]
  );

  if (isStaticDeviceListLoading || isDriverLoading) {
    return null;
  }

  return (
    <FormProvider {...form}>
      {renderItem(open)}
      <Modal
        blockScrollOnMount={false}
        isCentered
        size="5xl"
        isOpen={isOpen}
        onClose={onClose}
      >
        <ModalOverlay />
        <ModalContent
          h="80vh"
          containerProps={{
            as: "form",
            onSubmit: form.handleSubmit(submit),
          }}
        >
          <ModalHeader as="h3" fontSize="2xl" fontWeight="semibold">
            {title}
            <ModalCloseButton />
          </ModalHeader>
          <ModalBody overflow="scroll" flex="1" display="flex">
            <Stack direction="row" spacing="9" flex="1">
              <Stack spacing="9" w="340px" overflow="scroll">
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
                    helperText={t("Seperate folder names with slash")}
                  />
                  <Divider />
                  <Switch
                    label={t("Reports")}
                    description={t("Show this group in reports")}
                    control={form.control}
                    name="visibleInReports"
                  />
                </Stack>
                {group.type === GroupType.Dynamic && (
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
              <Stack flex="1" spacing="5" overflow="scroll">
                <Heading as="h4" size="md">
                  {t(
                    group.type === GroupType.Static
                      ? "Selected devices"
                      : "Devices preview"
                  )}
                </Heading>
                {group.type === GroupType.Static ? (
                  <StaticGroupDeviceList />
                ) : (
                  <DynamicGroupDeviceList
                    driver={driver}
                    query={query}
                    onUpdateQuery={updateQuery}
                  />
                )}
              </Stack>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Stack direction="row" spacing="3">
              <Button onClick={onClose}>{t("Cancel")}</Button>
              <Button
                type="submit"
                isDisabled={!form.formState.isValid}
                isLoading={mutation.isLoading}
                variant="primary"
              >
                {t("Apply changes")}
              </Button>
            </Stack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </FormProvider>
  );
}
