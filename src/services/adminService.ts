import axiosInstance from '../api/axiosInstance';
import { ENDPOINTS } from '../api/endpoints';

// Example adminService, expand as needed for admin-specific endpoints
export const adminService = {
  // Users
  async getUsers() {
    const response = await axiosInstance.get(ENDPOINTS.GET_USERS);
    return response.data;
  },
  async getUserById(id: string) {
    const response = await axiosInstance.get(ENDPOINTS.GET_USER_BY_ID(id));
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

  // Device mapping
  async getMappings() {
    const response = await axiosInstance.get(ENDPOINTS.GET_MAPPINGS);
    return response.data;
  },
  async createMapping(data: unknown) {
    const response = await axiosInstance.post(ENDPOINTS.CREATE_MAPPING, data);
    return response.data;
  },
  async updateMapping(id: string, data: unknown) {
    const response = await axiosInstance.put(ENDPOINTS.UPDATE_MAPPING(id), data);
    return response.data;
  },
  async deleteMapping(id: string) {
    const response = await axiosInstance.delete(ENDPOINTS.DELETE_MAPPING(id));
    return response.data;
  },

  // Parameters
  async getParameters(companyId: string, deviceTypeId: string) {
    const response = await axiosInstance.get(ENDPOINTS.GET_PARAMETERS(companyId, deviceTypeId));
    return response.data;
  },
  async updateParameters(id: string, data: Record<string, unknown>) {
    const response = await axiosInstance.put(ENDPOINTS.UPDATE_PARAMETERS(id), data);
    return response.data;
  },

  // Support
  async getSupport() {
    const response = await axiosInstance.get(ENDPOINTS.GET_SUPPORT);
    return response.data;
  }
};