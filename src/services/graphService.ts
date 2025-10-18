import axiosInstance from '../api/axiosInstance';
import { ENDPOINTS } from '../api/endpoints';

// Define payload types for clarity and type safety
type StringRecord = Record<string, unknown>;

export const graphServices = {


  async getGraphConfig(userId: string) {
    const url = `${ENDPOINTS.BASE_URL}${ENDPOINTS.GET_GRAPH_CONFIG}${userId}`;
    const response = await axiosInstance.get(url);
    return response.data;
  },

  async getParameterName(userId: string) {
    const url = `${ENDPOINTS.BASE_URL}${ENDPOINTS.GET_PARAMETERNAME}${userId}`;
    const response = await axiosInstance.get(url);
    return response.data;
  },

  async getMeterName(userId: string) {
    const url = `${ENDPOINTS.BASE_URL}${ENDPOINTS.GET_METERNAME}${userId}`;
    const response = await axiosInstance.get(url);
    return response.data;
  },

  async addGroup(data: object)  {
    const url = `${ENDPOINTS.BASE_URL}${ENDPOINTS.GET_INSERT_GRAPH_CONFIG}`;
    const response = await axiosInstance.post(url, data);
    return response.data;
  },

  async updateGroup(userId:string, data: object) {
    const url = `${ENDPOINTS.BASE_URL}${ENDPOINTS.GET_UPDATE_GRAPH_CONFIG}${userId}`;
    const response = await axiosInstance.put(url, data);
    return response.data;
  },

  async deleteGroup(groupId: string) {
    const url = `${ENDPOINTS.BASE_URL}${ENDPOINTS.GET_DELETE_GRAPH_CONFIG}${groupId}`;
    const response = await axiosInstance.delete(url);
    return response.data;
  }
  

  
};