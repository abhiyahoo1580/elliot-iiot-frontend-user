import { ApexOptions } from 'apexcharts';
// Shared types for pages

export interface Device {
  id: string;
  name?: string;
  deviceName: string;
  deviceType: string;
  machineSerialNo: string;
  companyName: string;
  gatewayId: string;
  installationDate: string;
  location: [number, number] | null;
  status: string;
  showDetails?: boolean;
}

export interface DeviceFormData {
  deviceName: string;
  deviceType: string;
  machineSerialNo: string;
  companyName: string;
  gatewayId: string;
  installationDate: string;
  location: [number, number] | null;
}

export interface User {
  id: number;
  name?: string;
  firstName: string;
  lastName: string;
  email: string;
  contact: string;
  registerDate: string;
  companyName: string;
  device: string;
  status: string;
}

export interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  contact: string;
  registerDate: string;
  companyName: string;
  device: string;
}

export interface Mapping {
  id: number;
  deviceId: number;
  userId: number;
  deviceName: string;
  userName: string;
  mappingDate: string;
}

export interface MappingFormData {
  deviceId: string;
  userId: string;
  mappingDate: string;
}

export type ChartOptions = ApexOptions;