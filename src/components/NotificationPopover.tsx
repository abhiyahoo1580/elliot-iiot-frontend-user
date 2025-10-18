import React from "react";
import {
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { formatInTimeZone } from "date-fns-tz";

interface NotificationPopoverProps {
  notifications: Array<{
    _id: string;
    description: string;
    time: number;
    read: boolean;
    category?: number;
    assetName?: string;
    parameterName?: string | string[];
    value?: number;
    lowerThreshold?: number;
    upperThreshold?: number;
    shortDescription?: string;
    timeZone?: string;
  }>;
  loading: boolean;
  error?: string | null;
  onSeeMore: () => void;
  onNotificationClick?: () => void;
}

const NotificationPopover: React.FC<NotificationPopoverProps> = ({
  notifications,
  loading,
  error,
  onSeeMore,
  onNotificationClick,
}) => {
  return (
    <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl z-50 py-2 text-gray-800 border border-gray-100 text-xs">
      <div className="px-4 py-2 border-b border-gray-100 font-semibold text-base flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-orange-500 mr-2"></span>
        <span className="text-xs">Notifications</span>
      </div>
      {loading ? (
        <div className="px-4 py-6 text-center text-gray-400 text-sm">
          Loading...
        </div>
      ) : error ? (
        <div className="px-4 py-6 text-center text-red-500 text-sm">
          {error}
        </div>
      ) : notifications.length === 0 ? (
        <div className="px-4 py-6 text-center text-gray-400 text-sm">
          No notifications
        </div>
      ) : (
        <ul className="max-h-64 overflow-y-auto divide-y divide-gray-100">
          {notifications.map((notif) => {
            let icon = null;
            let iconBg = "";
            if (notif.category === 3) {
              icon = (
                <ExclamationCircleIcon
                  className="w-4 h-4 text-red-500"
                  aria-hidden="true"
                />
              );
              iconBg = "bg-red-100";
            } else if (notif.category === 2) {
              icon = (
                <ExclamationTriangleIcon
                  className="w-4 h-4 text-yellow-500"
                  aria-hidden="true"
                />
              );
              iconBg = "bg-yellow-100";
            } else if (notif.category === 1) {
              icon = (
                <svg
                  className="w-4 h-4 text-green-500"
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
              );
              iconBg = "bg-green-100";
            }
            return (
              <li
                key={notif._id}
                className={`px-4 py-2 flex flex-col gap-1 text-xs transition-colors duration-150 cursor-pointer hover:bg-orange-50 ${
                  notif.read ? "bg-white" : "bg-orange-50"
                }`}
                onClick={onNotificationClick}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${iconBg}`}
                  >
                    {icon}
                  </span>
                  <span className="font-semibold text-gray-800">
                    {notif.assetName || ""}
                  </span>
                  {notif.parameterName && (
                    <span className="text-gray-600 text-xs ml-1">
                      |{" "}
                      {Array.isArray(notif.parameterName)
                        ? notif.parameterName[0]
                        : notif.parameterName}
                      {/* Breached value info removed from here, now only in description below */}
                    </span>
                  )}
                </div>
                <span className="font-small text-gray-500 mt-1">
                  {notif.shortDescription || notif.description}
                  {typeof notif.value === "number" &&
                    notif.lowerThreshold !== undefined &&
                    notif.upperThreshold !== undefined && (
                      <>
                        {typeof notif.lowerThreshold === "number" &&
                        notif.value < notif.lowerThreshold
                          ? ` (${notif.value} <  ${notif.lowerThreshold})`
                          : typeof notif.upperThreshold === "number" &&
                            notif.value > notif.upperThreshold
                          ? ` ( ${notif.value} >  ${notif.upperThreshold})`
                          : ""}
                      </>
                    )}
                </span>
                <span className="text-[10px] text-gray-400 mt-1">
                  {notif.timeZone
                    ? formatInTimeZone(
                        notif.time,
                        notif.timeZone,
                        "dd MMM yyyy HH:mm:ss zzz"
                      )
                    : new Date(notif.time).toLocaleDateString([], {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      }) +
                      " " +
                      new Date(notif.time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {notifications.length > 0 && (
        <button
          className="w-full text-center px-4 py-2 mt-2 bg-orange-50 hover:bg-orange-100 text-orange-700 font-semibold rounded-lg text-xs"
          onClick={onSeeMore}
        >
          See more
        </button>
      )}
    </div>
  );
};

export default NotificationPopover;
