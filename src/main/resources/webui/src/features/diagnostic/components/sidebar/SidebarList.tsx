import api, { PaginationQueryParams } from "@/api";
import { NetshotError } from "@/api/httpClient";
import useToast from "@/hooks/useToast";
import { Center, Spinner, Stack, Text } from "@chakra-ui/react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useInView } from "react-intersection-observer";
import { QUERIES } from "../../constants";
import { useDiagnosticSidebar } from "../../contexts/DiagnosticSidebarProvider";
import SidebarBox from "./SidebarBox";

/**
 * @todo: Sort diagnostic by alphabetical order A-Z (backend)
 */
export default function SidebarList() {
  const { ref, inView } = useInView();
  const LIMIT = 40;
  const toast = useToast();
  const { t } = useTranslation();
  const ctx = useDiagnosticSidebar();

  const {
    data,
    isPending,
    isSuccess,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: [QUERIES.DIAGNOSTIC_LIST],
    queryFn: async ({ pageParam }) => {
      const params = {
        limit: LIMIT,
        offset: pageParam,
      } as PaginationQueryParams;

      return api.diagnostic.getAll(params);
    },
    initialPageParam: 0,
    getNextPageParam(lastPage, allPages) {
      return lastPage?.length === LIMIT ? allPages.length + 1 : undefined;
    },
  });

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage]);

  if (isPending) {
    return (
      <Stack alignItems="center" justifyContent="center" py="6" flex="1">
        <Spinner />
      </Stack>
    );
  }

  if (data?.pages?.[0]?.length === 0) {
    return (
      <Center flex="1">
        <Text>{t("No diagnostic found")}</Text>
      </Center>
    );
  }

  return (
    <Stack p="6" spacing="1" overflow="auto" flex="1">
      {isSuccess &&
        data?.pages?.map((page) =>
          page.map((diagnostic, i) => {
            if (page.length === i + 1) {
              return (
                <SidebarBox
                  ref={ref}
                  diagnostic={diagnostic}
                  key={diagnostic?.id}
                />
              );
            }

            return <SidebarBox diagnostic={diagnostic} key={diagnostic?.id} />;
          })
        )}
      {isFetchingNextPage && (
        <Stack alignItems="center" justifyContent="center" py="6">
          <Spinner />
        </Stack>
      )}
    </Stack>
  );
}
