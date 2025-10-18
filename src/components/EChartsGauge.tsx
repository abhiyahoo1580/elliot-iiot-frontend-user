import React, { useEffect, useRef } from "react";
import * as echarts from "echarts";

const formatNumber = (num: number): string => {
  const rounded = Math.round(num);
  if (rounded < 1000) {
    return rounded.toString();
  }
  const suffixes = ["K", "M", "B", "T"];
  let i = 0;
  let value = rounded;
  while (value >= 1000 && i < suffixes.length) {
    value /= 1000;
    i++;
  }
  const formatted = value.toFixed(1);
  const clean = formatted.endsWith(".0") ? formatted.slice(0, -2) : formatted;
  return clean + suffixes[i - 1];
};

interface EChartsGaugeProps {
  value: number | null;
  min: number;
  max: number;
  unit: string;
  deviceName: string;
  hasData: boolean;
  isHighBreach: boolean;
  isLowBreach: boolean;
  highThreshold?: number;
  lowThreshold?: number;
}

const EChartsGauge: React.FC<EChartsGaugeProps> = ({
  value,
  min,
  max,
  unit,
  deviceName,
  hasData,
  isHighBreach,
  isLowBreach,
  highThreshold,
  lowThreshold,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Initialize chart
    if (!chartInstance.current) {
      try {
        chartInstance.current = echarts.init(chartRef.current);
      } catch (error) {
        console.error("Error initializing chart:", error);
        return;
      }
    }

    // Color segments based on MinAlert (lowThreshold) and MaxAlert (highThreshold)
    const getColorSegments = () => {
      // Both MinAlert and MaxAlert
      if (lowThreshold !== undefined && highThreshold !== undefined) {
        const minPercent = (lowThreshold - min) / (max - min);
        const maxPercent = (highThreshold - min) / (max - min);
        return [
          [minPercent, "#FF0000"], // Red up to MinAlert
          [maxPercent, "#10b981"], // Green between MinAlert and MaxAlert
          [1, "#FF0000"], // Red after MaxAlert
        ];
      }
      // Only MaxAlert
      if (highThreshold !== undefined) {
        const maxPercent = (highThreshold - min) / (max - min);
        return [
          [maxPercent, "#10b981"], // Green up to MaxAlert
          [1, "#FF0000"], // Red after MaxAlert
        ];
      }
      // Only MinAlert
      if (lowThreshold !== undefined) {
        const minPercent = (lowThreshold - min) / (max - min);
        return [
          [minPercent, "#FF0000"], // Red up to MinAlert
          [1, "#10b981"], // Green after MinAlert
        ];
      }
      // No alerts
      return [[1, "#10b981"]];
    };

    // Clean status colors
    const getStatusColor = () => {
      if (!hasData) return "#6b7280";
      if (isHighBreach) return "#dc2626";
      if (isLowBreach) return "#2563eb";
      return "#10b981";
    };

    const option = {
      series: [
        {
          type: "gauge",
          min: min,
          max: max,
          splitNumber: 6, // Show 7 segments (8 tick labels)
          radius: "85%",
          center: ["50%", "60%"],
          startAngle: 200,
          endAngle: -20,
          axisLine: {
            lineStyle: {
              width: 12,
              color: getColorSegments(),
            },
          },
          pointer: {
            show: hasData,
            length: "70%",
            width: 4,
            itemStyle: {
              color: "#1f2937",
            },
          },
          axisTick: {
            distance: -8,
            length: 6,
            lineStyle: {
              color: "#d1d5db",
              width: 1,
            },
          },
          splitLine: {
            distance: -12,
            length: 8,
            lineStyle: {
              color: "#e5e7eb",
              width: 1,
            },
          },
          axisLabel: {
            show: true,
            distance: 25, // Move labels further inside the arc
            fontSize: 11,
            color: "#6b7280",
            fontWeight: "500",
            rotate: "tangential", // Make labels follow the arc
            formatter: (val: number) => formatNumber(val),
          },
          detail: {
            show: true,
            offsetCenter: [0, "60%"],
            valueAnimation: hasData,
            formatter: hasData ? `{value} ${unit}` : `-- ${unit}`,
            color: getStatusColor(),
            fontSize: 18,
            fontWeight: "600",
          },
          data: [
            {
              value: hasData && value !== null ? value : 0,
            },
          ],
        },
      ],
    };

    chartInstance.current.setOption(option);

    // Handle resize
    const handleResize = () => {
      try {
        chartInstance.current?.resize();
      } catch (error) {
        console.error("Error resizing chart:", error);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [
    value,
    min,
    max,
    unit,
    deviceName,
    hasData,
    isHighBreach,
    isLowBreach,
    highThreshold,
    lowThreshold,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try {
        if (chartInstance.current) {
          chartInstance.current.dispose();
          chartInstance.current = null;
        }
      } catch (error) {
        console.error("Error disposing chart:", error);
      }
    };
  }, []);

  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: "80%",
        height: "170px",
        paddingTop: "0px",
        paddingBottom: "0px",
        marginTop: "0px",
      }}
    >
      <div
        ref={chartRef}
        className="w-full h-full"
        style={{
          minHeight: "210px",
          minWidth: "300px",
          width: "100%",
          height: "100%",
          paddingBottom: 0,
          marginBottom: 0,
          paddingLeft: "10px",
          paddingRight: "10px",
        }}
      />
    </div>
  );
};

export default EChartsGauge;
