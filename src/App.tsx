import { ReactNode, useState, useRef, useEffect, lazy, Suspense } from "react";
import { IdleTimerProvider } from "react-idle-timer";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

// Lazy load all pages
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Historical = lazy(() => import("./pages/Historical"));
const Devices = lazy(() => import("./pages/Devices"));
const Settings = lazy(() => import("./pages/Settings"));
const Profile = lazy(() => import("./pages/Profile"));
const Parameters = lazy(() => import("./pages/Parameters"));
const Help = lazy(() => import("./pages/Help"));
const Realtime = lazy(() => import("./pages/RealTime"));
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Analytics } from "@vercel/analytics/react";
import AlertConfig from "./pages/AlertConfig";
import GraphConfig from "./pages/GraphConfig";

import { UnreadNotificationProvider } from "./context/UnreadNotificationContext";

import Notification from "./components/notification/notification";

const SetPassword = lazy(() => import("./pages/SetPassword"));

interface PrivateRouteProps {
  children: ReactNode;
}

function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const decoded = jwtDecode(token);
    if (decoded && typeof decoded === "object" && "exp" in decoded) {
      const exp = (decoded as any).exp;
      const now = Math.floor(Date.now() / 1000);
      return !exp || exp <= now;
    }
    return true;
  } catch {
    return true;
  }
}

function PrivateRoute({ children }: PrivateRouteProps) {
  const userIdCheck = localStorage.getItem("userId");
  const [isCollapsed, setIsCollapsed] = useState(false);
   const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false); // match admin default
  // Sidebar width: 4rem (w-16) collapsed, 16rem (w-64) expanded
  const sidebarWidth = isCollapsed ? "w-16" : "w-64";
  const marginLeft = isCollapsed ? "ml-20" : "ml-64";

   const toggleMobileSidebar = (): void => {
    setIsMobileSidebarOpen((prev) => !prev);
  };
  const closeMobileSidebar = (): void => {
    setIsMobileSidebarOpen(false);
  };

  if (!userIdCheck) {
    localStorage.clear();
    return <Navigate to="/" />;
  }

  // Get userId from AuthContext or localStorage
  let userId = "";
  try {
    const auth = JSON.parse(localStorage.getItem("user") || "{}");
    userId = auth?._id || auth?.userId || localStorage.getItem("userId") || "";
  } catch {
    userId = localStorage.getItem("userId") || "";
  }

  return (
    <UnreadNotificationProvider userId={userId}>
      <div className="flex h-screen w-full bg-gray-100">
        <div
          className={"hidden md:block fixed top-0 left-0 h-full z-30 transform transition-transform duration-300 ease-out"}
        >
          <Sidebar onCollapse={setIsCollapsed} />
        </div>
        {/* Mobile sidebar overlay */}
      {isMobileSidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm bg-opacity-40 z-40 md:hidden transition-transform duration-300 ease-out shadow-2xl"
            onClick={closeMobileSidebar}
          />
          <div className="h-full bg-white">
            <Sidebar onCollapse={setIsCollapsed} onItemSelect={closeMobileSidebar} />
          </div>
        </>
      )}
        <div
          className={`flex-1 min-h-screen  flex flex-col transition-all duration-300 ease-in-out ${isCollapsed ? "md:ml-16" : "md:ml-64"
          } relative bg-gray-100`}
        >
          <div
            className={`fixed top-0 right-0 left-0 z-20 transition-all duration-300 ease-in-out ${isCollapsed ? "md:left-16" : "md:left-64"
            }  bg-white shadow-sm backdrop-blur-sm bg-white/90 supports-[backdrop-filter]:backdrop-white/60`}
          >
            <TopBar onToggleMobileSidebar={toggleMobileSidebar} />
          </div>
          <div className="flex-1 pt-16 md:pt-20 overflow-x-hidden overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </UnreadNotificationProvider>
  );
}

