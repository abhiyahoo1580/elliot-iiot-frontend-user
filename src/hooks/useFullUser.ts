import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import axiosInstance from "../api/axiosInstance";
import { ENDPOINTS } from "../api/endpoints";
import { FullUser } from "../types/user.types";

export function useFullUser(userId: string | undefined) {
  const authContext = useContext(AuthContext);
  const contextUser = authContext ? authContext.user : undefined;
  const [user, setUser] = useState<FullUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (contextUser && contextUser._id === userId) {
      setUser(contextUser as unknown as FullUser);
      setLoading(false);
      return;
    }
    if (!userId) {
      setUser(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    axiosInstance
      .get(`${ENDPOINTS.GET_FULL_USER}${userId}`)
      .then((res) => setUser(res.data.data))
      .catch((err) => setError(err?.response?.data?.msg || err.message || "Error fetching user"))
      .finally(() => setLoading(false));
  }, [userId, contextUser]);

  return { user, loading, error };
}