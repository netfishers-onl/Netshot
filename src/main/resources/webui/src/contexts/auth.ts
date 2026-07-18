import { OidcInfo } from "@/api/user";
import { User } from "@/types";
import { createContext, use } from "react";

export type AuthContextType = {
  user?: User;
  oidcInfo?: OidcInfo;
  serverError?: boolean;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
});

export const useAuth = () => use(AuthContext);
