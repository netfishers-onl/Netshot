import { User } from "@/types";
import { createContext, useContext } from "react";

export type AuthContextType = {
  user?: User;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
});
export const useAuth = () => useContext(AuthContext);

