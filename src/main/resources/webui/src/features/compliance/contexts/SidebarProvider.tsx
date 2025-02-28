import { Policy } from "@/types";
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
  total: number;
  setTotal: Dispatch<SetStateAction<number>>;
  data: Policy[];
  setData: Dispatch<SetStateAction<Policy[]>>;
};

export const SidebarContext = createContext<SidebarContextType>(null);
export const useSidebar = () => useContext(SidebarContext);

export default function ComplianceSidebarProvider(
  props: PropsWithChildren<{}>
) {
  const { children } = props;
  const [query, setQuery] = useState<string>("");
  const [total, setTotal] = useState<number>(0);
  const [data, setData] = useState<Policy[]>([]);

  return (
    <SidebarContext.Provider
      value={{
        query,
        setQuery,
        total,
        setTotal,
        data,
        setData,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}
