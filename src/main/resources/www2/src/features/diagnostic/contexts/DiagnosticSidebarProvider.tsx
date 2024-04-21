import { Diagnostic } from "@/types";
import {
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  createContext,
  useContext,
  useState,
} from "react";

export type DiagnosticSidebarContextType = {
  query: string;
  setQuery: Dispatch<SetStateAction<string>>;
  total: number;
  setTotal: Dispatch<SetStateAction<number>>;
  data: Diagnostic[];
  setData: Dispatch<SetStateAction<Diagnostic[]>>;
};

export const DiagnosticSidebarContext =
  createContext<DiagnosticSidebarContextType>(null);
export const useDiagnosticSidebar = () => useContext(DiagnosticSidebarContext);

export default function DiagnosticSidebarProvider(
  props: PropsWithChildren<{}>
) {
  const { children } = props;
  const [query, setQuery] = useState<string>("");
  const [total, setTotal] = useState<number>(0);
  const [data, setData] = useState<Diagnostic[]>([]);

  return (
    <DiagnosticSidebarContext.Provider
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
    </DiagnosticSidebarContext.Provider>
  );
}
