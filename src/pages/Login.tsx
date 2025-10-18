import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { toast } from "react-toastify";
import newElliotBlack from "/newElliotBlack.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    document.title = "Login";
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await login({ email_id: email, password });
      if (result && result._id) {
        toast.success("Login successful!");
        navigate("/dashboard");
      }
    } catch (err) {
      toast.error("Login failed");
      setError("Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-100 via-white to-orange-200 px-4 font-sans">
      {/* Card */}
      <div className="w-full max-w-xl sm:max-w-sm md:max-w-md lg:max-w-[420px]">
        <div className="bg-white/90 backdrop-blur-xl shadow-2xl rounded-3xl p-8 sm:p-10 border border-orange-200/50 transition-all hover:shadow-orange-200/70">
          {/* Logo + Heading */}
          <div className="flex flex-col items-center mb-8 text-center">
            <img
              alt="Elliot Systems"
              className="h-12 sm:h-14 w-auto object-contain"
              src={newElliotBlack}
            />
            <h2 className="mt-5 text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Welcome Back 👋
            </h2>
            <p className="text-gray-500 text-sm sm:text-base mt-2 font-light">
              Log in to access your dashboard
            </p>
          </div>

          {/* Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Email*
              </label>
              <input
                id="email"
                type="email"
                value={email}
                placeholder="example@mail.com"
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl bg-gray-50 placeholder-gray-400 
                focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all
                shadow-sm hover:shadow-md"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Password*
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  placeholder="••••••••"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl bg-gray-50 placeholder-gray-400 
                  focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 pr-10 transition-all
                  shadow-sm hover:shadow-md"
                />
                {/* Toggle Icon */}
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 transition"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end items-center text-sm">
              <a
                href="#"
                className="text-orange-500 hover:text-orange-600 font-medium"
              >
                Forgot password?
              </a>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600
              text-white font-semibold rounded-xl shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400
              transition-all"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-3 w-full">
                  <span className="inline-block">
                    <svg
                      className="animate-spin h-6 w-6 text-white"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="white"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="white"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                  </span>
                  <span className="text-lg font-semibold">Signing in...</span>
                </div>
              ) : (
                "Login"
              )}
            </button>

            {/* Error */}
            {error && (
              <p className="text-sm text-red-500 text-center mt-3 font-medium">
                {error}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
