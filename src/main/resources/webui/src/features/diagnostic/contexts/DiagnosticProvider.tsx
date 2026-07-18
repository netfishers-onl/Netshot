import { Diagnostic } from "@/types";
import { PropsWithChildren, createContext, use } from "react";

export type DiagnosticContextType = {
  diagnostic: Diagnostic;
  isLoading: boolean;
};

export const DiagnosticContext = createContext<DiagnosticContextType>(null);
export const useDiagnostic = () => use(DiagnosticContext);

export default function DiagnosticProvider(
  props: PropsWithChildren<DiagnosticContextType>
) {
  const { children, diagnostic, isLoading } = props;

  return (
    <DiagnosticContext value={{ diagnostic, isLoading }}>
      {children}
    </DiagnosticContext>
  );
}
