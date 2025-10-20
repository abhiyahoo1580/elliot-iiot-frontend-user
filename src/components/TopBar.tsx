import { Bars3Icon, BellAlertIcon } from "@heroicons/react/24/outline";
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUnreadNotificationContext } from "../context/UnreadNotificationContext";
import { useAuth } from "../hooks/useAuth";
import { useFullUser } from "../hooks/useFullUser";
import { useUserLocation } from "../hooks/useUserLocation";
import { alertServices } from "../services/alertService";
import ChangePassword from "./ChangePassword";
import NotificationPopover from "./NotificationPopover";
interface TopBarProps {
  onToggleMobileSidebar?: () => void;
}
interface PageNameMapping {
  [key: string]: string;
}

interface UserInfo {
  name?: string;
  email?: string;
  avatar?: string;
}

const TopBar: React.FC<TopBarProps> = ({
  onToggleMobileSidebar,
}): JSX.Element => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  // Close notification popover when clicking outside
  React.useEffect(() => {
    if (!popoverOpen) return;
    function handleClick(e: MouseEvent) {
      const popover = document.getElementById("notification-popover");
      const bellBtn = document.getElementById("notification-bell-btn");
      if (
        popover &&
        !popover.contains(e.target as Node) &&
        bellBtn &&
        !bellBtn.contains(e.target as Node)
      ) {
        setPopoverOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [popoverOpen]);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState<string | null>(null);

  const fetchPopoverNotifications = async () => {
    setNotifLoading(true);
    setNotifError(null);
    try {
      const userId = user?._id || user?.userId || "";
      const companyId = (user?.companyId || user?.company_id || "") as
        | string
        | number;
      const data = await alertServices.getNotifications({
        userId,
        companyId,
        page: 1,
        limit: 5,
        sort: "time",
        order: -1,
      });
      setNotifications(data?.notifications || data?.data || []);
    } catch (err) {
      setNotifError("Failed to load notifications");
    } finally {
      setNotifLoading(false);
    }
  };
  const { user } = useAuth();
  const { user: fullUser } = useFullUser(user?._id);
  const [currentTime, setCurrentTime] = useState<string>("");
  const {
    location: userLocation,
    timezone: userTimezone,
    loading: locationLoading,
    error: locationError,
  } = useUserLocation();
  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Get unread notification count from context
  const { count: unreadCount } = useUnreadNotificationContext();

  useEffect(() => {
    const updateTime = (): void => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: userTimezone,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [userTimezone]);

  const getPageName = useMemo((): string => {
    const pageNameMappings: PageNameMapping = {
      dashboard: "Dashboard",
      realtime: "Real Time Monitoring",
      historical: "Historical",
      devices: "Device Management",
      alertconfig: "Alert Configuration",
      graphconfig: "Graph Configuration",
      parameters: "Parameter Configuration",
    };
    const path = location.pathname.substring(1);
    if (!path) return "Dashboard";

    const basePath = path.split("/")[0];
    if (pageNameMappings[basePath]) {
      return pageNameMappings[basePath];
    }

    return basePath
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }, [location.pathname]);

  const getUserInfo = useMemo((): UserInfo => {
    if (user) {
      return {
        name:
          `${user.first_name || user.firstName || ""} ${
            user.last_name || user.lastName || ""
          }`.trim() || "User",
        email: String(user.email_id || user.email || ""),
        avatar: typeof user.avatar === "string" ? user.avatar : "",
      };
    }
    return { name: "User", email: "", avatar: "" };
  }, [user]);

  const getAvatarUrl = (userInfo: UserInfo): string => {
    if (userInfo.avatar) {
      return userInfo.avatar;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      userInfo.name || "User"
    )}&background=f85424&color=ffffff&size=40&bold=true&format=png`;
  };

  const handleAvatarError = (
    e: React.SyntheticEvent<HTMLImageElement>
  ): void => {
    const target = e.target as HTMLImageElement;
    target.src = `https://ui-avatars.com/api/?name=User&background=f85424&color=ffffff&size=40&bold=true&format=png`;
  };

  const handleDropdownBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setAvatarDropdownOpen(false);
    }
  };

  return (
    <>
      <header className="bg-[#FF6600] flex text-white right-0 p-4 shadow-lg border-b w-full border-orange-600">
        {/* Left Section - Logo and Page Name */}
        <div className="flex items-center space-x-1">
          {/* <div className="flex items-center">
               <img
                src="../../public/elliot-favicon-bg-white.png"
                alt="Elliot Systems Logo"
                className="h-8 w-auto object-contain rounded-md"
                onError={handleLogoError}
              />
              <div
                className="h-8 w-8 bg-white rounded flex items-center justify-center"
                style={{ display: "none" }}
              >
                <span className="text-orange-500 font-bold text-sm">E</span>
              </div>
            </div>  */}
          <div className="flex-1 flex items-center space-x-2">
            <button
              type="button"
              className="bg-black rounded-lg p-2 md:hidden w-auto"
              aria-label="Open sidebar"
              onClick={onToggleMobileSidebar}
            >
              <Bars3Icon className="w-6 h-6 shadow-md rounded-md" />
            </button>
            <h1 className="text-xl font-semibold tracking-wide whitespace-nowrap">
              {getPageName}
            </h1>
            {fullUser?.company_name && (
              <p className="text-xs text-[#FFFFFF] font-medium mt-1">
                {fullUser.company_name}
              </p>
            )}
          </div>
        </div>

        {/* Right Section - Location, Time, and User Info */}
        <div className="flex items-center space-x-6 justify-end w-full pl-4 ml-4 ">
          {/* Location and Time */}
          <div className="hidden md:flex flex-col items-end text-right">
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-[#FFFFFF]">📍</span>
              <span className="text-[#FFFFFF] font-medium">
                {locationLoading ? "Fetching location..." : userLocation}
              </span>
            </div>
            {currentTime && (
              <div className="text-xs text-[#FFFFFF] mt-1">
                🕒 {currentTime}{" "}
                {userTimezone === "Asia/Kolkata" ? "IST" : userTimezone}
              </div>
            )}
            {/* No extra error message for location fallback to company address */}
          </div>

          {/* Notification */}
          <div className="relative">
            <button
              id="notification-bell-btn"
              onClick={() => {
                setPopoverOpen((open) => !open);
                if (!popoverOpen) fetchPopoverNotifications();
              }}
              className="relative"
              aria-haspopup="true"
              aria-expanded={popoverOpen}
            >
              <div className="relative inline-block">
                <BellAlertIcon className="w-7 h-7 text-white" />
                {unreadCount > 0 && (
                  <span
                    className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 bg-red-600 text-white text-[0.75rem] font-bold rounded-full w-5 h-5 flex items-center justify-center border border-white shadow"
                    style={{ zIndex: 1 }}
                  >
                    {unreadCount}
                  </span>
                )}
              </div>
            </button>
            {popoverOpen && (
              <div id="notification-popover">
                <NotificationPopover
                  notifications={notifications}
                  loading={notifLoading}
                  error={notifError}
                  onSeeMore={() => {
                    setPopoverOpen(false);
                    navigate("/notification");
                  }}
                  onNotificationClick={() => {
                    setPopoverOpen(false);
                    navigate("/notification");
                  }}
                />
              </div>
            )}
          </div>

          {/* User Info + Avatar */}
          <div className="flex items-center space-x-3">
            {/* Removed user name and email from TopBar, now only shown in avatar dropdown menu */}
            <div className="relative" tabIndex={0} onBlur={handleDropdownBlur}>
              <img
                src={getAvatarUrl(getUserInfo)}
                alt={`${getUserInfo.name} Avatar`}
                className="w-10 h-10 rounded-full object-cover border-2 text-[#FFFFFF] border-orange-300 hover:border-white transition-colors duration-200 cursor-pointer"
                onError={handleAvatarError}
                onClick={() => setAvatarDropdownOpen((prev) => !prev)}
              />
              {avatarDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded shadow-lg z-50 py-2 text-gray-800">
                  {/* User Info */}
                  <div className="px-4 py-2 border-b border-gray-200 mb-2">
                    <div
                      className="font-semibold text-base truncate"
                      style={{ maxWidth: "200px" }}
                    >
                      {getUserInfo.name}
                    </div>
                    <div
                      className="text-xs text-gray-500 break-all truncate"
                      style={{ maxWidth: "200px" }}
                    >
                      {getUserInfo.email}
                    </div>
                  </div>
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-orange-50"
                    onClick={() => {
                      setAvatarDropdownOpen(false);
                      window.location.href = "/profile";
                    }}
                  >
                    Profile
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-orange-50"
                    onClick={() => {
                      setAvatarDropdownOpen(false);
                      setShowChangePassword(true);
                    }}
                  >
                    Change Password
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-orange-50 text-red-600"
                    onClick={() => {
                      setAvatarDropdownOpen(false);
                      localStorage.clear();
                      window.location.href = "/login";
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
              {/* Mobile hover tooltip */}
              <div className="absolute right-0 top-12 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 sm:hidden">
                {getUserInfo.name}
              </div>
            </div>
          </div>
        </div>
      </header>

      {showChangePassword && (
        <ChangePassword onClose={() => setShowChangePassword(false)} />
      )}
    </>
  );
};

export default TopBar;
