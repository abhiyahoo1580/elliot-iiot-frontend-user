import { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { ENDPOINTS } from "../api/endpoints";

export type ParameterDetail = {
  _id: number;
  Name: string;
  Description: string;
  Maxlimit: number | string;
  ColorCode?: string | null;
  Colorcode?: string | null;
};

export type ParameterItem = {
  _id: string;
  parameterDetails: ParameterDetail;
  config: boolean;
};

export function useParametersByAssetType(assetTypeId: number | null, userId: string | null) {
  const [parameters, setParameters] = useState<ParameterItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchParameters = () => {
    if (!assetTypeId || !userId) return;
    setLoading(true);
    axiosInstance
      .get(ENDPOINTS.GET_PARAMETERS_BY_ASSET_TYPE(assetTypeId, userId))
      .then(res => {
        setParameters(res.data?.data || []);
      })
      .catch(err => setError(err?.message || "Failed to fetch parameters"))
      .finally(() => setLoading(false));
  };

  useEffect(fetchParameters, [assetTypeId, userId]);

  return { parameters, loading, error, refetch: fetchParameters };
}