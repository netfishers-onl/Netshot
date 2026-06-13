import {
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  createContext,
  useContext,
  useState,
} from "react";

export type SidebarContextType = {
  query: string;
  setQuery: Dispatch<SetStateAction<string>>;
};

export const SidebarContext = createContext<SidebarContextType>(null);
export const useSidebar = () => useContext(SidebarContext);

export default function ComplianceSidebarProvider(
  props: PropsWithChildren<{}>
) {
  const { children } = props;
  const [query, setQuery] = useState<string>("");

  return (
    <SidebarContext.Provider
      value={{
        query,
        setQuery,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}
