import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  HomeIcon,
  ClockIcon,
  DevicePhoneMobileIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  UserIcon,
  AdjustmentsHorizontalIcon,
  QuestionMarkCircleIcon,
  BellAlertIcon,
  ChartBarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

interface SidebarProps {
  onCollapse: (collapsed: boolean) => void;
  onItemSelect?: () => void;
}

interface NavigationItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive?: boolean;
}

interface NavigationGroup {
  items: NavigationItem[];
  groupLabel?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  onCollapse,
  onItemSelect,
}): JSX.Element => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  useEffect(() => {
    const savedCollapsedState = localStorage.getItem("sidebarCollapsed");
    if (savedCollapsedState) {
      const collapsed = JSON.parse(savedCollapsedState);
      setIsCollapsed(collapsed);
      onCollapse(collapsed);
      window.dispatchEvent(new Event("resize"));
    }
  }, [onCollapse]);

  const handleCollapse = useCallback((): void => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    onCollapse(newCollapsedState);
    localStorage.setItem("sidebarCollapsed", JSON.stringify(newCollapsedState));
    window.dispatchEvent(new Event("resize"));
  }, [isCollapsed, onCollapse]);

  const handleLogout = useCallback((): void => {
    const confirmLogout = window.confirm("Are you sure you want to logout?");
    if (confirmLogout) {
      localStorage.clear();
      navigate("/");
    }
  }, [navigate]);

  const isActivePath = (path: string): boolean => {
    return location.pathname === path;
  };

  const getNavItemClasses = (
    path: string,
    isLogout: boolean = false
  ): string => {
    const baseClasses =
      "flex items-center p-2 rounded transition-colors duration-200 relative";
    const activeClasses = "bg-[#FF6600] text-white";
    const hoverClasses = isLogout
      ? "hover:bg-red-600 hover:text-white"
      : "hover:bg-orange-500 hover:text-white";
    const logoutClasses = isLogout ? "text-red-400" : "";

    return `${baseClasses} ${
      isActivePath(path) ? activeClasses : hoverClasses
    } ${logoutClasses}`;
  };

  const navigationItems: NavigationItem[] = [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: HomeIcon,
    },
    {
      path: "/realtime",
      label: "Real Time",
      icon: ClockIcon,
    },
    {
      path: "/historical",
      label: "Historical",
      icon: ChartBarIcon,
    },
    {
      path: "/devices",
      label: "Devices",
      icon: DevicePhoneMobileIcon,
    },
  ];

  const settingsItems: NavigationItem[] = [
    {
      path: "/alertconfig",
      label: "Alert",
      icon: BellAlertIcon,
    },
    {
      path: "/graphconfig",
      label: "Graph",
      icon: ChartBarIcon,
    },
    {
      path: "/parameters",
      label: "Parameters",
      icon: AdjustmentsHorizontalIcon,
    },
    {
      path: "/profile",
      label: "Profile",
      icon: UserIcon,
    },

    {
      path: "/help",
      label: "Help",
      icon: QuestionMarkCircleIcon,
    },
  ];

  const renderNavigationItem = (
    item: NavigationItem,
    isSubItem: boolean = false
  ): JSX.Element => (
    <Link
      key={item.path}
      to={item.path}
      className={getNavItemClasses(item.path)}
      title={isCollapsed ? item.label : undefined}
      onMouseEnter={() => setHoveredItem(item.path)}
      onMouseLeave={() => setHoveredItem(null)}
      onClick={() => {
        if (onItemSelect) onItemSelect();
        if (isSubItem) setSettingsOpen(true);
      }}
      style={isSubItem && !isCollapsed ? { marginLeft: "1.25rem" } : {}}
    >
      <item.icon className="h-5 w-5 flex-shrink-0" />
      {!isCollapsed && (
        <span className="ml-3 transition-opacity duration-200">
          {item.label}
        </span>
      )}
      {isCollapsed && hoveredItem === item.path && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded shadow-lg whitespace-nowrap z-50">
          {item.label}
        </div>
      )}
    </Link>
  );

  const renderNavigationGroup = (
    items: NavigationItem[],
    groupLabel?: string,
    isSubMenu: boolean = false
  ): JSX.Element => (
    <div className="space-y-1">
      {groupLabel && !isCollapsed && (
        <div className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {groupLabel}
        </div>
      )}
      {items.map((item) => renderNavigationItem(item, isSubMenu))}
    </div>
  );

  return (
    <div
      className={`bg-black text-white min-h-screen p-4 transition-all duration-300 fixed left-0 top-0 z-40 shadow-lg ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Collapse Toggle Button */}
      <button
        data-testid="sidebar-collapse"
        onClick={handleCollapse}
        className="absolute -right-3 top-4 bg-gray-800 hover:bg-gray-700 rounded-full p-1 transition-colors duration-200 shadow-md"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronRightIcon className="h-5 w-5" />
        ) : (
          <ChevronLeftIcon className="h-5 w-5" />
        )}
      </button>

      {/* Brand/Logo Area */}
      <div className="mb-8 pt-2 flex justify-center">
        <div
          className="rounded-lg flex items-center justify-center p-1 w-full"
          style={{ minHeight: isCollapsed ? 48 : 56 }}
        >
          {!isCollapsed ? (
            <div className="flex items-center p-4">
              <img
                src="/Elliot-white-font.png"
                alt="Elliot Systems Logo"
                className="h-10"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
            </div>
          ) : (
            <div className="h-10 w-10 flex items-center">
              <img
                src="/BIG_E.png"
                alt="Elliot Systems Logo"
                className="h-10"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="space-y-6 flex-1 nav">
        {/* Main Navigation */}
        {renderNavigationGroup(navigationItems)}

        {/* Settings Section */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Settings
            </div>
          )}
          <button
            onClick={() => setSettingsOpen((open) => !open)}
            className={
              getNavItemClasses("/settings") + (!isCollapsed ? " w-full" : "")
            }
            title={isCollapsed ? "Settings" : undefined}
            onMouseEnter={() => setHoveredItem("/settings")}
            onMouseLeave={() => setHoveredItem(null)}
            aria-expanded={settingsOpen}
            aria-controls="settings-submenu"
            style={!isCollapsed ? { minWidth: "100%" } : {}}
          >
            <Cog6ToothIcon className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && (
              <span className="ml-3 transition-opacity duration-200">
                Settings
              </span>
            )}
            {isCollapsed && hoveredItem === "/settings" && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded shadow-lg whitespace-nowrap z-50">
                Settings
              </div>
            )}
          </button>
          <div
            id="settings-submenu"
            className={`transition-all duration-300 ease-in-out overflow-hidden`}
            style={{
              maxHeight: settingsOpen ? 500 : 0,
              transform: settingsOpen ? "scaleY(1)" : "scaleY(0.7)",
              opacity: settingsOpen ? 1 : 0,
              transformOrigin: "top",
            }}
          >
            {renderNavigationGroup(settingsItems, undefined, true)}
          </div>
        </div>

        {/* Logout Button */}
        <div className="pt-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className={`${getNavItemClasses("/logout", true)} w-full text-left`}
            title={isCollapsed ? "Logout" : undefined}
            aria-label="Logout"
            onMouseEnter={() => setHoveredItem("/logout")}
            onMouseLeave={() => setHoveredItem(null)}
            onClickCapture={() => {
              if (onItemSelect) onItemSelect();
            }}
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && (
              <span className="ml-3 transition-opacity duration-200">
                Logout
              </span>
            )}
            {isCollapsed && hoveredItem === "/logout" && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded shadow-lg whitespace-nowrap z-50">
                Logout
              </div>
            )}
          </button>
        </div>
      </nav>

      {/* Powered By Elliot - always at the bottom */}
      {!isCollapsed ? (
        <div className="mt-auto mb-4 flex flex-col items-center absolute bottom-0 left-0 w-full pb-4">
          <span className="text-sm font-semibold text-gray-300 mb-0.5">
            Infinity Platform
          </span>
          <span className="text-xs font-semibold text-gray-400 mb-1">
            Powered By
          </span>
          <img src="/Elliot-white-font.png" alt="Powered By" className="h-5" />
        </div>
      ) : (
        <div className="absolute bottom-2 left-0 w-full flex justify-center items-end pb-2">
          <div className="p-1">
            <img
              src="/BIG_E.png"
              alt="Elliot Logo"
              className="object-contain max-h-8"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
