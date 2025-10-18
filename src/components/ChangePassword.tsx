import { useState, useEffect } from "react";
import { useApi } from "../hooks/useApi";
import { ENDPOINTS } from "../api/endpoints";
import { useAuth } from "../hooks/useAuth";
import { toast } from "react-toastify";

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ChangePassword({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuth();
  const { execute } = useApi();

  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  // Soft reload: clear fields after error toast
  useEffect(() => {
    // No need for status state, just clear after error toast
  }, []);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.userId) {
      toast.error("Please log in to change password");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      return;
    }
    setLoading(true);
    try {
      const response = await execute(
        "put",
        ENDPOINTS.UPDATE_PASSWORD(user.userId),
        {
          oldPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          conformPassword: passwordData.confirmPassword,
        }
      );
      const res = response as { msg?: string };
      if (res.msg === "Updated Successfully ") {
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        toast.success("Password updated successfully");
        setTimeout(async () => {
          try {
            localStorage.clear();
            sessionStorage.clear();
            await logout();
            window.location.href = "/login";
            if (window.location.pathname !== "/login") {
              window.location.replace("/login");
            }
            if (window.location.pathname !== "/login") {
              window.location.reload();
            }
          } catch {
            window.location.replace("/login");
          }
        }, 2000);
      } else if (res.msg === "Invalid password") {
        toast.error("Invalid password");
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        toast.error(res.msg || "Failed to update password");
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      }
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: unknown }).response === "object"
      ) {
        const response = (error as { response?: { status?: number; data?: { msg?: string; message?: string } } }).response;
        if (
          response?.status === 401 ||
          response?.data?.msg === "Invalid password"
        ) {
          toast.error("Invalid password. Please try again.");
        } else if (response?.status === 400) {
          toast.error(response.data?.message || "Invalid password format. Please try again.");
        } else if (response?.status === 404) {
          toast.error("Password update service not available. Please try again later.");
        } else {
          toast.error("Failed to update password. Please try again later.");
        }
      } else {
        toast.error("Failed to update password. Please try again later.");
      }
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl"
          onClick={onClose}
          aria-label="Close"
          type="button"
        >
          &times;
        </button>
        <h2 className="text-lg font-semibold mb-4 text-center text-[#FF6600]">Change Password</h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              className="w-full border rounded-md p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              className="w-full border rounded-md p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              className="w-full border rounded-md p-2"
              required
            />
          </div>
          <div className="flex gap-2 justify-end">
            
            <button
              type="button"
              onClick={onClose}
              className="flex px-4 py-2 bg-white text-black border border-gray-300 rounded-md hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex px-4 py-2 bg-[#FF6600] text-white rounded-md hover:bg-[#FF944D]"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}