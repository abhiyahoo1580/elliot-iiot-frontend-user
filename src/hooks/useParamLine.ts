import { useState, useEffect } from "react";
import axios from "axios";
import { ENDPOINTS } from "../api/endpoints";

// Grouped graph response types for Historical charts (one chart per group)
export type GraphPoint = { x: number; y: number };
export type GraphSeries = {
  name: string;
  registerAddress?: string | number;
  data: GraphPoint[];
};
export type GraphGroup = {
  id: string;
  series: GraphSeries[];
};

export function useParamLine(
  assetId: string,
  fDate: string,
  tDate: string,
  date: string
) {
  const [data, setData] = useState<GraphGroup[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string>("");
  useEffect(() => {
    const ci: string = localStorage.getItem("companyId") ?? "";
    setCompanyId(ci);
  }, []);
  useEffect(() => {
    if (!assetId || !fDate || !tDate || !date) return;
    setLoading(true);
    setError(null);

    const url = `${ENDPOINTS.BASE_URL}${ENDPOINTS.GET_GRAPH}companyId=${companyId}&assetId=${assetId}&fDate=${fDate}&tDate=${tDate}&view=graph&date=${date}`;

    axios
      .get(url, {
        withCredentials: true,
      })
      .then((res) => {
        const raw = res?.data?.data;
        // Expected backend shape: [{ _id, data: [{ data: [[ts,val]...], name, registerAddress }] }]
        const transformed: GraphGroup[] = Array.isArray(raw)
          ? raw.map((group: any) => {
              const entries = Array.isArray(group?.data) ? group.data : [];
              const series: GraphSeries[] = entries
                .map((s: any) => {
                  const pairs: any[] = Array.isArray(s?.data) ? s.data : [];
                  const dataPoints: GraphPoint[] = [];
                  for (const p of pairs) {
                    if (Array.isArray(p) && p.length >= 2) {
                      const x = Number(p[0]);
                      const y = Number(p[1]);
                      if (Number.isFinite(x) && Number.isFinite(y)) {
                        dataPoints.push({ x, y });
                      }
                    }
                  }
                  const name: string =
                    typeof s?.name === "string" ? s.name : "Series";
                  const registerAddress = (s as any)?.registerAddress;
                  if (dataPoints.length === 0) return null;
                  return {
                    name,
                    registerAddress,
                    data: dataPoints,
                  } as GraphSeries;
                })
                .filter(Boolean);
              return { id: String(group?._id ?? ""), series } as GraphGroup;
            })
          : [];
        setData(transformed);
      })
      .catch((err) =>
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to fetch line chart data"
        )
      )
      .finally(() => setLoading(false));
    }, [companyId, assetId, fDate, tDate, date]);

  return { data, loading, error };
}
