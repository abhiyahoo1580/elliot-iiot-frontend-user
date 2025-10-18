/**
 * Handles API errors in a standardized way.
 * Redirects to login on 401, logs other errors.
 * @param {object} error - Axios error object
 * @returns {Promise<never>}
 */
import { AxiosError } from 'axios';

export function handleApiError(error: AxiosError): Promise<never> {
  if (error.response) {
    switch (error.response.status) {
      case 401:
        // Unauthorized: redirect to login
        window.location.href = '/login';
        break;
      case 403:
        // Forbidden: optionally handle
        break;
      case 404:
        // Not found: optionally handle
        break;
      default:
        // Other errors: optionally handle
        break;
    }
  }
  return Promise.reject(error);
}

/**
 * Validates API response data.
 * @param {object} data - Response data
 * @returns {boolean}
 */
export function isValidApiResponse(data: unknown): boolean {
  return typeof data === 'object' && data !== null && !('error' in (data as object));
}

/**
 * Utility to safely get nested properties.
 * @param {object} obj - The object
 * @param {string[]} path - Array of keys
 * @param {*} [defaultValue] - Default value if not found
 * @returns {*}
 */
export function getNested<T = unknown>(obj: unknown, path: string[], defaultValue?: T): T {
  return path.reduce((acc, key) => (acc && typeof acc === 'object' && acc !== null && key in acc ? (acc as Record<string, unknown>)[key] : defaultValue), obj) as T;
}