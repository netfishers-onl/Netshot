import { Rule } from "@/types";
import { PropsWithChildren, createContext, useContext } from "react";

export type RuleContextType = {
  rule: Rule;
  isLoading: boolean;
};

export const RuleContext = createContext<RuleContextType>(null);
export const useRule = () => useContext(RuleContext);

export default function RuleProvider(
  props: PropsWithChildren<RuleContextType>
) {
  const { children, rule, isLoading } = props;

  return (
    <RuleContext.Provider value={{ rule, isLoading }}>
      {children}
    </RuleContext.Provider>
  );
}
