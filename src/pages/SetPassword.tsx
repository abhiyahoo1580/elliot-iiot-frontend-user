import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { userService } from "../services/userService";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function SetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState<string>("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verifying, setVerifying] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const t = searchParams.get("token") || "";
    setToken(t);
    if (!t) {
      toast.error("Invalid link. Missing token.");
      navigate("/", { replace: true });
      return;
    }
    (async () => {
      try {
        setVerifying(true);
        const res = await userService.verifySetupToken(t);
        if (!res?.success) {
          toast.error(res?.msg || "Invalid or expired link");
          navigate("/", { replace: true });
        }
      } catch (e) {
        toast.error("Invalid or expired link");
        navigate("/", { replace: true });
      } finally {
        setVerifying(false);
      }
    })();
  }, [searchParams, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enhanced password validation
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    // Check for mixed character types
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecialChars = /[!@#$%^&*]/.test(password);

    // Count how many character types are present
    const characterTypesCount = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChars]
      .filter(Boolean).length;

    if (characterTypesCount < 3) {
      toast.error("Password must contain at least 3 of the following: uppercase letters, lowercase letters, numbers, and special characters (!@#$%^&*)");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      setSubmitting(true);
      const res = await userService.setPasswordWithToken({ token, password, confirmPassword });
      if (res?.success) {
        toast.success("Password set successfully. Please log in.");
        navigate("/", { replace: true });
      } else {
        toast.error(res?.msg || "Failed to set password");
      }
    } catch (e) {
      toast.error("Failed to set password");
    } finally {
      setSubmitting(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Verifying link...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">Set your password</h2>
        <p className="mt-2 text-center text-sm text-gray-600">Create a password to activate your account</p>
      </div>
      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-lg sm:px-10 border border-orange-100">
          <form className="space-y-6" onSubmit={submit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md bg-orange-50/50 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Enter new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-orange-500 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-orange-500" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400 hover:text-orange-500" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md bg-orange-50/50 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Re-enter new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-orange-500 transition-colors"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-orange-500" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400 hover:text-orange-500" />
                  )}
                </button>
              </div>
            </div>
            <div className="bg-orange-50/50 rounded-md p-3 border border-orange-200">
              <ul className="text-sm space-y-1">
                <li className="flex items-center">
                  <span
                    className={`inline-block w-2 h-2 rounded-full mr-2 ${password.length >= 8 ? "bg-green-500" : "bg-gray-300"}`}
                  />
                  At least 8 characters long
                </li>
                <li className="flex items-center">
                  <span
                    className={`inline-block w-2 h-2 rounded-full mr-2 ${/[A-Z]/.test(password) ? "bg-green-500" : "bg-gray-300"}`}
                  />
                  Contains uppercase letter (A-Z)
                </li>
                <li className="flex items-center">
                  <span
                    className={`inline-block w-2 h-2 rounded-full mr-2 ${/[a-z]/.test(password) ? "bg-green-500" : "bg-gray-300"}`}
                  />
                  Contains lowercase letter (a-z)
                </li>
                <li className="flex items-center">
                  <span
                    className={`inline-block w-2 h-2 rounded-full mr-2 ${/[0-9]/.test(password) ? "bg-green-500" : "bg-gray-300"}`}
                  />
                  Contains number (0-9)
                </li>
                <li className="flex items-center">
                  <span
                    className={`inline-block w-2 h-2 rounded-full mr-2 ${/[!@#$%^&*]/.test(password) ? "bg-green-500" : "bg-gray-300"}`}
                  />
                  Contains special character (!@#$%^&*)
                </li>
                <li className="flex items-center">
                  <span
                    className={`inline-block w-2 h-2 rounded-full mr-2 ${password && confirmPassword && password === confirmPassword ? "bg-green-500" : "bg-gray-300"}`}
                  />
                  Passwords match
                </li>
              </ul>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex justify-center py-2 px-4 rounded-md text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50"
            >
              {submitting ? "Setting Password..." : "Set Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}


