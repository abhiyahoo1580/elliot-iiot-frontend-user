import { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { ENDPOINTS } from "../api/endpoints";

export interface AssetType {
  _id: string;
  companyId: number;
  assetTypeId: number;
  AssetTypeName: string;
}

export function useAssetTypes(companyId: string | number | null) {
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    axiosInstance
      .get(ENDPOINTS.GET_ASSET_TYPE_LIST(companyId))
      .then(res => {
        setAssetTypes(Array.isArray(res.data?.data) ? res.data.data : []);
      })
      .catch(err => setError(err?.message || "Failed to fetch asset types"))
      .finally(() => setLoading(false));
  }, [companyId]);

  return { assetTypes, loading, error };
}