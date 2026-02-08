import { useState } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";
import { GoogleLogin } from "@react-oauth/google"; // <--- Import Button

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();

  // --- STANDARD LOGIN ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (isLogin) {
        const formData = new FormData();
        formData.append("username", email);
        formData.append("password", password);
        const res = await axios.post("http://127.0.0.1:8000/token", formData);
        login(res.data.access_token);
      } else {
        const res = await axios.post("http://127.0.0.1:8000/register", {
          email: email,
          password: password,
        });
        login(res.data.access_token);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Authentication failed");
    }
  };

  // --- GOOGLE LOGIN ---
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      // 1. Get the ID Token from Google
      const googleToken = credentialResponse.credential;

      // 2. Send it to OUR Backend
      const res = await axios.post("http://127.0.0.1:8000/auth/google", {
        token: googleToken,
      });

      // 3. Log user in with OUR token
      login(res.data.access_token);
    } catch (err) {
      console.error("Google Login Failed", err);
      setError("Google Sign-In failed on server");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-desco-900 text-gray-100 font-sans">
      <div className="bg-desco-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-desco-accent tracking-wider">
            RiskSentinel
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            {isLogin ? "Authorized Personnel Only" : "Create Analyst Account"}
          </p>
        </div>

        {/* --- GOOGLE BUTTON (Top of Form) --- */}
        <div className="flex justify-center mb-6">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError("Google Login Failed")}
            theme="filled_black"
            shape="pill"
            text="continue_with"
          />
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-desco-800 text-gray-400">
              Or use email
            </span>
          </div>
        </div>

        {/* --- EXISTING FORM --- */}
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
