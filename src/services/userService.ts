import axiosInstance from '../api/axiosInstance';
import { ENDPOINTS } from '../api/endpoints';

// Define payload types for clarity and type safety
type StringRecord = Record<string, unknown>;

export const userService = {
  // Auth
  async login(data: StringRecord) {
    const response = await axiosInstance.post(ENDPOINTS.LOGIN, data);
    return response.data.data;
  },
  async register(data: StringRecord) {
    const response = await axiosInstance.post(ENDPOINTS.REGISTER, data);
    return response.data;
  },

  // Profile
  async getProfile() {
    const response = await axiosInstance.get(ENDPOINTS.GET_PROFILE);
    return response.data;
  },
  async updateProfile(data: StringRecord) {
    const response = await axiosInstance.put(ENDPOINTS.UPDATE_PROFILE, data);
    return response.data;
  },

  // Devices
  async getDevices() {
    const response = await axiosInstance.get(ENDPOINTS.GET_DEVICES);
    return response.data;
  },
  async getDeviceById(id: string) {
    const response = await axiosInstance.get(ENDPOINTS.GET_DEVICE_BY_ID(id));
    return response.data;
  },
  async createDevice(data: StringRecord) {
    const response = await axiosInstance.post(ENDPOINTS.CREATE_DEVICE, data);
    return response.data;
  },
  async deleteDevice(id: string) {
    const response = await axiosInstance.delete(ENDPOINTS.DELETE_DEVICE(id));
    return response.data;
  },
  async updateDevice(deviceId: string, data: {
    AssetId: string;
    AssetName: string;
    Gateway: string;
    AssetType: string;
    ManufacturingId: string;
    CompanyId: string;
  }) {
    const url = `${ENDPOINTS.BASE_URL}${ENDPOINTS.UPDATE_DEVICE}${deviceId}`;
    const response = await axiosInstance.put(url, data);
    return response.data;
  },

  // Parameters
  async getParameters(companyId: string, deviceTypeId: string) {
    const url = ENDPOINTS.GET_PARAMETERS(companyId, deviceTypeId);
    const response = await axiosInstance.get(url);
    return response.data;
  },
  async updateParameters(id: string, data: StringRecord) {
    const response = await axiosInstance.put(ENDPOINTS.UPDATE_PARAMETERS(id), data);
    return response.data;
  },

  // Real-time data
  async getRealtimeData() {
    const response = await axiosInstance.get(ENDPOINTS.GET_REALTIME_DATA);
    return response.data;
  },

  // User management
  async getUsers() {
    const response = await axiosInstance.get(ENDPOINTS.GET_USERS);
    return response.data;
  },
  async getUserById(id: string) {
    const response = await axiosInstance.get(ENDPOINTS.GET_USER_BY_ID(id));
    return response.data;
  },

  // Device mapping
  async getMappings() {
    const response = await axiosInstance.get(ENDPOINTS.GET_MAPPINGS);
    return response.data;
  },
  async createMapping(data: StringRecord) {
    const response = await axiosInstance.post(ENDPOINTS.CREATE_MAPPING, data);
    return response.data;
  },
  async updateMapping(id: string, data: StringRecord) {
    const response = await axiosInstance.put(ENDPOINTS.UPDATE_MAPPING(id), data);
    return response.data;
  },
  async deleteMapping(id: string) {
    const response = await axiosInstance.delete(ENDPOINTS.DELETE_MAPPING(id));
    return response.data;
  },

  async getCards(userId: string) {
    const url = `${ENDPOINTS.BASE_URL}${ENDPOINTS.GET_CARDS}${userId}`;
    const response = await axiosInstance.get(url);
    return response.data;
  },
  
  // LCD view live data (external endpoint)
  async getLcdData(userId: string, companyId: number, dateMs: number) {
    const url = `${ENDPOINTS.BASE_URL}${ENDPOINTS.GET_LCD_DATA(userId, dateMs, companyId)}`;
    const response = await axiosInstance.get(url);
    return response.data;
  },
  // Support
  async getSupport() {
    const response = await axiosInstance.get(ENDPOINTS.GET_SUPPORT);
    return response.data;
  },
  
  async getParametersByAssetType(assetTypeId:number, userId:string) {
    const response = await axiosInstance.get(ENDPOINTS.GET_PARAMETERS_BY_ASSET_TYPE(assetTypeId,userId));
    return response.data;
  },

  // Password setup via token
  async verifySetupToken(token: string) {
    const response = await axiosInstance.get(`${ENDPOINTS.VERIFY_SETUP_TOKEN}?token=${encodeURIComponent(token)}`);
    return response.data;
  },
  async setPasswordWithToken(payload: { token: string; password: string; confirmPassword: string }) {
    const response = await axiosInstance.post(ENDPOINTS.SET_PASSWORD_WITH_TOKEN, payload);
    return response.data;
  }
};