import { useState, useCallback } from "react";
import axiosInstance from "../api/axiosInstance";
import { ENDPOINTS } from "../api/endpoints";

// Define the Profile type according to your API response structure

export function useProfileInfo() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      // If your endpoint is /OEM/user/get/user/:id
      const url = ENDPOINTS.GET_PROFILE.replace(':id', userId);
      const res = await axiosInstance.get(url);
      setProfile(res.data?.data || null); // <-- THIS LINE IS IMPORTANT
    } catch (err: any) {
      setError(err?.response?.data?.msg || "Failed to fetch profile");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return { profile, loading, error, fetchProfile };
}