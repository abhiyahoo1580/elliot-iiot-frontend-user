export interface FullUserResponse {
  msg: string;
  data: FullUser;
}

export interface FullUser {
  _id: string;
  company_id: string;
  registeredOn: string;
  first_name: string;
  last_name: string;
  company_name: string;
  email_id: string;
  address: string;
  Parameter: any[]; // You can type this better if you know the structure
}

export interface Asset {
  _id: string;
  AssetName: string;
  AssetType: string;
  AssetTypeId: number;
  AssetId?: string,
  ManufacturingId: string;
  status: boolean;
  Gateway: string;
  SlaveId?: number;
  InstallationDate: number;
  location?: string;
  companyName?: string;
  timeZone?: string;
  assetTypeDetails?: any[];
}

export interface DeviceList {
  name: string;
  status: string;
  onboardingDate: Date;
  dailyConsumption?: number;
  monthlyAverage?: number;
  deviceType?: string;
}

export interface ParamDataItem {
  _id: string | null | undefined;
  ActValue: string[];
  id: number;
  ValueReceivedDate: string[];
  Name: string[];
  parameterId: number[];
  registerAddress: number[];
  valuesAvg?: string | number;
  valuesMax?: string | number;
  valuesMin?: string | number;
}

export type WeeklyParamDataItem = {
  _id: number;
  data: ParamDataItem[];
};