import {
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

export type SidebarContextProps<T extends Record<string, any>> = {
  filters: T;
  setFilters: Dispatch<SetStateAction<T>>;
};

const SidebarContext = createContext<SidebarContextProps<any>>(null);

export function useSidebar<T>() {
  return useContext<SidebarContextProps<T>>(SidebarContext);
}

export function SidebarProvider<T>(props: PropsWithChildren) {
  const { children } = props;
  const [filters, setFilters] = useState<T>(null);

  const ctx = useMemo(
    () => ({
      filters,
      setFilters,
    }),
    [filters]
  );

  return (
    <SidebarContext.Provider value={ctx}>{children}</SidebarContext.Provider>
  );
}