// Idle warning modal component
function IdleWarningModal({ countdown }: { countdown: number }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.4)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "white",
          padding: 32,
          borderRadius: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        }}
      >
        <h2 style={{ marginBottom: 16 }}>You are about to be logged out</h2>
        <p style={{ marginBottom: 0 }}>
          You have been inactive. You will be logged out in <b>{countdown}</b>{" "}
          seconds.
        </p>
      </div>
    </div>
  );
}

const App: React.FC = () => {
  // Idle timer state
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(30); // 30s warning
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
      const userId = localStorage.getItem("userId");
      return !!userId;
  });
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const idleTimerRef = useRef<any>(null);

  // Ensure warning dialog and timer are cleared when logged out
  useEffect(() => {
    if (!isLoggedIn) {
      setShowWarning(false);
      setCountdown(30);
      if (countdownRef.current) clearInterval(countdownRef.current);
    }
  }, [isLoggedIn]);

  // Handler for when user becomes idle
  const onIdle = () => {
    if (!isLoggedIn) return;
    setShowWarning(true);
    setCountdown(30);
    // Start countdown
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          handleLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Handler for when user becomes active
  const onActive = () => {
    if (!isLoggedIn) return;
    if (showWarning) {
      setShowWarning(false);
      setCountdown(30);
      if (countdownRef.current) clearInterval(countdownRef.current);
    }
  };

  // Handler for logout
  const handleLogout = () => {
    setShowWarning(false);
    setCountdown(30);
    setIsLoggedIn(false);
    if (countdownRef.current) clearInterval(countdownRef.current);
    localStorage.clear();
    window.location.href = "/";
  };

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // Listen for login/logout changes (token changes)
  useEffect(() => {
    const checkLogin = () => {
        const userId = localStorage.getItem("userId");
        setIsLoggedIn(!!userId);
    };
    window.addEventListener("storage", checkLogin);
    return () => window.removeEventListener("storage", checkLogin);
  }, []);

  return (
    <IdleTimerProvider
      ref={idleTimerRef}
      timeout={43200000} // 12 hours in milliseconds
      onIdle={onIdle}
      onActive={onActive}
      debounce={500}
      crossTab={true}
      disabled={!isLoggedIn}
    >
      <AuthProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <Suspense fallback={<div>Loading...</div>}>
              <Routes>
                <Route
                  path="/"
                  element={
                    isLoggedIn ? (
                      <Navigate to="/dashboard" replace />
                    ) : (
                      <Login />
                    )
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <PrivateRoute>
                      <Dashboard />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/realtime"
                  element={
                    <ErrorBoundary>
                      <PrivateRoute>
                        <Realtime />
                      </PrivateRoute>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/historical"
                  element={
                    <ErrorBoundary>
                      <PrivateRoute>
                        <Historical />
                      </PrivateRoute>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/devices"
                  element={
                    <ErrorBoundary>
                      <PrivateRoute>
                        <Devices />
                      </PrivateRoute>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <PrivateRoute>
                      <Profile />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/notification"
                  element={
                    <PrivateRoute>
                      <Notification />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/alertconfig"
                  element={
                    <PrivateRoute>
                      <AlertConfig />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/graphconfig"
                  element={
                    <PrivateRoute>
                      <GraphConfig />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/parameters"
                  element={
                    <PrivateRoute>
                      <Parameters />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/help"
                  element={
                    <PrivateRoute>
                      <Help />
                    </PrivateRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" />} />
                {/* Public route for password setup via email link */}
                <Route path="/set-password" element={<SetPassword />} />
              </Routes>
            </Suspense>
            {isLoggedIn && showWarning && (
              <IdleWarningModal countdown={countdown} />
            )}
          </ErrorBoundary>
        </BrowserRouter>
        <ToastContainer position="top-right" autoClose={3000} />
        <Analytics />
      </AuthProvider>
    </IdleTimerProvider>
  );
};

export default App;
