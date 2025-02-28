import { ResponsiveValue, ThemeTypings } from "@chakra-ui/react";
import { FunctionComponent, ReactElement } from "react";

export type PromiseOrVoid = Promise<void> | void;

export type BaseDialogProps<T extends string = any> = {
  title?: string | ReactElement;
  description?: string | ReactElement | (() => ReactElement);
  isLoading?: boolean;
  onCancel?(): PromiseOrVoid;
  isOpen?: boolean;
  size?:
    | "xs"
    | "sm"
    | "md"
    | "lg"
    | "xl"
    | "2xl"
    | "3xl"
    | "4xl"
    | "5xl"
    | "6xl"
    | "full";
  variant?: ResponsiveValue<
    T extends keyof ThemeTypings["components"]
      ? ThemeTypings["components"][T]["variants"]
      : string
  >;
  hideFooter?: boolean;
};

export type DialogConfig<P extends BaseDialogProps> = {
  component: FunctionComponent<P>;
  props: P;
  isOpen: boolean;
};

export type DialogContextProps = {
  add<P extends BaseDialogProps>(
    key: string,
    component: FunctionComponent<P>,
    props: P
  ): void;
  update(key: string, config: Partial<DialogConfig<BaseDialogProps>>): void;
  updateProps<P extends BaseDialogProps>(key: string, props: P): void;
  get(key: string): DialogConfig<BaseDialogProps>;
  configs: Record<string, DialogConfig<BaseDialogProps>>;
};
