import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { loginStaff } from "@/api/auth";
import { tokenStore } from "@/api/client";
import type { StaffUser } from "@/api/types";

interface AuthContextValue {
  user: StaffUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StaffUser | null>(() => tokenStore.user);

  const login = useCallback(async (email: string, password: string) => {
    const data = await loginStaff(email, password);
    if (data.user?.role !== "SuperAdmin") {
      throw new Error(
        "This console is restricted to operations admins (SuperAdmin role).",
      );
    }
    tokenStore.set(data.accessToken, data.refreshToken, data.user);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticated: !!user, login, logout }),
    [user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
