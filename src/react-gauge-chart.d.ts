declare module 'react-gauge-chart' {
  import * as React from 'react';
  interface GaugeChartProps {
    id?: string;
    nrOfLevels?: number;
    percent?: number;
    colors?: string[];
    arcWidth?: number;
    cornerRadius?: number;
    animationDuration?: number;
    textColor?: string;
    needleColor?: string;
    needleBaseColor?: string;
    formatTextValue?: (value: string) => string;
    [key: string]: any;
  }
  const GaugeChart: React.FC<GaugeChartProps>;
  export default GaugeChart;
}