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

    console.log("🔐 Login attempt with username:", username);

    // Simulate login delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Check credentials
    if (username === "Hamdey" && password === "123456") {
      console.log("✅ Credentials valid, setting auth token...");
      // Store auth token in localStorage
      localStorage.setItem("authToken", "true");
      localStorage.setItem("user", username);
      console.log("✅ Auth token set in localStorage");

      // Verify it was set
      const token = localStorage.getItem("authToken");
      console.log("✅ Verifying token:", token);

      // Navigate to dashboard
      console.log("🚀 Navigating to dashboard...");
      navigate("/");
      console.log("🚀 Navigation called");
    } else {
      console.log("❌ Credentials invalid");
      setError("Invalid username or password");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center p-4 relative overflow-hidden">
      {/* 3D Background Elements */}
      <style>{`
        @keyframes float-truck {
          0%, 100% { transform: translateX(-100px) rotateY(-15deg) rotateX(5deg); opacity: 0.35; }
          50% { transform: translateX(50px) rotateY(-15deg) rotateX(5deg); opacity: 0.55; }
        }
        @keyframes float-tower {
          0%, 100% { transform: translateZ(-200px) rotateZ(-10deg); opacity: 0.25; }
          50% { transform: translateZ(-150px) rotateZ(-10deg); opacity: 0.45; }
        }
        .truck-3d {
          position: absolute;
          animation: float-truck 8s ease-in-out infinite;
          filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.3));
        }
        .tower-3d {
          position: absolute;
          animation: float-tower 10s ease-in-out infinite;
          filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.3));
        }
      `}</style>

      {/* GSM Tower Image */}
      <div className="tower-3d" style={{ top: '10%', left: '5%', width: '180px', height: '280px' }}>
        <img
          src="https://images.pexels.com/photos/18379732/pexels-photo-18379732.jpeg"
          alt="GSM Tower"
          className="w-full h-full object-cover rounded-lg"
        />
      </div>

      {/* Truck Image */}
      <div className="truck-3d" style={{ bottom: '15%', right: '10%', width: '280px', height: '160px' }}>
        <img
          src="https://images.pexels.com/photos/27946843/pexels-photo-27946843.jpeg"
          alt="Fuel Truck"
          className="w-full h-full object-cover rounded-lg"
        />
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
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
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
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
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
        </div>
      </div>
    </div>
  );
}
