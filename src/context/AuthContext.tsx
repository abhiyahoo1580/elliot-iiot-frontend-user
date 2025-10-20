import {
  createContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import axiosInstance from "../api/axiosInstance";
import { ENDPOINTS } from "../api/endpoints";

interface User {
  userId: string;
  _id: string;
  companyId?: string | number;
  emailId?: string;
  [key: string]: unknown;
}

interface AuthContextType {
  user: User | null;
  login: (params: { email_id: string; password: string }) => Promise<User>;
  logout: () => void;
}

// Create the AuthContext
export const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

// AuthProvider component to wrap your app
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);

  // Restore user on mount by calling /OEM/user/me API
  useEffect(() => {
    const restoreUser = async () => {
      try {
        const { data } = await axiosInstance.get("/OEM/user/me");
        if (data && data.data && (data.data.userId || data.data.emailId)) {
          setUser({
            userId: data.data.userId,
            _id: data.data.userId,
            companyId: data.data.companyId,
            emailId: data.data.emailId,
            ...data.data,
          });
        } else {
          setUser(null);
          if (
            window.location.pathname !== "/login" &&
            window.location.pathname !== "/"
          ) {
            window.location.href = "/login";
          }
        }
      } catch (err) {
        setUser(null);
        if (
          window.location.pathname !== "/login" &&
          window.location.pathname !== "/"
        ) {
          window.location.href = "/login";
        }
      }
    };
    restoreUser();
  }, []);

  // Login function
  const login = useCallback(
    async ({ email_id, password }: { email_id: string; password: string }) => {
      try {
        const { data } = await axiosInstance.post(ENDPOINTS.LOGIN, {
          email_id,
          password,
        });
        // console.log("Login API response:", { data });

        if (!data || !data.data || !(data.data.userId || data.data._id)) {
          throw new Error("Invalid login response");
        }

        const userObj = {
          _id: data.data.userId || data.data._id,
          userId: data.data.userId || data.data._id,
          ...data.data,
        };

        // Fetch full user info immediately after login
        const fullUserRes = await axiosInstance.get(
          `${ENDPOINTS.GET_FULL_USER}${userObj._id}`
        );
        const fullUser = fullUserRes.data?.data;
        if (!fullUser || !(fullUser.userId || fullUser._id)) {
          setUser(null);
          throw new Error("Failed to fetch full user info");
        }
        setUser({
          ...fullUser,
          userId: fullUser.userId || fullUser._id,
          companyId: fullUser.company_id,
          emailId: fullUser.email_id,
        });
        return {
          ...fullUser,
          userId: fullUser.userId || fullUser._id,
          companyId: fullUser.company_id,
          emailId: fullUser.email_id,
        };
      } catch (err) {
        console.error("Login or fetch full user failed:", err);
        setUser(null);
        throw err;
      }
    },
    []
  );

  const logout = async () => {
    try {
      setUser(null);
      localStorage.clear();
      return Promise.resolve();
    } catch (error) {
      console.error("Logout error:", error);
      return Promise.reject(error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
