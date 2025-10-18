import { useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { ENDPOINTS } from "../api/endpoints";

export function useUpdateNotifications() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const updateNotifications = async (userId: string, data: { emailNotifications: boolean; smsNotifications: boolean }) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await axiosInstance.put(ENDPOINTS.SAVE_NOTIF.replace(':id', userId), data);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.msg || "Failed to update notifications");
    } finally {
      setLoading(false);
    }
  };

  return { updateNotifications, loading, error, success };
}