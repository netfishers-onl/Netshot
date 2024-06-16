import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { GroupOrFolderItem } from "@/components";
import { QUERIES } from "@/constants";
import { usePagination, useToast } from "@/hooks";
import { Group } from "@/types";
import { createFoldersFromGroups, isGroup, search } from "@/utils";
import { Skeleton, Stack } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useConfigurationCompliance } from "../contexts";

export default function ConfigurationCompliantSidebarList() {
  const toast = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const pagination = usePagination();
  const ctx = useConfigurationCompliance();

  const { data: items, isLoading } = useQuery(
    [QUERIES.DEVICE_GROUPS, ctx.query],
    async () => {
      return api.group.getAll(pagination);
    },
    {
      onError(err: NetshotError) {
        toast.error(err);
      },
      select(groups) {
        return createFoldersFromGroups(search(groups, "name").with(ctx.query));
      },
    }
  );

  const onGroupSelect = useCallback(
    (group: Group) => {
      navigate(`./${group.id}`);
    },
    [navigate]
  );

  return (
    <Stack px="6" pt="3" flex="1" overflow="auto">
      {isLoading ? (
        <Stack spacing="3" pb="6">
          <Skeleton height="36px" />
          <Skeleton height="36px" />
          <Skeleton height="36px" />
          <Skeleton height="36px" />
        </Stack>
      ) : (
        <>
          {items?.map((item) => (
            <GroupOrFolderItem
              item={item}
              key={isGroup(item) ? item?.id : item?.name}
              onGroupSelect={onGroupSelect}
            />
          ))}
        </>
      )}
    </Stack>
  );
}
