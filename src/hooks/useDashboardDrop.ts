import { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { ENDPOINTS } from "../api/endpoints";

interface DashboardDropDevice {
  DeviceTypeId: number;
  Devices: {
    DeviceTypeName: string;
    link: string | null;
  };
  active: number;
  inActive: number;
}

interface DashboardDropResponse {
  msg: string;
  data: DashboardDropDevice[];
}

export function useDashboardDrop(userId: string | undefined) {
  const [data, setData] = useState<DashboardDropDevice[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    axiosInstance
      .get<DashboardDropResponse>(`${ENDPOINTS.BASE_URL}${ENDPOINTS.GET_DASHBOARD_DROPDOWN}${userId}`)
      .then((res) => {
        setData(res.data.data || []);
      })
      .catch((err) => {
        setError(err.message || "Failed to fetch dashboard dropdown data");
      })
      .finally(() => setLoading(false));
  }, [userId]);

  return { data, loading, error };
}

