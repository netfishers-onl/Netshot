import {
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

export type ConfigurationComplianceFilters = {
  groups: number[];
  domains: number[];
  policies: number[];
};

export type ConfigurationComplianceContextType = {
  query: string;
  setQuery: Dispatch<SetStateAction<string>>;
  filters: ConfigurationComplianceFilters;
  setFilters: Dispatch<SetStateAction<ConfigurationComplianceFilters>>;
};

export const ConfigurationCompliantContext =
  createContext<ConfigurationComplianceContextType>(null);
export const useConfigurationCompliance = () =>
  useContext(ConfigurationCompliantContext);

export type ConfigurationComplianceProviderProps = PropsWithChildren<{}>;

export default function ConfigurationComplianceProvider(
  props: ConfigurationComplianceProviderProps
) {
  const { children } = props;

  const [filters, setFilters] = useState<ConfigurationComplianceFilters>({
    groups: [],
    domains: [],
    policies: [],
  });
  const [query, setQuery] = useState<string>("");

  const ctx = useMemo(
    () => ({
      filters,
      setFilters,
      query,
      setQuery,
    }),
    [filters, query]
  );

  return (
    <ConfigurationCompliantContext.Provider value={ctx}>
      {children}
    </ConfigurationCompliantContext.Provider>
  );
}
