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
  [key: string]: unknown;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
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
  const [token, setToken] = useState<string | null>(null);

  // Restore user after reload if userId exists
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      // Token is in cookie, no need to set Authorization header
      axiosInstance
        .get(`${ENDPOINTS.GET_FULL_USER}${userId}`)
        .then((res) => {
          const fullUser = res.data?.data;
          if (!fullUser || (!fullUser.userId && !fullUser._id)) {
            setUser(null);
            localStorage.removeItem("userId");
            return;
          }
          if (fullUser.company_id) {
            localStorage.setItem("companyId", String(fullUser.company_id));
          }
          setUser({
            ...fullUser,
            userId: fullUser.userId || fullUser._id,
          });
        })
        .catch(() => {
          setUser(null);
          localStorage.removeItem("userId");
        });
    }
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
        
        // Token is now in httpOnly cookie - no need to store in localStorage
        // Just store userId for session restoration
        localStorage.setItem("userId", userObj._id);

        // Fetch full user info immediately after login
        const fullUserRes = await axiosInstance.get(
          `${ENDPOINTS.GET_FULL_USER}${userObj._id}`
        );
        const fullUser = fullUserRes.data?.data;
        if (!fullUser || !(fullUser.userId || fullUser._id)) {
          setUser(null);
          localStorage.removeItem("userId");
          throw new Error("Failed to fetch full user info");
        }
        if (fullUser.company_id) {
          localStorage.setItem("companyId", String(fullUser.company_id));
        }
        setUser({
          ...fullUser,
          userId: fullUser.userId || fullUser._id,
        });
        return {
          ...fullUser,
          userId: fullUser.userId || fullUser._id,
        };
      } catch (err) {
        console.error("Login or fetch full user failed:", err);
        setUser(null);
        localStorage.removeItem("userId");
        throw err;
      }
    },
    []
  );

  const logout = async () => {
    try {
      // Call backend logout endpoint to clear cookie
      await axiosInstance.post(ENDPOINTS.LOGOUT);
      
      setUser(null);
      setToken(null);
      localStorage.clear();
      return Promise.resolve();
    } catch (error) {
      console.error("Logout error:", error);
      // Even if logout fails, clear local state
      setUser(null);
      setToken(null);
      localStorage.clear();
      return Promise.reject(error);
    }
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
