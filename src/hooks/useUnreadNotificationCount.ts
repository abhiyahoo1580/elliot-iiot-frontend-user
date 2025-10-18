import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../api/config';

interface UnreadCountResponse {
  msg: string;
  data: { Count: number }[];
}

export function useUnreadNotificationCount(userId: string) {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCount = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<UnreadCountResponse>(
        `${API_CONFIG.BASE_URL}/OEM/Alert/count/get/${userId}`,
        { headers: API_CONFIG.HEADERS, timeout: API_CONFIG.TIMEOUT }
      );
      const countValue = response.data.data?.[0]?.Count ?? 0;
      setCount(countValue);
    } catch (err: any) {
      setError((err as Error).message || 'Error fetching notification count');
      setCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return { count, loading, error, refresh: fetchCount };
}
