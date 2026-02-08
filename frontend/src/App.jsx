import { useState, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import Login from "./Login";
import { AuthProvider, useAuth } from "./AuthContext";

// --- ICONS ---
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
const PlusIcon = () => (
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
      d="M12 4v16m8-8H4"
    />
  </svg>
);
const CloseIcon = () => (
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
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

function Dashboard() {
  const { token, logout } = useAuth();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "system", content: "Connecting to Secure Archives..." },
  ]);
  const [loading, setLoading] = useState(false);

  // --- NEW: INGESTION STATE ---
  const [showModal, setShowModal] = useState(false);
  const [ticker, setTicker] = useState("");
  const [ingesting, setIngesting] = useState(false);
  const [files, setFiles] = useState(["apple_10k.pdf"]); // Local list of "Active" files

  // 1. Load History on Mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/api/history", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.length > 0) setMessages(res.data);
        else
          setMessages([
            {
              role: "system",
              content: "RiskSentinel Active. Ready for analysis.",
            },
          ]);
      } catch (error) {
        if (error.response?.status === 401) logout();
      }
    };
    fetchHistory();
  }, [token]);

  // 2. Handle Message Send
  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/analyze",
        { question: userMessage.content },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const aiMessage = { role: "assistant", content: response.data.answer };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      if (error.response?.status === 401) logout();
      else
        setMessages((prev) => [
          ...prev,
          { role: "system", content: "❌ Connection Error" },
        ]);
    } finally {
      setLoading(false);
    }
  };

  // 3. NEW: Handle Ticker Ingestion
  const handleIngest = async () => {
    if (!ticker) return;
    setIngesting(true);

    try {
      // Call our new Endpoint
      await axios.post(
        "http://127.0.0.1:8000/api/ingest",
        { ticker: ticker },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      // Update UI
      setFiles((prev) => [...prev, `${ticker.toUpperCase()} 10-K`]);
      setShowModal(false);
      setTicker("");
      alert(
        `Successfully ingested ${ticker.toUpperCase()}! You can now ask questions about it.`,
      );
    } catch (error) {
      console.error(error);
      alert("Failed to download 10-K. Check the ticker symbol.");
    } finally {
      setIngesting(false);
    }
  };

  return (
    <div className="flex h-screen bg-desco-900 text-gray-100 font-sans overflow-hidden relative">
      {/* --- SIDEBAR --- */}
      <div className="w-64 bg-desco-800 border-r border-gray-700 hidden md:flex flex-col">
        <div className="p-4 border-b border-gray-700 font-bold text-xl tracking-wider text-desco-accent">
          RiskSentinel
        </div>

        {/* File List */}
        <div className="p-4 flex-1 space-y-2 overflow-y-auto">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Knowledge Base
          </div>
          {files.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center p-2 bg-gray-700/30 hover:bg-gray-700/50 rounded border border-gray-600/50 transition-colors cursor-pointer"
            >
              <FileIcon />
              <div className="ml-3 truncate">
                <p className="text-sm font-medium text-gray-200">{file}</p>
                <p className="text-[10px] text-green-400">● Indexed</p>
              </div>
            </div>
          ))}

          {/* ADD BUTTON */}
          <button
            onClick={() => setShowModal(true)}
            className="w-full mt-4 flex items-center justify-center p-2 border border-dashed border-gray-500 rounded text-gray-400 hover:text-white hover:border-gray-300 transition-all"
          >
            <PlusIcon />
            <span className="ml-2 text-sm">Add Company</span>
          </button>
        </div>

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

      {/* --- MAIN CHAT --- */}
      <div className="flex-1 flex flex-col relative bg-desco-900">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-lg p-4 shadow-lg ${
                  msg.role === "user"
                    ? "bg-desco-accent text-white rounded-br-none"
                    : msg.role === "system"
                      ? "bg-red-900/20 border border-red-900 text-red-200"
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
                      p: ({ node, ...props }) => (
                        <p className="mb-2 last:mb-0" {...props} />
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
            <div className="flex justify-start animate-pulse">
              <div className="bg-desco-800 rounded-lg p-3 flex items-center gap-2 border border-gray-700">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-xs text-gray-400">
                  Analyzing Financial Data...
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-desco-900 border-t border-gray-800">
          <div className="max-w-4xl mx-auto relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask about risk factors, liquidity, or market competition..."
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

      {/* --- MODAL OVERLAY --- */}
      {showModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-desco-800 border border-gray-600 rounded-xl p-6 w-96 shadow-2xl transform transition-all scale-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">
                Add Financial Data
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <CloseIcon />
              </button>
            </div>

            <p className="text-sm text-gray-400 mb-4">
              Enter a ticker symbol (e.g., TSLA, NVDA) to automatically fetch
              and ingest the latest 10-K filing from SEC.gov.
            </p>

            <input
              type="text"
              placeholder="Ticker Symbol (e.g. AAPL)"
              className="w-full bg-desco-900 border border-gray-600 rounded-lg px-4 py-2 mb-4 text-white focus:ring-2 focus:ring-desco-accent uppercase"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleIngest}
                disabled={ingesting}
                className="px-4 py-2 bg-desco-accent hover:bg-blue-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50"
              >
                {ingesting ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Downloading...
                  </>
                ) : (
                  "Ingest Data"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ... Root and App components stay the same as before
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
