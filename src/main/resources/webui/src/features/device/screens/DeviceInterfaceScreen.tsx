import { List, Skeleton, Stack, Tag, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router"

import api from "@/api"
import { DataTable, EmptyResult } from "@/components"
import Search from "@/components/Search"
import { usePagination } from "@/hooks"
import { DeviceInterface } from "@/types"
import { merge, search } from "@/utils"

import { QUERIES } from "../constants"

const columnHelper = createColumnHelper<DeviceInterface>()

/**
 * @todo: Add pagination (paginator)
 */
export default function DeviceInterfaceScreen() {
  const params = useParams<{ id: string }>()
  const { t } = useTranslation()
  const pagination = usePagination()

  const { data = [], isPending } = useQuery({
    queryKey: [
      QUERIES.DEVICE_INTERFACES,
      params.id,
      pagination.query,
      pagination.offset,
      pagination.limit,
    ],
    queryFn: async () => api.device.getAllInterfacesById(+params.id, pagination),
    select: useCallback(
      (res: DeviceInterface[]): DeviceInterface[] => {
        // Search on IP addresses
        const passA = res.filter((item) => {
          return item.ip4Addresses.some((address) => {
            return (
              address.ip.toLocaleLowerCase().startsWith(pagination.query) ||
              address.ip.toLocaleLowerCase().includes(pagination.query)
            )
          })
        })

        // Search on other props
        const passB = search(res, "description", "interfaceName", "macAddress", "vrfInstance").with(
          pagination.query
        )

        // Merge two results in one
        return merge(passA, passB, "id")
      },
      [pagination.query]
    ),
  })

  const columns = useMemo(
    () =>
      [
        data.find((i) => !!i.virtualDevice) &&
          columnHelper.accessor("virtualDevice", {
            cell: (info) => <Text>{info.getValue()}</Text>,
            header: t("virtualDevice"),
            enableSorting: true,
          }),
        columnHelper.accessor("interfaceName", {
          cell: (info) => <Text>{info.getValue()}</Text>,
          header: t("name"),
          enableSorting: true,
        }),
        columnHelper.accessor("enabled", {
          cell: (info) =>
            info.getValue() === false ? (
              <Tag.Root colorPalette="red">{t("disabled")}</Tag.Root>
            ) : null,
          header: "",
        }),
        columnHelper.accessor("level3", {
          cell: (info) =>
            info.getValue() === false ? <Tag.Root colorPalette="grey">{t("l2")}</Tag.Root> : null,
          header: "",
        }),
        columnHelper.accessor("description", {
          cell: (info) => <Text>{info.getValue()}</Text>,
          header: t("description"),
          enableSorting: true,
        }),
        columnHelper.accessor("macAddress", {
          cell: (info) => {
            if (info.getValue() && info.getValue() !== "0000.0000.0000") {
              return info.getValue()
            }
            return ""
          },
          header: t("macAddress"),
          enableSorting: true,
        }),
        data.find((i) => !!i.vrfInstance) &&
          columnHelper.accessor("vrfInstance", {
            cell: (info) => <Text>{info.getValue()}</Text>,
            header: t("vrf"),
            enableSorting: true,
          }),
        columnHelper.accessor("ip4Addresses", {
          cell: (info) => {
            const value = info.getValue()
            if (value?.length > 0) {
              return (
                <List.Root as="ul" listStyleType="''" lineHeight="1.5em">
                  {value.map((i) => (
                    <List.Item key={i.ip}>
                      <Text as="span">{i.ip}</Text>
                      <Text as="span" color="gray.400">
                        /{i.prefixLength}
                      </Text>
                    </List.Item>
                  ))}
                </List.Root>
              )
            }
            return ""
          },
          header: t("ipAddress"),
          enableSorting: true,
        }),
      ].filter((c) => !!c),
    [t, data]
  )

  return (
    <Stack gap="6" overflow="auto">
      <Stack direction="row" gap="3">
        <Search
          placeholder={t("searchByVirtualDeviceNameDescriptionMacAddressIp")}
          onQuery={pagination.onQuery}
          w="30%"
        />
      </Stack>
      {isPending ? (
        <Stack gap="3">
          <Skeleton h="60px"></Skeleton>
          <Skeleton h="60px"></Skeleton>
          <Skeleton h="60px"></Skeleton>
          <Skeleton h="60px"></Skeleton>
        </Stack>
      ) : (
        <>
          {data?.length > 0 ? (
            <DataTable columns={columns} data={data} loading={isPending} />
          ) : (
            <EmptyResult
              title={t("thereIsNoInterface")}
              description={t(
                "thisDeviceDoesNotHaveAnyInterfacePleaseCheckItsConfiguration"
              )}
            />
          )}
        </>
      )}
    </Stack>
  )
}
