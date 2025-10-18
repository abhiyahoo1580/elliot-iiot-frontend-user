import { useEffect, useState } from 'react';
import axios from 'axios';
import { ENDPOINTS } from '../api/endpoints';

interface Activity {
  name: string;
  startTime: string; // timestamp as string
  type: string;
  alert: string;
}

export function useActivity(userId: string) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    axios
      .get(`${ENDPOINTS.BASE_URL}${ENDPOINTS.GET_USER_ACTIVITY(userId)}`)
      .then((res) => {
        const apiData = res.data?.data ?? [];
        const mapped = apiData.map((item: any) => ({
          name: Array.isArray(item.assetName) ? item.assetName[0] : item.assetName || "N/A",
          startTime: item.date ? String(item.date) : "",
          type: item.type || "",
          alert: item.message || "",
        }));
        setActivities(mapped);
        setError(null);
      })
      .catch(() => {
        setError('Failed to fetch activity');
        setActivities([]);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  return { activities, loading, error };
}