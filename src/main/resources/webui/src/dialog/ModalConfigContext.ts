import { createContext, useContext } from "react";
import { PromiseOrVoid } from "./types";

export const ModalConfigContext = createContext<{
  close(): PromiseOrVoid;
}>(null);

export const useModalConfig = () => useContext(ModalConfigContext);
