import { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

// --- ICONS (Simple SVGs) ---
const SendIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
);
const RobotIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
);
const FileIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
);

function App() {
  // --- STATE MANAGEMENT ---
  // input: The text currently being typed
  const [input, setInput] = useState('');
  
  // messages: The chat history array (User + AI)
  const [messages, setMessages] = useState([
    { role: 'system', content: 'RiskSentinel Active. Ready to analyze 10-K Reports.' }
  ]);
  
  // loading: UI state to show the spinner while waiting for Python
  const [loading, setLoading] = useState(false);

  // --- API HANDLER ---
  const handleSend = async () => {
    if (!input.trim()) return;

    // 1. Add User Message immediately to UI (Optimistic UI)
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput(''); // Clear input box
    setLoading(true);

    try {
      // 2. Call the Backend (The Bridge)
      // We assume backend is running on port 8000
      const response = await axios.post('http://127.0.0.1:8000/api/analyze', {
        question: userMessage.content
      });

      // 3. Add AI Response to UI
      const aiMessage = { role: 'assistant', content: response.data.answer };
      setMessages(prev => [...prev, aiMessage]);
      
    } catch (error) {
      console.error("Connection Error:", error);
      const errorMessage = { 
        role: 'system', 
        content: `❌ Error: ${error.response ? error.response.data.detail : "Backend unreachable"}` 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-desco-900 text-gray-100 font-sans overflow-hidden">
      
      {/* --- SIDEBAR (Context & Tools) --- */}
      <div className="w-64 bg-desco-800 border-r border-gray-700 hidden md:flex flex-col">
        <div className="p-4 border-b border-gray-700 font-bold text-xl tracking-wider text-desco-accent">
          RiskSentinel
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Active Data Source</h3>
            <div className="flex items-center p-2 bg-gray-700/50 rounded border border-gray-600">
              <FileIcon />
              <div className="ml-3">
                <p className="text-sm font-medium text-white">apple_10k.pdf</p>
                <p className="text-xs text-green-400">● Vector DB Indexed</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">System Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">LLM Engine</span>
                <span className="text-green-400">Qwen 2.5</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Latency</span>
                <span className="text-yellow-400">~800ms</span>
              </div>
            </div>
          </div>
        </div>

        
      </div>

      {/* --- MAIN CHAT AREA --- */}
      <div className="flex-1 flex flex-col relative">
        
        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg p-4 shadow-lg ${
                msg.role === 'user' 
                  ? 'bg-desco-accent text-white rounded-br-none' 
                  : msg.role === 'system'
                  ? 'bg-red-900/50 border border-red-700 text-red-200'
                  : 'bg-desco-800 border border-gray-700 text-gray-100 rounded-bl-none'
              }`}>
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2 text-desco-accent border-b border-gray-700 pb-1">
                    <RobotIcon />
                    <span className="text-xs font-bold uppercase">Risk Analyst Agent</span>
                  </div>
                )}
                {/* Use whitespace-pre-wrap to handle newlines from Python correctly */}
                <div className="text-sm leading-relaxed">
                  <ReactMarkdown
                    components={{
                      // Style Bold text
                      strong: ({node, ...props}) => <span className="font-bold text-desco-accent" {...props} />,
                      // Style Unordered Lists (Bullets)
                      ul: ({node, ...props}) => <ul className="list-disc pl-5 my-2 space-y-1" {...props} />,
                      // Style Ordered Lists (Numbers)
                      ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-2 space-y-1" {...props} />,
                      // Style List Items
                      li: ({node, ...props}) => <li className="pl-1" {...props} />,
                      // Style Headers
                      h1: ({node, ...props}) => <h1 className="text-lg font-bold my-2" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-base font-bold my-2" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-sm font-bold my-1" {...props} />,
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
                 <span className="text-xs text-gray-400 ml-2">Reasoning...</span>
               </div>
             </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-desco-900 border-t border-gray-700">
          <div className="max-w-4xl mx-auto relative flex items-center">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about risk factors (e.g., 'What are the main forex risks?')..."
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

export default App;