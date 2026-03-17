import { OidcInfo } from "@/api/user";
import { User } from "@/types";
import { createContext, useContext } from "react";

export type AuthContextType = {
  user?: User;
  oidcInfo?: OidcInfo;
  serverError?: boolean;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
});

export const useAuth = () => useContext(AuthContext);
