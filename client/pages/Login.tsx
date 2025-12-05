import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Simulate login delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Check credentials
    if (username === "Hamdey" && password === "123456") {
      // Store auth token in localStorage
      localStorage.setItem("authToken", "true");
      localStorage.setItem("user", username);
      navigate("/");
    } else {
      setError("Invalid username or password");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-blue-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* 3D Background Images */}
      <div className="absolute inset-0 z-0">
        {/* GSM Tower - Left side */}
        <img
          src="https://images.pexels.com/photos/94844/pexels-photo-94844.jpeg"
          alt="GSM Tower"
          className="absolute left-0 top-0 h-full object-cover opacity-25 transform -scale-x-100 scale-110"
        />
        {/* Fuel Truck - Left side */}
        <img
          src="https://cdn.builder.io/api/v1/image/assets%2Fbd65b3cd7a86452e803a3d7dc7a3d048%2Fa3d8612ca0424bcca370521e3474ed71?format=webp&width=800"
          alt="Fuel Truck"
          className="absolute left-0 bottom-0 h-full object-cover opacity-25 transform -scale-x-100 scale-110"
        />
        {/* Gradient overlay to enhance depth and readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/40 to-white/60"></div>

      </div>

      <div className="w-full max-w-md relative z-10 flex flex-col items-center">
        {/* Title Outside Card */}
        <h1 className="text-4xl font-bold text-center text-blue-600 mb-6 whitespace-nowrap">
          مؤسسة نورة الدوسري للمقاولات العامة
        </h1>

        {/* Login Card */}
        <div className="w-full bg-white rounded-2xl shadow-xl p-8 border border-blue-100">
          <p className="text-center text-gray-600 text-sm mb-8">
            Sign in to your account
          </p>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:ring-blue-600 focus:ring-opacity-20 transition-all"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:ring-blue-600 focus:ring-opacity-20 transition-all pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Login Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              © 2024 GSM Fueling. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
