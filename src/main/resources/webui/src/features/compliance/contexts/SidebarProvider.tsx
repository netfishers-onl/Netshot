import {
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

export type SidebarContextType = {
  query: string;
  setQuery: Dispatch<SetStateAction<string>>;
  expandedPolicyIds: number[];
  isPolicyExpanded(policyId: number): boolean;
  setPolicyExpanded(policyId: number, expanded: boolean): void;
  togglePolicyExpanded(policyId: number): void;
};

export const SidebarContext = createContext<SidebarContextType>(null);
export const useSidebar = () => useContext(SidebarContext);

function getInitiallyExpandedPolicyIds(): number[] {
  const match = window.location.pathname.match(/\/config\/(\d+)/);
  return match ? [+match[1]] : [];
}

export default function ComplianceSidebarProvider(
  props: PropsWithChildren<{}>
) {
  const { children } = props;
  const [query, setQuery] = useState<string>("");
  const [expandedPolicyIds, setExpandedPolicyIds] = useState<number[]>(
    getInitiallyExpandedPolicyIds
  );

  const isPolicyExpanded = useCallback(
    (policyId: number) => expandedPolicyIds.includes(policyId),
    [expandedPolicyIds]
  );

  const setPolicyExpanded = useCallback((policyId: number, expanded: boolean) => {
    setExpandedPolicyIds((prev) => {
      if (expanded) {
        return prev.includes(policyId) ? prev : [...prev, policyId];
      }
      return prev.filter((id) => id !== policyId);
    });
  }, []);

  const togglePolicyExpanded = useCallback((policyId: number) => {
    setExpandedPolicyIds((prev) =>
      prev.includes(policyId) ? prev.filter((id) => id !== policyId) : [...prev, policyId]
    );
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        query,
        setQuery,
        expandedPolicyIds,
        isPolicyExpanded,
        setPolicyExpanded,
        togglePolicyExpanded,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}
