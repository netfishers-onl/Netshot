import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { ReportDeviceAccessFailureQueryParams } from "@/api/report";
import {
  DataTable,
  DomainSelect,
  EmptyResult,
  FormControl,
  Icon,
  Search,
} from "@/components";
import { FormControlType } from "@/components/FormControl";
import { usePagination, useToast } from "@/hooks";
import { DeviceAccessFailure, Option } from "@/types";
import { formatDate, search } from "@/utils";
import {
  Button,
  Heading,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  Skeleton,
  Spacer,
  Stack,
  Tooltip,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { useCallback, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { QUERIES } from "../constants";

type FilterForm = {
  domain: Option<number>;
  days: number;
};

const columnHelper = createColumnHelper<DeviceAccessFailure>();

export default function ReportDeviceAccessFailure() {
  const { t } = useTranslation();
  const pagination = usePagination();
  const toast = useToast();
  const navigate = useNavigate();
  const form = useForm<FilterForm>({
    defaultValues: {
      domain: null,
      days: 7,
    },
  });

  const domain = useWatch({
    control: form.control,
    name: "domain.value",
  });

  const days = useWatch({
    control: form.control,
    name: "days",
  });

  const {
    data = [],
    isLoading,
    refetch,
  } = useQuery(
    [
      QUERIES.DEVICE_ACCESS_FAILURE,
      pagination.query,
      pagination.offset,
      pagination.limit,
      domain,
      days,
    ],
    async () => {
      const queryParams: ReportDeviceAccessFailureQueryParams = {
        ...pagination,
        days,
      };

      if (domain) {
        queryParams.domain = domain;
      }

      return api.report.getAllDeviceAccessFailure(queryParams);
    },
    {
      select(res) {
        return search(res, "name").with(pagination.query);
      },
      onError(err: NetshotError) {
        toast.error(err);
      },
    }
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        cell: (info) => info.getValue(),
        header: t("Device"),
      }),
      columnHelper.accessor("mgmtAddress.ip", {
        cell: (info) => info.getValue(),
        header: t("Management IP"),
      }),
      columnHelper.accessor("family", {
        cell: (info) => info.getValue(),
        header: t("Family"),
      }),
      columnHelper.accessor("lastSuccess", {
        cell: (info) =>
          info.getValue() ? formatDate(info.getValue()) : t("N/A"),
        header: t("Last successful snapshot"),
      }),
      columnHelper.accessor("lastFailure", {
        cell: (info) =>
          info.getValue() ? formatDate(info.getValue()) : t("N/A"),
        header: t("Last failed snapshot"),
      }),
      columnHelper.accessor("id", {
        cell: (info) => (
          <Tooltip label={t("Go to device")}>
            <IconButton
              variant="ghost"
              colorScheme="green"
              as={Link}
              to={`/app/device/${info.getValue()}`}
              aria-label={t("Go to device")}
              icon={<Icon name="arrowRight" />}
            />
          </Tooltip>
        ),
        header: "",
        enableSorting: false,
        meta: {
          align: "right",
        },
      }),
    ],
    [t]
  );

  const clearFilter = useCallback(() => {
    form.reset();
  }, [form]);

  const navigateToDevice = useCallback(
    (row: DeviceAccessFailure) => {
      navigate(`/app/device/${row.id}`);
    },
    [navigate]
  );

  return (
    <>
      <Stack spacing="6" p="9" flex="1" overflow="auto">
        <Heading as="h1" fontSize="4xl">
          {t("Device access failures")}
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
                <FormControl
                  label={t("Failed snapshot from")}
                  type={FormControlType.Number}
                  control={form.control}
                  name="days"
                />
                <Stack spacing="2">
                  <Button onClick={clearFilter}>{t("Clear all")}</Button>
                </Stack>
              </Stack>
            </MenuList>
          </Menu>
          <Button
            onClick={() => refetch()}
            leftIcon={<Icon name="refreshCcw" />}
          >
            {t("Refresh")}
          </Button>
        </Stack>
        {isLoading ? (
          <Stack spacing="3">
            <Skeleton h="60px"></Skeleton>
            <Skeleton h="60px"></Skeleton>
            <Skeleton h="60px"></Skeleton>
            <Skeleton h="60px"></Skeleton>
          </Stack>
        ) : (
          <>
            {data?.length > 0 ? (
              <DataTable
                zIndex={0}
                columns={columns}
                data={data}
                loading={isLoading}
                onClickRow={navigateToDevice}
              />
            ) : (
              <EmptyResult
                title={t("There is no access failure")}
                description={t(
                  "Here you can view the access failure date for a device"
                )}
              ></EmptyResult>
            )}
          </>
        )}
      </Stack>
    </>
  );
}
