import { Rule } from "@/types";
import { PropsWithChildren, createContext, use } from "react";

export type RuleContextType = {
  rule: Rule;
  isLoading: boolean;
};

export const RuleContext = createContext<RuleContextType>(null);
export const useRule = () => use(RuleContext);

export default function RuleProvider(
  props: PropsWithChildren<RuleContextType>
) {
  const { children, rule, isLoading } = props;

  return (
    <RuleContext value={{ rule, isLoading }}>
      {children}
    </RuleContext>
  );
}
