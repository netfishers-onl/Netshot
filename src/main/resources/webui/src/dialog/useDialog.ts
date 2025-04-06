import {
  ComponentProps,
  DependencyList,
  FunctionComponent,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";
import { FieldValues } from "react-hook-form";

import Alert, { AlertDialogProps } from "./Alert";
import Confirm, { ConfirmDialogProps } from "./Confirm";
import DialogContext from "./dialogContext";
import Form, { FormDialogProps } from "./Form";
import Loading, { LoadingDialogProps } from "./Loading";
import { BaseDialogProps } from "./types";

type UseDialogReturns<
  P extends BaseDialogProps,
  C extends FunctionComponent<P>
> = {
  open(): void;
  close(): void;
  update(props: BaseDialogProps): void;
  updateProps(props: Partial<ComponentProps<C>>): void;
  loading: {
    start(): void;
    stop(): void;
  };
};

export const Dialog = {
  useConfirm(props: ConfirmDialogProps, deps: DependencyList = []) {
    return useDialog(Confirm, props, deps);
  },

  useForm<F extends FieldValues = FieldValues>(props: FormDialogProps<F>, deps: DependencyList = []) {
    return useDialog(Form<F>, props, deps);
  },

  useLoading(props: LoadingDialogProps, deps: DependencyList = []) {
    return useDialog(Loading, props, deps);
  },

  useAlert(props: AlertDialogProps, deps: DependencyList = []) {
    return useDialog(Alert, props, deps);
  },
};

export function useDialog<
  C extends FunctionComponent<P>,
  P extends BaseDialogProps
>(component: C, props: ComponentProps<C>, deps: DependencyList): UseDialogReturns<P, C> {
  // Unique key for the dialog
  const key = useId();
  const dialogContext = useContext(DialogContext);
  const [isLoading, setLoading] = useState<boolean>(props.isLoading);

  // Dialog opening
  const open = useCallback(() => {
    dialogContext.update(key, { isOpen: true });
  }, [dialogContext, key]);

  // Dialog closure
  const close = useCallback(() => {
    setLoading(false);
    dialogContext.update(key, { isOpen: false });
  }, [dialogContext, key]);

  const dialogProps = useMemo(
    () => ({
      ...props,
      isLoading,
      onCancel() {
        close();
        if (props.onCancel) {
          props.onCancel();
        }
      },
    }),
    [close, isLoading, props]
  );

  // Démarrage du chargement et rendu de la dialog
  function start() {
    setLoading(true);
    dialogContext.update(key, { props: dialogProps });
  }

  // Arrêt du chargement et rendu de la dialog
  function stop() {
    setLoading(false);
    dialogContext.update(key, { props: dialogProps });
  }

  function update(config: Partial<ComponentProps<C>>) {
    dialogContext.update(key, config);
  }

  function updateProps(props: Partial<ComponentProps<C>>) {
    dialogContext.updateProps(key, { ...dialogProps, ...props });
  }

  // Ajoute la dialog dans la liste du context
  useEffect(() => {
    const dialogKey = key;
    dialogContext.add(key, component);
    return () => {
      dialogContext.remove(dialogKey);
    };
  }, [component, dialogContext, key]);

  useEffect(() => {
    dialogContext.update(key, { props: dialogProps });
  }, [dialogContext, key, ...deps]);

  return {
    open,
    close,
    update,
    updateProps,
    loading: {
      start,
      stop,
    },
  };
}
