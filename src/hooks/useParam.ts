import { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { ENDPOINTS } from "../api/endpoints";

type Parameter = {
  // Replace these fields with the actual structure of your parameter objects
  id: string;
  name: string;
  value: string;
  // Add more fields as needed
};

export function useParam(companyId: string | undefined, deviceTypeId: string | undefined) {
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId || !deviceTypeId) {
      setParameters([]);
      return;
    }
    setLoading(true);
    setError(null);
    const url = ENDPOINTS.GET_PARAMETERS(companyId, deviceTypeId);
    axiosInstance.get(url)
      .then(res => setParameters(res.data.data || []))
      .catch(err => setError(err?.response?.data?.msg || err.message || "Error fetching parameters"))
      .finally(() => setLoading(false));
  }, [companyId, deviceTypeId]);

  return { parameters, loading, error };
}