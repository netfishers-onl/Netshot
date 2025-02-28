import { createContext, ReactNode, useContext } from "react";

export type ApplicationContextType = {};

export const ApplicationContext = createContext<ApplicationContextType>(null);
export const useApplication = () => useContext(ApplicationContext);

export type ApplicationProviderProps = {
  children: ReactNode;
};

/**
 * Context principal de l'application
 */
export function ApplicationProvider({ children }: ApplicationProviderProps) {
  return (
    <ApplicationContext.Provider value={null}>
      {children}
    </ApplicationContext.Provider>
  );
}
