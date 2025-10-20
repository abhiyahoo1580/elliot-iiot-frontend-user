import {
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import {
  EnvelopeIcon as EnvelopeSolid,
  EnvelopeOpenIcon as EnvelopeOpenSolid,
} from "@heroicons/react/24/solid";
import React, { useState, useMemo, useEffect, useContext } from "react";
import { useUnreadNotificationContext } from "../../context/UnreadNotificationContext";
import { alertServices } from "../../services/alertService";
import { AuthContext } from "../../context/AuthContext";
import CustomSpinner from "../CustomSpinner";
import { formatInTimeZone } from "date-fns-tz";

// Define NotificationType with required properties
type NotificationType = {
  _id: string;
  CompanyId: number;
  description: string;
  value: number;
  upperThreshold: number;
  lowerThreshold: number;
  time: number;
  category: number;
  read: boolean;
  Archive: boolean;
  AssetId: string;
  assetName: string;
  parameterName: string;
  timeZone?: string;
};

const Notification: React.FC = () => {
  const auth = useContext(AuthContext);
  const userId = auth?.user?.userId || "";
  const companyId = auth?.user?.company_id || auth?.user?.companyId || "";
  // For bell icon unread count refresh
  const { refresh: refreshUnreadCount } = useUnreadNotificationContext();

  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [totalItems, setTotalItems] = useState(0); // New: Server total count
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readStatus, setReadStatus] = useState<{ [id: string]: boolean }>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingSearchTerm, setPendingSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [recordsPerPageOption, setRecordsPerPageOption] = useState("10");
  const [customRecords, setCustomRecords] = useState("");
  // Actual filter states (sent to server)
  const [deviceName, setDeviceName] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  // Pending filter states (UI inputs)
  const [pendingDeviceName, setPendingDeviceName] = useState("all");
  const [pendingDateFrom, setPendingDateFrom] = useState("");
  const [pendingDateTo, setPendingDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Sorting state for columns
  const [sortField, setSortField] = useState<string>("time");
  const [sortOrder, setSortOrder] = useState<number>(-1); // -1: desc, 1: asc

  // Unique device and parameter names for dropdowns (from current page data; ideally fetch separately if needed)
  const deviceNames = useMemo(
    () => Array.from(new Set(notifications.map((d) => d.assetName))),
    [notifications]
  );

  // Fetch notifications from API (full server-side pagination + filters)
  useEffect(() => {
    if (!userId || !companyId) return;
    setLoading(true);
    setError(null);
    if (typeof companyId !== "string" && typeof companyId !== "number") return;

    // Prepare date filters as timestamps if set
    const fromTimestamp = dateFrom
      ? new Date(dateFrom).setHours(0, 0, 0, 0)
      : undefined;
    const toTimestamp = dateTo
      ? new Date(dateTo).setHours(23, 59, 59, 999)
      : undefined;

    alertServices
      .getNotifications({
        userId,
        companyId,
        page: currentPage,
        limit: recordsPerPage,
        sort: sortField,
        order: sortOrder,
        search: searchTerm,
        deviceName: deviceName === "all" ? undefined : deviceName,
        fromDate: fromTimestamp,
        toDate: toTimestamp,
      })
      .then((data) => {
        const notifs = data?.notifications || data?.data || []; // Adjust based on API shape
        const total = data?.total || data?.totalCount || 0; // Assume API returns total
        setNotifications(notifs);
        setTotalItems(total);
        setReadStatus(
          Object.fromEntries(
            (notifs || []).map((n: NotificationType) => [n._id, n.read])
          )
        );
        // Reset to page 1 if total items decreased (e.g., after filter)
        if (Math.ceil(total / recordsPerPage) < currentPage) {
          setCurrentPage(1);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setError("Failed to load notifications");
        setLoading(false);
      });
  }, [
    userId,
    companyId,
    currentPage,
    recordsPerPage,
    sortField,
    sortOrder,
    searchTerm,
    deviceName,
    dateFrom,
    dateTo,
  ]);

  // Loading and error states
  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  // Pagination logic (now based on server total)
  const pageSize = recordsPerPage;
  const showCustomPageSize = recordsPerPageOption === "custom";
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(startIndex + pageSize - 1, totalItems);
  const currentRecords = notifications; // No client-side filtering needed

  // Generate pagination buttons
  const getPaginationButtons = () => {
    const pages: number[] = [];
    const maxButtons = 5;
    let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    const end = Math.min(totalPages, start + maxButtons - 1);

    if (end - start < maxButtons - 1) {
      start = Math.max(1, end - maxButtons + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  return (
    <div className="bg-gray-100 w-full px-3 sm:px-4 md:px-6 py-4 md:py-4 min-h-screen font-sans mt-8">
      {/* Search Bar */}
      <div className="mb-4">
        <div className="flex">
          <input
            type="text"
            placeholder="Search by Asset Name"
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-[#ff6600] focus:border-[#ff6600] text-sm sm:text-base text-black"
            value={pendingSearchTerm}
            onChange={(e) => setPendingSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setSearchTerm(pendingSearchTerm);
                setCurrentPage(1);
              }
            }}
            aria-label="Search notifications by asset name"
          />
          <button
            className="ml-2 px-4 py-2 bg-[#ff6600] text-white rounded"
            onClick={() => {
              setSearchTerm(pendingSearchTerm);
              setCurrentPage(1);
            }}
            aria-label="Search notifications"
          >
            Search
          </button>
        </div>
      </div>

      {/* Filter Toggle Button */}
      <div className="mb-4 flex justify-start">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 text-[#ff6600] hover:text-[#e65c00] transition-colors border border-[#ff6600] rounded px-3 py-1 text-sm"
          aria-expanded={showFilters}
          aria-controls="filter-section"
        >
          <span>{showFilters ? "Hide Filters" : "Show Filters"}</span>
          <svg
            className={`w-4 h-4 transform transition-transform ${
              showFilters ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {/* Filter Section */}
      {showFilters && (
        <div
          id="filter-section"
          className="mb-4 bg-[#f8f9fa] p-3 sm:p-4 rounded-lg border"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Device Name Filter */}
            <div>
              <label
                htmlFor="device-name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Device Name
              </label>
              <select
                id="device-name"
                value={pendingDeviceName}
                onChange={(e) => setPendingDeviceName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#ff6600] focus:border-[#ff6600] text-black"
                aria-label="Filter by device name"
              >
                <option value="all">All Devices</option>
                {deviceNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            {/* Date Range Filter */}
            <div className="flex gap-2 items-center w-full">
              <div className="flex flex-col w-1/2">
                <label
                  htmlFor="date-from"
                  className="text-xs text-gray-700 mb-1"
                >
                  From Date
                </label>
                <input
                  id="date-from"
                  type="date"
                  className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#ff6600] focus:border-[#ff6600] text-black"
                  value={pendingDateFrom}
                  onChange={(e) => setPendingDateFrom(e.target.value)}
                  max={pendingDateTo || undefined}
                  aria-label="Filter by start date"
                />
              </div>
              <span className="text-[#ff6600] font-bold mt-5">to</span>
              <div className="flex flex-col w-1/2">
                <label htmlFor="date-to" className="text-xs text-gray-700 mb-1">
                  To Date
                </label>
                <input
                  id="date-to"
                  type="date"
                  className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#ff6600] focus:border-[#ff6600] text-black"
                  value={pendingDateTo}
                  onChange={(e) => setPendingDateTo(e.target.value)}
                  min={pendingDateFrom || undefined}
                  aria-label="Filter by end date"
                />
              </div>
            </div>
          </div>
          {/* Filter Action Buttons */}
          <div className="mt-4 flex flex-col sm:flex-row sm:justify-end gap-2">
            <button
              onClick={() => {
                setPendingDeviceName("all");
                setPendingDateFrom("");
                setPendingDateTo("");
                setSearchTerm(""); // Also clear search
                setPendingSearchTerm("");
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors w-full sm:w-auto"
            >
              Clear Filters
            </button>
            <button
              onClick={() => {
                setDeviceName(pendingDeviceName);
                setDateFrom(pendingDateFrom);
                setDateTo(pendingDateTo);
                setCurrentPage(1);
              }}
              className="px-4 py-2 text-sm bg-[#ff6600] text-white rounded-md hover:bg-[#e65c00] transition-colors w-full sm:w-auto"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Table + Mark All as Read Button */}
      <div className="grid bg-white rounded-lg shadow-md mb-6">
        <div className="flex justify-end items-center px-3 pt-4 pb-2">
          <button
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-semibold disabled:opacity-50"
            disabled={notifications.filter((n) => !n.read).length === 0}
            onClick={async () => {
              const unreadIds = notifications
                .filter((n) => !n.read)
                .map((n) => n._id);
              if (unreadIds.length === 0) return;
              try {
                await alertServices.markAsRead(unreadIds);
                setNotifications((prev) =>
                  prev.map((n) =>
                    unreadIds.includes(n._id) ? { ...n, read: true } : n
                  )
                );
                setReadStatus((prev) => {
                  const updated = { ...prev };
                  unreadIds.forEach((id) => {
                    updated[id] = true;
                  });
                  return updated;
                });
                refreshUnreadCount();
              } catch (e) {
                console.error("Mark as read error:", e);
                // Optionally show toast/error
              }
            }}
          >
            Mark All as Read
          </button>
        </div>
        <div className="bg-white shadow-md overflow-hidden rounded-lg">
          <table className="min-w-full bg-white shadow-sm rounded-lg text-sm sm:text-base">
            <thead>
              <tr className="bg-[#ff6600] text-white">
                <th
                  scope="col"
                  className="px-3 sm:px-4 py-2 text-right w-14 sm:w-20"
                >
                  S.No
                </th>
                <th scope="col" className="px-3 sm:px-4 py-2 text-left">
                  Alert
                </th>
                <th scope="col" className="px-3 sm:px-4 py-2 text-left">
                  <div className="flex items-center space-x-2">
                    <span>Device Name</span>
                    <button
                      onClick={() => {
                        if (sortField === "assetName") {
                          setSortOrder(sortOrder === 1 ? -1 : 1);
                        } else {
                          setSortField("assetName");
                          setSortOrder(1);
                        }
                      }}
                      className="p-1 border border-white/40 rounded bg-white/10 hover:bg-white/20 transition-colors"
                      title="Sort by Device Name"
                    >
                      {sortField !== "assetName" ? (
                        <div className="flex flex-col items-center">
                          <svg
                            className="w-3 h-3 text-[#fff3e6]"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <svg
                            className="w-3 h-3 -mt-1 text-[#fff3e6]"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      ) : sortOrder === 1 ? (
                        <span className="text-white">↑</span>
                      ) : (
                        <span className="text-white">↓</span>
                      )}
                    </button>
                  </div>
                </th>
                <th scope="col" className="px-3 sm:px-4 py-2 text-left">
                  Parameter
                </th>
                <th scope="col" className="px-3 sm:px-4 py-2 text-left">
                  Description
                </th>
                <th scope="col" className="px-3 sm:px-4 py-2 text-right">
                  High Threshold
                </th>
                <th scope="col" className="px-3 sm:px-4 py-2 text-right">
                  Low Threshold
                </th>
                <th scope="col" className="px-3 sm:px-4 py-2 text-right">
                  Value
                </th>
                <th scope="col" className="px-3 sm:px-4 py-2 text-left">
                  <div className="flex items-center space-x-2">
                    <span>Time</span>
                    <button
                      onClick={() => {
                        if (sortField === "time") {
                          setSortOrder(sortOrder === 1 ? -1 : 1);
                        } else {
                          setSortField("time");
                          setSortOrder(-1);
                        }
                      }}
                      className="p-1 border border-white/40 rounded bg-white/10 hover:bg-white/20 transition-colors"
                      title="Sort by Time"
                    >
                      {sortField !== "time" ? (
                        <div className="flex flex-col items-center">
                          <svg
                            className="w-3 h-3 text-[#fff3e6]"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <svg
                            className="w-3 h-3 -mt-1 text-[#fff3e6]"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      ) : sortOrder === 1 ? (
                        <span className="text-white">↑</span>
                      ) : (
                        <span className="text-white">↓</span>
                      )}
                    </button>
                  </div>
                </th>
                <th scope="col" className="px-3 sm:px-4 py-2 text-left">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-16">
                    <CustomSpinner />
                  </td>
                </tr>
              ) : currentRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No results found.
                  </td>
                </tr>
              ) : (
                currentRecords.map((item, index) => {
                  const isRead = readStatus[item._id];
                  // Alternate row background: even rows #FFF5F0, odd rows #fff
                  const rowBg = index % 2 === 0 ? "#FFF5F0" : "#fff";
                  return (
                    <tr
                      key={`${item._id}-${index}`}
                      className={`border-b transition-colors ${
                        !isRead ? "font-bold" : ""
                      }`}
                      style={{ background: rowBg }}
                    >
                      <td className="px-3 sm:px-4 py-2 text-right">
                        {startIndex + index}
                      </td>
                      <td className="px-3 sm:px-4 py-2">
                        {item.category === 1 && (
                          <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            <svg
                              className="w-4 h-4 mr-1 text-green-500"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="2"
                                fill="none"
                              />
                              <path
                                d="M9 12l2 2 4-4"
                                stroke="currentColor"
                                strokeWidth="2"
                                fill="none"
                              />
                            </svg>
                            Info
                          </span>
                        )}
                        {item.category === 2 && (
                          <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                            <ExclamationTriangleIcon
                              className="w-4 h-4 mr-1 text-yellow-500"
                              aria-hidden="true"
                            />
                            Warning
                          </span>
                        )}
                        {item.category === 3 && (
                          <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                            <ExclamationCircleIcon
                              className="w-4 h-4 mr-1 text-red-500"
                              aria-hidden="true"
                            />
                            Alert
                          </span>
                        )}
                      </td>
                      <td className="px-3 sm:px-4 py-2">{item.assetName}</td>
                      <td className="px-3 sm:px-4 py-2">
                        {item.parameterName}
                      </td>
                      <td className="px-3 sm:px-4 py-2">{item.description}</td>
                      <td className="px-3 sm:px-4 py-2 text-right">
                        {item.upperThreshold !== undefined &&
                        item.upperThreshold !== null
                          ? item.upperThreshold
                          : "N/A"}{" "}
                      </td>
                      <td className="px-3 sm:px-4 py-2 text-right">
                        {item.lowerThreshold !== undefined &&
                        item.lowerThreshold !== null
                          ? item.lowerThreshold
                          : "N/A"}
                      </td>
                      <td className="px-3 sm:px-4 py-2 text-right">
                        {item.value !== undefined && item.value !== null
                          ? item.value
                          : "N/A"}
                      </td>
                      <td className="px-3 sm:px-4 py-2 whitespace-nowrap">
                        {item.timeZone
                          ? formatInTimeZone(
                              item.time,
                              item.timeZone,
                              "dd MMM yyyy, HH:mm:ss zzz"
                            )
                          : (() => {
                              const date = new Date(item.time);
                              const day = String(date.getDate()).padStart(
                                2,
                                "0"
                              );
                              const monthName = date.toLocaleString("en-GB", {
                                month: "short",
                              });
                              const year = date.getFullYear();
                              const hours = String(date.getHours()).padStart(
                                2,
                                "0"
                              );
                              const minutes = String(
                                date.getMinutes()
                              ).padStart(2, "0");
                              const seconds = String(
                                date.getSeconds()
                              ).padStart(2, "0");
                              const time = `${hours}:${minutes}:${seconds}`;
                              return `${day} ${monthName} ${year}, ${time}`;
                            })()}
                      </td>
                      <td className="px-3 sm:px-4 py-2 text-center">
                        <button
                          className="p-1 rounded hover:bg-gray-100"
                          title={item.read ? "Read" : "Mark as Read"}
                          onClick={async () => {
                            if (!item.read) {
                              try {
                                await alertServices.markAsRead([item._id]);
                                setNotifications((prev) =>
                                  prev.map((n) =>
                                    n._id === item._id
                                      ? { ...n, read: true }
                                      : n
                                  )
                                );
                                setReadStatus((prev) => ({
                                  ...prev,
                                  [item._id]: true,
                                }));
                                refreshUnreadCount();
                              } catch (e) {
                                console.error("Mark as read error:", e);
                              }
                            }
                          }}
                          disabled={item.read}
                        >
                          {item.read ? (
                            <EnvelopeOpenSolid className="w-5 h-5 text-green-500" />
                          ) : (
                            <EnvelopeSolid className="w-5 h-5 text-orange-500" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="mt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-white p-3 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <span className="text-sm text-gray-600">
              Showing {totalItems === 0 ? 0 : startIndex} to {endIndex} of{" "}
              {totalItems} notifications
            </span>
          </div>
          <div className="flex items-center sm:justify-end gap-2">
            <label htmlFor="rows-per-page" className="text-sm text-gray-600">
              Rows per page:
            </label>
            <select
              id="rows-per-page"
              value={showCustomPageSize ? "custom" : pageSize.toString()}
              onChange={(e) => {
                setRecordsPerPageOption(e.target.value);
                if (e.target.value === "custom") {
                  setCustomRecords("");
                } else {
                  setRecordsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }
              }}
              className="border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-[#ff6600]"
              aria-label="Select rows per page"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="custom">Custom</option>
            </select>
            {showCustomPageSize && (
              <>
                <input
                  type="number"
                  min="1"
                  max="1000" // Optional limit
                  placeholder="Custom"
                  value={customRecords}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^\d*$/.test(val)) {
                      setCustomRecords(val);
                    }
                  }}
                  className="w-20 border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-[#ff6600]"
                />
                <button
                  onClick={() => {
                    const num = Number(customRecords);
                    if (num > 0 && num <= 1000) {
                      setRecordsPerPage(num);
                      setCurrentPage(1);
                    }
                  }}
                  className="px-2 py-1 bg-[#ff6600] text-white rounded text-sm hover:bg-[#e65c00]"
                  disabled={Number(customRecords) <= 0}
                >
                  Apply
                </button>
              </>
            )}
          </div>
        </div>

        {/* Pagination Buttons */}
        {totalPages > 1 && (
          <div className="mt-4 flex flex-wrap justify-center items-center gap-2 mb-3">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
              aria-label="Go to first page"
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
              aria-label="Go to previous page"
            >
              Previous
            </button>
            {getPaginationButtons().map((pageNum) => (
              <button
                key={`page-${pageNum}`}
                onClick={() => setCurrentPage(pageNum)}
                className={`px-3 py-1 border rounded text-sm ${
                  pageNum === currentPage
                    ? "bg-[#ff6600] text-white"
                    : "hover:bg-gray-50"
                }`}
                aria-label={`Go to page ${pageNum}`}
                aria-current={pageNum === currentPage ? "page" : undefined}
              >
                {pageNum}
              </button>
            ))}
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
              aria-label="Go to next page"
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
              aria-label="Go to last page"
            >
              Last
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notification;
