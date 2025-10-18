import { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { ENDPOINTS } from "../api/endpoints";
import { Asset } from "../types/user.types";

export function useUserAsset(userId: string | undefined) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    // console.log("useUserAsset API call:", {
    //   userId,
    //   url: `${ENDPOINTS.GET_USER_ASSETS}${userId}`
    // });

    axiosInstance
      .get(`${ENDPOINTS.GET_USER_ASSETS}${userId}`)
      .then((res) => {
        // console.log("useUserAsset API response:", res.data);
        const users = res.data?.data || [];
        const allAssets: Asset[] = [];
        type UserWithAssets = {
          assetDetails?: Asset[];
        };

        users.forEach((user: UserWithAssets) => {
          (user.assetDetails || []).forEach((asset: Asset) => {
            allAssets.push({
              _id: asset._id,
              AssetName: asset.AssetName,
              AssetType: asset.AssetType,
              AssetTypeId: asset.AssetTypeId,
              AssetId: asset.AssetId,
              ManufacturingId: asset.ManufacturingId,
              status: asset.status,
              Gateway: asset.Gateway,
              SlaveId: asset.SlaveId,
              InstallationDate: asset.InstallationDate,
              location: asset.location || "",
              companyName: "",
              timeZone: asset.timeZone,
              assetTypeDetails: asset.assetTypeDetails,
            });
          });
        });
        // console.log("Processed assets:", allAssets);
        setAssets(allAssets);
      })
      .catch((err) => {
        // console.error("useUserAsset API error:", err);
        setError(err.message || "Failed to fetch assets");
      })
      .finally(() => setLoading(false));
  }, [userId]);

  return { assets, loading, error };
}