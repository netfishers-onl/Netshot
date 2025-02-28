import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { Protected } from "@/components";
import Icon from "@/components/Icon";
import { AddGroupButton, GroupOrFolderItem } from "@/components/group";
import { QUERIES } from "@/constants";
import { usePagination, useToast } from "@/hooks";
import { Group, Level } from "@/types";
import { createFoldersFromGroups, isGroup } from "@/utils";
import {
  Divider,
  Flex,
  Heading,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { useDeviceSidebar } from "../../contexts/DeviceSidebarProvider";

export default function DeviceSidebarGroup() {
  const scrollContainer = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState<number>(0);
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const ctx = useDeviceSidebar();
  const { t } = useTranslation();
  const pagination = usePagination();

  const { data: items, isLoading } = useQuery(
    [QUERIES.DEVICE_GROUPS],
    async () => api.group.getAll(pagination),
    {
      onError(err: NetshotError) {
        toast.error(err);
      },
      select(groups) {
        return createFoldersFromGroups(groups);
      },
    }
  );

  useLayoutEffect(() => {
    if (!scrollContainer?.current) return;

    scrollContainer.current.onscroll = (evt) => {
      const target = evt.target as HTMLDivElement;

      setScroll(target.scrollTop);
    };
  }, [scrollContainer]);

  const onGroupSelect = useCallback(
    (group: Group) => {
      if (ctx.group?.id === group.id) {
        navigate(
          {
            pathname: location.pathname,
            search: null,
          },
          {
            replace: true,
          }
        );

        ctx.setGroup(null);
        return;
      }

      navigate(
        {
          pathname: location.pathname,
          search: `?group=${group.id}`,
        },
        { replace: true }
      );

      ctx.setGroup(group);
    },
    [location, navigate]
  );

  return (
    <Stack spacing="0">
      <Flex
        justifyContent="space-between"
        alignItems="center"
        px="6"
        pt="3"
        pb="1"
      >
        <Heading fontSize="md" fontWeight="medium">
          {t("Groups")}
        </Heading>
        <Protected
          roles={[Level.Admin, Level.Operator, Level.ReadWriteCommandOnDevice]}
        >
          <AddGroupButton
            renderItem={(open) => (
              <Tooltip label={t("Add group")}>
                <IconButton
                  variant="ghost"
                  icon={<Icon name="plus" />}
                  onClick={open}
                  aria-label={t("Add group")}
                />
              </Tooltip>
            )}
          />
        </Protected>
      </Flex>
      {scroll > 0 && <Divider />}
      <Stack
        px="6"
        spacing="0"
        overflow="auto"
        height="200px"
        ref={scrollContainer}
      >
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
    </Stack>
  );
}
