//endpoints
// User-related API endpoints for UserV2.0

export const ENDPOINTS = {
  BASE_URL:
    (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:8003",
  // Auth
  LOGIN: "/login/login",
  LOGOUT: "/login/logout",
  REGISTER: "/auth/register",

  GET_FULL_USER: "/UOSPL/dashboard/oem/user/information/get?userId=",
  // User profile
  GET_PROFILE: "/OEM/user/get/user/:id",
  UPDATE_PROFILE: "/OEM/user/update/info/:id",

  // Device data
  GET_DEVICES: "/devices",
  GET_DEVICE_BY_ID: (id: string) => `/devices/${id}`,
  CREATE_DEVICE: "/devices",
  UPDATE_DEVICE: `/UOSPL/device/update/`,
  DELETE_DEVICE: (id: string) => `/devices/${id}`,

  // Parameters
  GET_PARAMETERS: (companyId: string, deviceTypeId: string) =>
    `/asset/company/parameters/list/get?companyId=${companyId}&deviceTypeId=${deviceTypeId}`,
  UPDATE_PARAMETERS: (id: string) => `/parameters/${id}`,

  // Real-time data
  GET_REALTIME_DATA: "/realtime",

  // User management (for mapping, etc.)
  GET_USERS: "/users",
  GET_USER_BY_ID: (id: string) => `/users/${id}`,

  // Device mapping
  GET_MAPPINGS: "/mappings",
  CREATE_MAPPING: "/mappings",
  UPDATE_MAPPING: (id: string) => `/mappings/${id}`,
  DELETE_MAPPING: (id: string) => `/mappings/${id}`,

  // Help/Support
  GET_SUPPORT: "/support",
  GET_CARDS: "/UOSPL/dashboard/oem/user/get?userId=",
  GET_LCD_DATA: (userId: string, dateMs: number, companyId: number) =>
    `/UOSPL/dashboard/oem/user/lcd/get/${userId}?date=${dateMs}&companyId=${companyId}`,
  SAVE_NOTIF: "/OEM/user/update/notification/:id",
  //Change User Password
  UPDATE_PASSWORD: (userId: string) => `/OEM/user/update/password/${userId}`,
  // Password setup via email link
  VERIFY_SETUP_TOKEN: "/OEM/user/verify-setup-token",
  SET_PASSWORD_WITH_TOKEN: "/OEM/user/set-password",
  GET_USER_ASSETS: "/OEM/user/get/device/",
  GET_DASHBOARD_DROPDOWN: "/asset/all/status/get/byCustomerId/",

  GET_PARAM_DATA: "/historical/get?",
  GET_GRAPH: "/historical/graph/range/get?",
  // New endpoints
  GET_ASSET_TYPE_LIST: (companyId: string | number) =>
    `/OEM/assetType/map/get?companyId=${companyId}`,
  GET_PARAMETERS_BY_ASSET_TYPE: (
    assetTypeId: number,
    userId: string | number
  ) =>
    `/OEM/assetType/map/parameter/List/get?assetTypeId=${assetTypeId}&userId=${userId}`,
  LCD_INSERT: "/OEM/Lcd/insert",
  // Insert parameter sequence for an asset (user-provided sequence)
  PARAM_SEQUENCE_INSERT: "/OEM/Config/parameter/Sequence/insert",
  // Get parameter sequence for an asset by AssetId (string)
  PARAM_SEQUENCE_GET: "/OEM/Config/parameter/Sequence/get/",
  REALTIME_WS: "wss://iiot.elliotsystemsonline.com:7001/",
  GET_USER_ACTIVITY: (userId: string) => `/OEM/Alert/get/${userId}`,

  // Alert Config
  GET_ALERTS: "/OEM/Config/Alert/get/",
  GET_PARAMETERNAME: "/asset/parameters/list/get?assetId=",
  GET_METERNAME: "/OEM/user/get/device/",
  GET_INSERT_ALERT_CONFIG: "/OEM/Config/Alert/insert",
  GET_UPDATE_ALERT_CONFIG: "/OEM/Config/Alert/update/",
  GET_DELETE_ALERT_CONFIG: "/OEM/Config/Alert/delete/",

  // graph config
  GET_GRAPH_CONFIG: "/OEM/Config/graph/get/",
  GET_INSERT_GRAPH_CONFIG: "/OEM/Config/graph/insert",
  GET_UPDATE_GRAPH_CONFIG: "/OEM/Config/graph/update/",
  GET_DELETE_GRAPH_CONFIG: "/OEM/Config/graph/delete/", // used like /delete/:assetId/:groupName
};
