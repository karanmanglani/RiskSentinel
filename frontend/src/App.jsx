import { useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import Login from "./Login"; // <-- Import Login Page
import { AuthProvider, useAuth } from "./AuthContext"; // <-- Import Auth Context

// --- ICONS (Keep your existing icons here) ---
const SendIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
    />
  </svg>
);
const RobotIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);
const FileIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);
const LogoutIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
    />
  </svg>
);

function Dashboard() {
  // This is your ORIGINAL 'App' component logic, moved inside here.
  const { token, logout } = useAuth(); // Get token from Context
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "system", content: "RiskSentinel Active. Identity Verified." },
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // --- AUTH HEADER INJECTION ---
      // We must attach the token to the request
      const response = await axios.post(
        "http://127.0.0.1:8000/api/analyze",
        { question: userMessage.content },
        { headers: { Authorization: `Bearer ${token}` } }, // <--- THE KEY
      );

      const aiMessage = { role: "assistant", content: response.data.answer };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);
      // If error is 401 (Unauthorized), force logout
      if (error.response && error.response.status === 401) {
        logout();
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "system", content: "❌ Connection Error" },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-desco-900 text-gray-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-desco-800 border-r border-gray-700 hidden md:flex flex-col">
        <div className="p-4 border-b border-gray-700 font-bold text-xl tracking-wider text-desco-accent">
          RiskSentinel
        </div>

        {/* ... (Your existing sidebar content) ... */}
        <div className="p-4 flex-1">
          <div className="flex items-center p-2 bg-gray-700/50 rounded border border-gray-600">
            <FileIcon />
            <div className="ml-3">
              <p className="text-sm font-medium text-white">apple_10k.pdf</p>
              <p className="text-xs text-green-400">● Vector DB Indexed</p>
            </div>
          </div>
        </div>

        {/* LOGOUT BUTTON */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={logout}
            className="flex items-center text-red-400 hover:text-red-300 transition-colors w-full"
          >
            <LogoutIcon />
            <span className="ml-2 text-sm font-bold">Terminate Session</span>
          </button>
        </div>
      </div>

      {/* Main Chat (Same as before) */}
      <div className="flex-1 flex flex-col relative">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 shadow-lg ${
                  msg.role === "user"
                    ? "bg-desco-accent text-white rounded-br-none"
                    : msg.role === "system"
                      ? "bg-red-900/50 border border-red-700 text-red-200"
                      : "bg-desco-800 border border-gray-700 text-gray-100 rounded-bl-none"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-2 mb-2 text-desco-accent border-b border-gray-700 pb-1">
                    <RobotIcon />
                    <span className="text-xs font-bold uppercase">
                      Risk Analyst Agent
                    </span>
                  </div>
                )}
                <div className="text-sm leading-relaxed">
                  <ReactMarkdown
                    components={{
                      strong: ({ node, ...props }) => (
                        <span
                          className="font-bold text-desco-accent"
                          {...props}
                        />
                      ),
                      ul: ({ node, ...props }) => (
                        <ul
                          className="list-disc pl-5 my-2 space-y-1"
                          {...props}
                        />
                      ),
                      ol: ({ node, ...props }) => (
                        <ol
                          className="list-decimal pl-5 my-2 space-y-1"
                          {...props}
                        />
                      ),
                      li: ({ node, ...props }) => (
                        <li className="pl-1" {...props} />
                      ),
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-desco-800 rounded-lg p-4 flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-150"></div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-desco-900 border-t border-gray-700">
          <div className="max-w-4xl mx-auto relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask about risk factors..."
              className="w-full bg-desco-800 text-white placeholder-gray-500 rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-desco-accent border border-gray-700 shadow-xl"
            />
            <button
              onClick={handleSend}
              disabled={loading}
              className="absolute right-2 p-2 bg-desco-accent text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              <SendIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- THE ROOT COMPONENT ---
// This decides: "Do I show the Login Page or the Dashboard?"
function Root() {
  const { token } = useAuth();
  return token ? <Dashboard /> : <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}
