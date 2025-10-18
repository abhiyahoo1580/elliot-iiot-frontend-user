import { useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { ENDPOINTS } from "../api/endpoints";

interface UpdateProfileData {
  first_name: string;
  last_name: string;
  phone_number: string | number;
  dial_code?: string | number;
}

export function useProfileUpdate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const updateProfile = async (userId: string, data: UpdateProfileData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await axiosInstance.put(
        ENDPOINTS.UPDATE_PROFILE.replace(":id", userId),
        data
      );
      setSuccess(true);
    } catch (err: unknown) {
      // Narrow unknown to extract message in a safe way
      let msg: string | undefined;
      let plain: string | undefined;
      if (typeof err === "object" && err !== null) {
        const e = err as Record<string, unknown>;
        if (e.response && typeof e.response === "object") {
          const r = e.response as Record<string, unknown>;
          if (r.data && typeof r.data === "object") {
            const d = r.data as Record<string, unknown>;
            if (d.msg && typeof d.msg === "string") msg = d.msg;
          }
        }
        if (!msg && e.message && typeof e.message === "string")
          plain = e.message;
      }
      setError(msg || plain || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return { updateProfile, loading, error, success };
}
