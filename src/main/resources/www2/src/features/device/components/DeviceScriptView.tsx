import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import Search from "@/components/Search";
import { QUERIES } from "@/constants";
import { useToast } from "@/hooks";
import { Device, Script, SimpleDevice } from "@/types";
import { sortAlphabetical } from "@/utils";
import { Center, Spinner, Stack } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { CreateDeviceScriptButton } from "./CreateDeviceScriptButton";
import DeviceScriptEditor from "./DeviceScriptEditor";
import DeviceScriptItem from "./DeviceScriptItem";

export type DeviceScriptViewProps = {
  devices: SimpleDevice[] | Device[];
};

export default function DeviceScriptView(props: DeviceScriptViewProps) {
  const { devices } = props;
  const { t } = useTranslation();
  const toast = useToast();
  const [query, setQuery] = useState<string>("");
  const [selected, setSelected] = useState<Script>(null);
  const [pagination, setPagination] = useState({
    limit: 40,
    offset: 0,
  });
  const { data: scripts, isLoading } = useQuery(
    [QUERIES.SCRIPT_LIST, query, pagination.offset],
    async () => api.script.getAll(pagination),
    {
      select(data) {
        return sortAlphabetical(data, "name").filter((item) =>
          item.name?.startsWith(query)
        );
      },
      onError(err: NetshotError) {
        toast.error(err);
      },
      onSuccess(data) {
        if (selected) {
          return;
        }

        setSelected(data?.[0]);
      },
    }
  );

  const onQuery = useCallback((value: string) => {
    setQuery(value);
  }, []);

  const onQueryClear = useCallback(() => {
    setQuery("");
  }, []);

  return (
    <Stack direction="row" spacing="7" overflow="auto" flex="1">
      <Stack w="340px" overflow="auto">
        <Stack direction="row">
          <Search
            onQuery={onQuery}
            onClear={onQueryClear}
            placeholder={t("Search...")}
          />
          <CreateDeviceScriptButton
            devices={devices}
            onCreated={(script) => setSelected(script)}
          />
        </Stack>
        <Stack spacing="2" overflow="auto" flex="1">
          {isLoading ? (
            <Center flex="1">
              <Spinner />
            </Center>
          ) : (
            <>
              {scripts?.map((script) => (
                <DeviceScriptItem
                  key={script?.id}
                  script={script}
                  onClick={() => setSelected(script)}
                  isSelected={script?.name === selected?.name}
                />
              ))}
            </>
          )}
        </Stack>
      </Stack>

      {selected && (
        <DeviceScriptEditor
          key={selected?.id}
          devices={devices}
          scriptId={selected?.id}
        />
      )}
    </Stack>
  );
}
