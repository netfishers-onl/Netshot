import {
  FunctionComponent,
  PropsWithChildren,
  useCallback,
  useMemo,
  useState,
} from "react";
import DialogContext from "./dialogContext";
import { BaseDialogProps, DialogConfig } from "./types";

/**
 * Provider d'injection de dialog
 * @description Permet d'injecter des dialogs à partir du hook useDialog, cela évite de déclarer les dialogs directement dans le JSX des composants et donc réduire le code
 */
export function DialogProvider(props: PropsWithChildren) {
  // Liste de configuration de dialog
  const [configs, setConfigs] = useState<
    Record<string, DialogConfig<BaseDialogProps>>
  >({});

  // Ajout d'une configuration de dialog dans la liste
  const add = useCallback(
    <P extends BaseDialogProps>(
      key: string,
      component: FunctionComponent<P>,
      props: P
    ) => {
      setConfigs((prev) => ({
        ...prev,
        [key]: {
          component,
          props,
          isOpen: false,
        },
      }));
    },
    []
  );

  // Mise à jour d'une configuration de dialog dans la liste
  const update = useCallback(
    <P extends BaseDialogProps>(
      key: string,
      config: Partial<DialogConfig<P>>
    ) => {
      setConfigs((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          ...config,
        },
      }));
    },
    []
  );

  const updateProps = useCallback(
    <P extends BaseDialogProps>(key: string, props: P) => {
      setConfigs((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          props: {
            ...prev[key].props,
            ...props,
          },
        },
      }));
    },
    []
  );

  // Récupèration d'une config de dialog dans la liste
  const get = useCallback(
    (key: string) => {
      return configs[key];
    },
    [configs]
  );

  // Contexte utilisé par le provider
  const ctx = useMemo(
    () => ({
      add,
      update,
      updateProps,
      get,
      configs,
    }),
    [configs]
  );

  return (
    <DialogContext.Provider value={ctx}>
      {props?.children}

      {Object.keys(configs).map((key) => {
        // Récupération de la configuration et génération du composant de la dialog
        const { component: Component, props, isOpen } = configs[key];

        return <Component key={key} isOpen={isOpen} {...props} />;
      })}
    </DialogContext.Provider>
  );
}
