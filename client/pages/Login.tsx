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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      perspective: '1000px'
    }}>
      {/* 3D Background Elements */}
      <style>{`
        @keyframes float-truck {
          0%, 100% { transform: translateX(-100px) rotateY(-15deg) rotateX(5deg); opacity: 0.3; }
          50% { transform: translateX(50px) rotateY(-15deg) rotateX(5deg); opacity: 0.5; }
        }
        @keyframes float-tower {
          0%, 100% { transform: translateZ(-200px) rotateZ(-10deg); opacity: 0.2; }
          50% { transform: translateZ(-150px) rotateZ(-10deg); opacity: 0.4; }
        }
        @keyframes subtle-float {
          0%, 100% { transform: translateY(20px); }
          50% { transform: translateY(-20px); }
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

      {/* GSM Tower */}
      <div className="tower-3d" style={{ top: '10%', left: '5%', width: '200px', height: '300px' }}>
        <svg viewBox="0 0 100 150" className="w-full h-full">
          {/* Main tower pole */}
          <rect x="45" y="20" width="10" height="100" fill="#888" opacity="0.6" />
          {/* Cross beams */}
          <line x1="30" y1="40" x2="70" y2="40" stroke="#999" strokeWidth="2" opacity="0.5" />
          <line x1="25" y1="70" x2="75" y2="70" stroke="#999" strokeWidth="2" opacity="0.5" />
          <line x1="30" y1="100" x2="70" y2="100" stroke="#999" strokeWidth="2" opacity="0.5" />
          {/* Antennas */}
          <rect x="40" y="10" width="3" height="15" fill="#e74c3c" opacity="0.7" />
          <rect x="57" y="10" width="3" height="15" fill="#e74c3c" opacity="0.7" />
          {/* Base */}
          <circle cx="50" cy="125" r="15" fill="#666" opacity="0.6" />
          <line x1="35" y1="125" x2="40" y2="140" stroke="#777" strokeWidth="2" opacity="0.5" />
          <line x1="65" y1="125" x2="60" y2="140" stroke="#777" strokeWidth="2" opacity="0.5" />
          <line x1="50" y1="125" x2="50" y2="145" stroke="#777" strokeWidth="2" opacity="0.5" />
        </svg>
      </div>

      {/* Truck */}
      <div className="truck-3d" style={{ bottom: '15%', right: '10%', width: '250px', height: '150px' }}>
        <svg viewBox="0 0 200 120" className="w-full h-full">
          {/* Cabin */}
          <rect x="20" y="50" width="50" height="40" fill="#2980b9" opacity="0.7" rx="3" />
          {/* Windshield */}
          <rect x="25" y="55" width="20" height="15" fill="#87ceeb" opacity="0.5" rx="2" />
          {/* Cargo bed */}
          <rect x="70" y="60" width="100" height="30" fill="#34495e" opacity="0.7" rx="2" />
          {/* Left wheel */}
          <circle cx="40" cy="95" r="12" fill="#1a1a1a" opacity="0.8" />
          <circle cx="40" cy="95" r="8" fill="#555" opacity="0.6" />
          {/* Right wheel */}
          <circle cx="160" cy="95" r="12" fill="#1a1a1a" opacity="0.8" />
          <circle cx="160" cy="95" r="8" fill="#555" opacity="0.6" />
          {/* Bumper */}
          <rect x="15" y="88" width="5" height="12" fill="#666" opacity="0.7" />
          {/* Cargo details */}
          <line x1="90" y1="65" x2="90" y2="85" stroke="#555" strokeWidth="1" opacity="0.5" />
          <line x1="110" y1="65" x2="110" y2="85" stroke="#555" strokeWidth="1" opacity="0.5" />
          <line x1="130" y1="65" x2="130" y2="85" stroke="#555" strokeWidth="1" opacity="0.5" />
          {/* Headlight */}
          <circle cx="22" cy="70" r="4" fill="#ffeb3b" opacity="0.6" />
        </svg>
      </div>

      {/* Floating fuel droplets */}
      <div className="absolute" style={{
        top: '20%',
        right: '20%',
        width: '60px',
        height: '60px',
        animation: 'subtle-float 5s ease-in-out infinite',
        opacity: 0.2
      }}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M50 20 Q65 50 50 80 Q35 50 50 20" fill="#f39c12" opacity="0.8" />
        </svg>
      </div>

      {/* Grid overlay for depth */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.1) 26%, transparent 27%, transparent 74%, rgba(255,255,255,0.1) 75%, rgba(255,255,255,0.1) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.1) 26%, transparent 27%, transparent 74%, rgba(255,255,255,0.1) 75%, rgba(255,255,255,0.1) 76%, transparent 77%, transparent)',
        backgroundSize: '50px 50px'
      }}></div>
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
