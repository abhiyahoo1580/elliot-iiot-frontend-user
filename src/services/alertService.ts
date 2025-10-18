import axios from 'axios';
import axiosInstance from '../api/axiosInstance';
import { ENDPOINTS } from '../api/endpoints';

// Define payload types for clarity and type safety
type StringRecord = Record<string, unknown>;

// Extended interface for getNotifications parameters to support full server-side filtering
export interface GetNotificationsParams {
  userId: string;
  companyId: string | number;
  page?: number;
  limit?: number;
  sort?: string;
  order?: number;
  search?: string;
  alertType?: string; // e.g., "alert", "warning", "info"
  deviceName?: string; // assetName filter
  parameterName?: string;
  fromDate?: number; // Timestamp
  toDate?: number; // Timestamp
}

export const alertServices = {
  /**
   * Mark a notification as read
   * @param {string | string[]} id - Single or array of Notification IDs
   * @returns {Promise<any>} - API response
   */
  async markAsRead(id: string | string[]) {
    const url = `${ENDPOINTS.BASE_URL}/OEM/Alert/isRead`;
    const ids = Array.isArray(id) ? id : [id];
    const response = await axiosInstance.put(url, { id: ids });
    return response.data;
  },

  /**
   * Fetch paginated notifications/alerts for a user and company with full filtering support
   * @param {Object} params - Query parameters
   * @param {string} params.userId - User ID
   * @param {string|number} params.companyId - Company ID
   * @param {number} [params.page=1] - Page number
   * @param {number} [params.limit=10] - Items per page
   * @param {string} [params.sort="time"] - Sort field (frontend: "time" or "assetName"; map to backend if needed, e.g., "StartTime")
   * @param {number} [params.order=-1] - Sort order (1: asc, -1: desc)
   * @param {string} [params.search] - Search term (for assetName)
   * @param {string} [params.alertType] - Filter by type: "alert" (category 3), "warning" (2), "info" (1)
   * @param {string} [params.deviceName] - Filter by assetName
   * @param {string} [params.parameterName] - Filter by parameterName
   * @param {number} [params.dateFrom] - Start timestamp filter
   * @param {number} [params.dateTo] - End timestamp filter
   * @returns {Promise<{ notifications: NotificationType[], total: number }>} - API response with paginated data and total count
   */
  async getNotifications(params: GetNotificationsParams) {
    const {
      userId,
      companyId,
      page = 1,
      limit = 10,
      sort = "time", // Default to frontend field; backend may expect "StartTime"
      order = -1,
      search,
      alertType,
      deviceName,
      parameterName,
        fromDate,
        toDate,
    } = params;

    // Compose the query string
    let query = `companyId=${companyId}&page=${page}&limit=${limit}&sort=${sort}&order=${order}`;
    
    if (search && search.trim() !== "") {
      query += `&search=${encodeURIComponent(search)}`;
    }
    if (alertType && alertType !== "all") {
      query += `&alertType=${encodeURIComponent(alertType)}`;
    }
    if (deviceName && deviceName !== "all") {
      query += `&deviceName=${encodeURIComponent(deviceName)}`;
    }
    if (parameterName && parameterName !== "all") {
      query += `&parameterName=${encodeURIComponent(parameterName)}`;
    }
      if (fromDate !== undefined) {
        query += `&fromDate=${fromDate}`;
    }
      if (toDate !== undefined) {
        query += `&toDate=${toDate}`;
    }

    const url = `${ENDPOINTS.BASE_URL}/OEM/Alert/new/get/${userId}?${query}`;
    const response = await axiosInstance.get(url);
    return response.data; // Expect: { notifications: [...], total: number } or adjust in frontend
  },

  async getAlert(userId: string) {
    const url = `${ENDPOINTS.BASE_URL}${ENDPOINTS.GET_ALERTS}${userId}`;
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

  async insertAlertConfig(data: object)  {
    const url = `${ENDPOINTS.BASE_URL}${ENDPOINTS.GET_INSERT_ALERT_CONFIG}`;
    const response = await axiosInstance.post(url, data);
    return response.data;
  },

  async updateAlertConfig(userId:string, data: object) {
    const url = `${ENDPOINTS.BASE_URL}${ENDPOINTS.GET_UPDATE_ALERT_CONFIG}${userId}`;
    const response = await axiosInstance.put(url, data);
    return response.data;
  },

  async deleteAlertConfig(alertId: string) {
    const url = `${ENDPOINTS.BASE_URL}${ENDPOINTS.GET_DELETE_ALERT_CONFIG}${alertId}`;
    const response = await axiosInstance.delete(url);
    return response.data;
  }
};