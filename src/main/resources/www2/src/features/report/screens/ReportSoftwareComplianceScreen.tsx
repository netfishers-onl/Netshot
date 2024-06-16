import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { DomainSelect, GroupOrFolderItem, Icon, Search } from "@/components";
import { QUERIES as GLOBAL_QUERIES } from "@/constants";
import { Dialog } from "@/dialog";
import { usePagination, useToast } from "@/hooks";
import { useColor } from "@/theme";
import { Group, GroupSoftwareComplianceStat, Option } from "@/types";
import { createFoldersFromGroups, isGroup, search } from "@/utils";
import {
  Box,
  Button,
  Divider,
  Heading,
  Menu,
  MenuButton,
  MenuList,
  ModalCloseButton,
  ModalHeader,
  Skeleton,
  Spacer,
  Stack,
  Tag,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { MouseEvent, useCallback, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import SoftwareComplianceDialog from "../components/SoftwareComplianceDialog";
import { QUERIES } from "../constants";

type FilterForm = {
  domain: Option<number>;
};

function ReportSoftwareComplianceGroupItem({
  item,
}: {
  item: GroupSoftwareComplianceStat;
}) {
  const { t } = useTranslation();
  const gold = useColor("yellow.500");
  const silver = useColor("grey.200");
  const bronze = useColor("bronze.500");
  const nonCompliant = useColor("grey.900");

  const dialog = Dialog.useAlert({
    title: (
      <ModalHeader
        as={Stack}
        display="flex"
        direction="row"
        alignItems="center"
        spacing="4"
      >
        <Heading as="h3" fontSize="2xl" fontWeight="semibold">
          {t("Software compliance")}
        </Heading>

        <Tag colorScheme="grey">{item.groupName}</Tag>
        <ModalCloseButton />
      </ModalHeader>
    ),
    description: <SoftwareComplianceDialog item={item} />,
    variant: "full-floating",
    hideFooter: true,
  });

  const nonCompliantDeviceCount = useMemo(
    () =>
      item.deviceCount -
      item.goldDeviceCount -
      item.silverDeviceCount -
      item.bronzeDeviceCount,
    [item]
  );

  const openDetail = useCallback(
    (evt: MouseEvent<HTMLDivElement>) => {
      evt.stopPropagation();
      dialog.open();
    },
    [dialog]
  );

  return (
    <Stack
      onClick={openDetail}
      direction="row"
      px="6"
      alignItems="center"
      spacing="4"
    >
      <Tooltip label={t("Gold")}>
        <Stack direction="row" alignItems="center" spacing="3">
          <Box w="14px" h="14px" borderRadius="4px" bg={gold} />
          <Text>{item.goldDeviceCount}</Text>
        </Stack>
      </Tooltip>
      <Divider orientation="vertical" h="18px" />
      <Tooltip label={t("Silver")}>
        <Stack direction="row" alignItems="center" spacing="3">
          <Box w="14px" h="14px" borderRadius="4px" bg={silver} />

          <Text>{item.silverDeviceCount}</Text>
        </Stack>
      </Tooltip>
      <Divider orientation="vertical" h="18px" />
      <Tooltip label={t("Bronze")}>
        <Stack direction="row" alignItems="center" spacing="3">
          <Box w="14px" h="14px" borderRadius="4px" bg={bronze} />

          <Text>{item.bronzeDeviceCount}</Text>
        </Stack>
      </Tooltip>
      <Divider orientation="vertical" h="18px" />
      <Tooltip label={t("Gold")}>
        <Stack direction="row" alignItems="center" spacing="3">
          <Box w="14px" h="14px" borderRadius="4px" bg={nonCompliant} />

          <Text>{nonCompliantDeviceCount}</Text>
        </Stack>
      </Tooltip>
    </Stack>
  );
}

export default function ReportSoftwareComplianceScreen() {
  const { t } = useTranslation();

  const toast = useToast();
  const pagination = usePagination();
  const form = useForm<FilterForm>({
    defaultValues: {
      domain: null,
    },
  });

  const domain = useWatch({
    control: form.control,
    name: "domain.value",
  });

  const { data, isLoading, refetch } = useQuery(
    [QUERIES.SOFTWARE_COMPLIANCE, pagination.query, domain],
    async () =>
      api.report.getAllGroupSoftwareComplianceStat(
        domain
          ? {
              domain,
            }
          : {}
      ),
    {
      select(res) {
        return search(
          res.filter((item) => item.deviceCount > 0),
          "groupName"
        ).with(pagination.query);
      },
      onError(err: NetshotError) {
        toast.error(err);
      },
      cacheTime: 0,
    }
  );

  const { data: groups, isLoading: isGroupLoading } = useQuery(
    [GLOBAL_QUERIES.DEVICE_GROUPS, pagination.query],
    async () => {
      return api.group.getAll(pagination);
    },
    {
      onError(err: NetshotError) {
        toast.error(err);
      },
      select(res) {
        return createFoldersFromGroups(res);
      },
    }
  );

  const clearFilter = useCallback(() => {
    form.setValue("domain", null);
  }, [form]);

  const getGroupChildren = useCallback(
    (group: Group) => {
      let item = data?.find((stat) => stat.groupId === group.id);

      if (!item) {
        item = {
          groupId: group.id,
          groupName: group.name,
          deviceCount: 0,
          goldDeviceCount: 0,
          silverDeviceCount: 0,
          bronzeDeviceCount: 0,
        };
      }

      return <ReportSoftwareComplianceGroupItem item={item} />;
    },
    [data]
  );

  return (
    <Stack spacing="8" p="9" flex="1" overflow="auto">
      <Heading as="h1" fontSize="4xl">
        {t("Software compliance")}
      </Heading>
      <Stack direction="row" spacing="3">
        <Search
          placeholder={t("Search...")}
          onQuery={pagination.onQuery}
          onClear={pagination.onQueryClear}
          w="30%"
        />
        <Spacer />
        <Menu>
          <MenuButton
            as={Button}
            variant="primary"
            leftIcon={<Icon name="filter" />}
          >
            {t("Filters")}
          </MenuButton>
          <MenuList minWidth="280px">
            <Stack spacing="6" p="3" as="form">
              <DomainSelect control={form.control} name="domain" />
              <Stack spacing="2">
                <Button onClick={clearFilter}>{t("Clear all")}</Button>
              </Stack>
            </Stack>
          </MenuList>
        </Menu>
        <Button onClick={() => refetch()} leftIcon={<Icon name="refreshCcw" />}>
          {t("Refresh")}
        </Button>
      </Stack>
      <Stack flex="1" overflow="auto">
        {isGroupLoading && isLoading ? (
          <Stack spacing="3" pb="6">
            <Skeleton height="36px" />
            <Skeleton height="36px" />
            <Skeleton height="36px" />
            <Skeleton height="36px" />
          </Stack>
        ) : (
          <>
            {groups?.map((group) => (
              <GroupOrFolderItem
                item={group}
                key={isGroup(group) ? group?.id : group?.name}
                renderGroupChildren={getGroupChildren}
              />
            ))}
          </>
        )}
      </Stack>
      {/* <Grid
        templateColumns={{
          base: "repeat(4, 1fr)",
          "2xl": "repeat(6, 1fr)",
        }}
        gap="6"
      >
        {isLoading ? (
          <>
            <Skeleton w="100%" h="320px" borderRadius="3xl"></Skeleton>
            <Skeleton w="100%" h="320px" borderRadius="3xl"></Skeleton>
            <Skeleton w="100%" h="320px" borderRadius="3xl"></Skeleton>
            <Skeleton w="100%" h="320px" borderRadius="3xl"></Skeleton>
            <Skeleton w="100%" h="320px" borderRadius="3xl"></Skeleton>
            <Skeleton w="100%" h="320px" borderRadius="3xl"></Skeleton>
            <Skeleton w="100%" h="320px" borderRadius="3xl"></Skeleton>
            <Skeleton w="100%" h="320px" borderRadius="3xl"></Skeleton>
          </>
        ) : (
          <>
            {data.map((item) => (
              <SoftwareComplianceItem key={item.groupId} item={item} />
            ))}
          </>
        )}
      </Grid> */}
    </Stack>
  );
}
