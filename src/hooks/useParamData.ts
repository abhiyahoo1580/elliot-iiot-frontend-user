import { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import { ENDPOINTS } from "../api/endpoints";
import { ParamDataItem } from "../types/user.types";

export interface ParamDataResponse {
  data: [
    {
      _id: number;
      data: ParamDataItem[];
    }
  ];
}

export function useParamData(
  assetId: string,
  fDate: string,
  tDate: string,
  date: string,
  companyId?: string | number
) {
  const [data, setData] = useState<ParamDataResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!assetId || !fDate || !tDate || !date || !companyId) return;

    setLoading(true);
    setError(null);

    const url = `${ENDPOINTS.BASE_URL}${ENDPOINTS.GET_PARAM_DATA}companyId=${companyId}&assetId=${assetId}&fDate=${fDate}&tDate=${tDate}&view=table&date=${date}`;

    // console.log("useParamData API call:", {
    //   url,
    //   companyId,
    //   assetId,
    //   fDate,
    //   tDate,
    //   date
    // });

    axiosInstance
      .get(url)
      .then((res) => {
        // console.log("useParamData API response:", res.data);
        setData(res.data);
      })
      .catch((err) => {
        // console.error("useParamData API error:", err);
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to fetch parameter data"
        );
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [companyId, assetId, fDate, tDate, date]);
  return { data, loading, error, setData };
}
