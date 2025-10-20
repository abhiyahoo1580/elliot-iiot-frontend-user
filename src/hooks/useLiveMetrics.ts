import { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { ENDPOINTS } from "../api/endpoints";

type ParamData = {
  _id: string;
  ActValue: number;
  valueReceivedDate: number;
  Name: string;
  ColorCode: string;
  parameterId: number;
  Maxlimit: string;
  RegisterAddress: number;
  PostFix: string;
};

type ApiResponse = {
  msg: string;
  data: ParamData[];
};

export function useLiveMetrics(
  assetId: string,
  date: number,
  companyId?: string | number
) {
  const [data, setData] = useState<ParamData[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId || !assetId || !date) return;

    setLoading(true);
    setError(null);

    const url = `${ENDPOINTS.BASE_URL}${ENDPOINTS.GET_PARAM_DATA}companyId=${companyId}&assetId=${assetId}&date=${date}&view=realtime`;

    // console.log("useLiveMetrics API call:", {
    //   url,
    //   companyId,
    //   assetId,
    //   date
    // });

    axiosInstance
      .get<ApiResponse>(url)

      .then((res) => {
        // console.log("useLiveMetrics API response:", res.data);
        setData(res.data.data);
      })
      .catch((err) => {
        console.error("useLiveMetrics API error:", err);
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to fetch live metrics"
        );
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [companyId, assetId, date]);

  return { data, loading, error };
}
