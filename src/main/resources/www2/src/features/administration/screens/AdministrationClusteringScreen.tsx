import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { EmptyResult, ExpandablePanel, Icon, Search } from "@/components";
import { usePagination, useToast } from "@/hooks";
import { formatDate, search } from "@/utils";
import {
  Button,
  Divider,
  Heading,
  Skeleton,
  Spacer,
  Stack,
  Tag,
  Text,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceStrict } from "date-fns";
import { useTranslation } from "react-i18next";
import { QUERIES } from "../constants";

export default function AdministrationClusteringScreen() {
  const { t } = useTranslation();
  const pagination = usePagination();
  const toast = useToast();

  const {
    data = [],
    isLoading,
    refetch,
  } = useQuery(
    [QUERIES.ADMIN_CLUSTERS],
    async () => api.admin.getAllClusterMember(),
    {
      select(res) {
        return search(res, "hostname").with(pagination.query);
      },
      onError(err: NetshotError) {
        toast.error(err);
      },
    }
  );

  return (
    <>
      <Stack spacing="6" p="9" flex="1" overflow="auto">
        <Heading as="h1" fontSize="4xl">
          {t("Clustering")}
        </Heading>
        <Stack direction="row" spacing="3">
          <Search
            placeholder={t("Search...")}
            onQuery={pagination.onQuery}
            onClear={pagination.onQueryClear}
            w="30%"
          />
          <Spacer />
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
              <Stack spacing="3">
                {data.map((item) => (
                  <ExpandablePanel key={item.hostname}>
                    <ExpandablePanel.Header>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        flex="1"
                      >
                        <Stack direction="row" spacing="3">
                          <Text fontWeight="semibold" fontSize="lg">
                            {item?.hostname}
                          </Text>
                          <Tag colorScheme="green">{t("Master")}</Tag>
                        </Stack>
                        <Stack direction="row" spacing="3">
                          <Tag colorScheme="grey">
                            {item?.local ? t("local") : t("external")}
                          </Tag>
                          <Tag colorScheme="grey">
                            {t("driver checksum: ")} {item?.driverHash}
                          </Tag>
                        </Stack>
                      </Stack>
                    </ExpandablePanel.Header>
                    <ExpandablePanel.Content>
                      <Stack direction="row" spacing="8">
                        <Stack spacing="0">
                          <Text fontWeight="semibold" fontSize="lg">
                            {item?.appVersion}
                          </Text>
                          <Text color="grey.400">{t("Netshot version")}</Text>
                        </Stack>
                        <Divider orientation="vertical" />
                        <Stack spacing="0">
                          <Text fontWeight="semibold" fontSize="lg">
                            {item?.masterPriority}
                          </Text>
                          <Text color="grey.400">{t("Master priority")}</Text>
                        </Stack>
                        <Divider orientation="vertical" />
                        <Stack spacing="0">
                          <Text fontWeight="semibold" fontSize="lg">
                            {item?.runnerPriority}
                          </Text>
                          <Text color="grey.400">{t("Runner priority")}</Text>
                        </Stack>
                        <Divider orientation="vertical" />
                        <Stack spacing="0">
                          <Text fontWeight="semibold" fontSize="lg">
                            {item?.runnerWeight}
                          </Text>
                          <Text color="grey.400">{t("Runner weight")}</Text>
                        </Stack>
                        <Divider orientation="vertical" />
                        <Stack spacing="0">
                          <Text fontWeight="semibold" fontSize="lg">
                            {formatDate(item?.lastSeenTime)}
                          </Text>
                          <Text color="grey.400">{t("Last seen")}</Text>
                        </Stack>
                        <Divider orientation="vertical" />
                        <Stack spacing="0">
                          <Text fontWeight="semibold" fontSize="lg">
                            {formatDistanceStrict(
                              new Date(),
                              new Date(item?.lastStatusChangeTime)
                            )}{" "}
                            {t("ago")}
                          </Text>
                          <Text color="grey.400">
                            {t("Last status change")}
                          </Text>
                        </Stack>
                      </Stack>
                    </ExpandablePanel.Content>
                  </ExpandablePanel>
                ))}
              </Stack>
            ) : (
              <EmptyResult
                title={t("There is no member")}
                description={t(
                  "You can activate cluster mode by modifying the netshot configuration"
                )}
              />
            )}
          </>
        )}
      </Stack>
    </>
  );
}
