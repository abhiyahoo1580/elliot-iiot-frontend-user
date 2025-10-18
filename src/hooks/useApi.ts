import { useState, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';

type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch';

export const useApi = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (method: HttpMethod, url: string, data: unknown = null): Promise<unknown> => {
      try {
        setLoading(true);
        setError(null);
        let response;
        if (method === 'get' || method === 'delete') {
          response = await axiosInstance[method](url, { params: data as object });
        } else {
          response = await axiosInstance[method](url, data);
        }
        return response.data;
      } catch (err: unknown) {
        type AxiosError = {
          response?: {
            data?: string;
          };
        };
        if (typeof err === 'object' && err !== null && 'response' in err && typeof (err as AxiosError).response === 'object') {
          setError((err as AxiosError).response?.data || 'An error occurred');
        } else {
          setError('An error occurred');
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { loading, error, execute };
};