import {
  ComponentProps,
  FunctionComponent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import Alert, { AlertDialogProps } from "./Alert";
import Confirm, { ConfirmDialogProps } from "./Confirm";
import Form, { FormDialogProps } from "./Form";
import Loading, { LoadingDialogProps } from "./Loading";
import DialogContext from "./dialogContext";
import { BaseDialogProps } from "./types";

let dialogKey = 0;

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

export namespace Dialog {
  export function useConfirm(props: ConfirmDialogProps) {
    return useDialog(Confirm, props);
  }

  export function useForm<F = any>(props: FormDialogProps<F>) {
    return useDialog(Form<F>, props);
  }

  export function useLoading(props: LoadingDialogProps) {
    return useDialog(Loading, props);
  }

  export function useAlert(props: AlertDialogProps) {
    return useDialog(Alert, props);
  }
}

export function useDialog<
  C extends FunctionComponent<P>,
  P extends BaseDialogProps
>(component: C, props: ComponentProps<C>): UseDialogReturns<P, C> {
  // Création de la clé unique
  const key = useRef(`@chakra-dialog-${dialogKey++}`);
  const dialogContext = useContext(DialogContext);

  // Surchage des props avec la méthode "close" pour que la dialog se ferme et invoque la méthode "onCancel" fournie
  const dialogProps = useMemo(
    () => ({
      ...props,
      onCancel() {
        close();

        if (props.onCancel) {
          props.onCancel();
        }
      },
    }),
    [props]
  );

  // Ouverture de la dialog
  const open = useCallback(() => {
    dialogContext.update(key.current, { isOpen: true });
  }, [dialogContext, key]);

  // Fermeture de la dialog
  function close() {
    // Si un chargement est en cours on l'arrête
    if (props.isLoading) {
      props.isLoading = false;
    }

    dialogContext.update(key.current, { isOpen: false });
  }

  // Démarrage du chargement et rendu de la dialog
  function start() {
    props.isLoading = true;
    dialogContext.update(key.current, { props: dialogProps });
  }

  // Arrêt du chargement et rendu de la dialog
  function stop() {
    props.isLoading = false;
    dialogContext.update(key.current, { props: dialogProps });
  }

  function update(config: Partial<ComponentProps<C>>) {
    dialogContext.update(key.current, config);
  }

  function updateProps(props: Partial<ComponentProps<C>>) {
    dialogContext.updateProps(key.current, { ...dialogProps, ...props });
  }

  // Ajoute la dialog dans la liste du context
  useEffect(() => {
    dialogContext.add(key.current, component, dialogProps);
  }, []);

  // Lance un nouveau rendu de la dialog pour afficher l'état de chargement
  useEffect(() => {
    dialogContext.update(key.current, { props: dialogProps });
  }, [props.isLoading]);

  return {
    open,
    close,
    update,
    updateProps,

    // Contrôleurs pour l'état de chargement
    loading: {
      start,
      stop,
    },
  };
}
