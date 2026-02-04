import { useState } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true); // Toggle between Login/Register
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth(); // Get the login function from Context

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (isLogin) {
        // --- LOGIN LOGIC ---
        // FastAPI expects 'application/x-www-form-urlencoded' for OAuth2
        const formData = new FormData();
        formData.append("username", email); // OAuth2 standard uses 'username'
        formData.append("password", password);

        const res = await axios.post("http://127.0.0.1:8000/token", formData);
        login(res.data.access_token);
      } else {
        // --- REGISTER LOGIC ---
        // Our API expects JSON for registration
        const res = await axios.post("http://127.0.0.1:8000/register", {
          email: email,
          password: password,
        });
        login(res.data.access_token);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Authentication failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-desco-900 text-gray-100 font-sans">
      <div className="bg-desco-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-desco-accent tracking-wider">
            RiskSentinel
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            {isLogin ? "Authorized Personnel Only" : "Create Analyst Account"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              className="w-full bg-desco-900 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-desco-accent focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              className="w-full bg-desco-900 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-desco-accent focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-desco-accent hover:bg-blue-600 rounded-lg font-bold transition-all shadow-lg shadow-blue-900/20"
          >
            {isLogin ? "ACCESS TERMINAL" : "REGISTER ACCOUNT"}
          </button>
        </form>

        {/* Toggle Link */}
        <div className="mt-6 text-center text-sm">
          <span className="text-gray-500">
            {isLogin ? "New analyst? " : "Already have access? "}
          </span>
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-desco-accent hover:underline font-medium"
          >
            {isLogin ? "Initialize Protocol" : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}
