import { Diagnostic } from "@/types";
import { PropsWithChildren, createContext, useContext } from "react";

export type DiagnosticContextType = {
  diagnostic: Diagnostic;
  isLoading: boolean;
};

export const DiagnosticContext = createContext<DiagnosticContextType>(null);
export const useDiagnostic = () => useContext(DiagnosticContext);

export default function DiagnosticProvider(
  props: PropsWithChildren<DiagnosticContextType>
) {
  const { children, diagnostic, isLoading } = props;

  return (
    <DiagnosticContext.Provider value={{ diagnostic, isLoading }}>
      {children}
    </DiagnosticContext.Provider>
  );
}
