import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { GoogleOAuthProvider } from "@react-oauth/google"; // <--- Import this

// REPLACE WITH YOUR ACTUAL CLIENT ID
const GOOGLE_CLIENT_ID =
  "326829570192-gf6boa8bms63jcg4atn3iapdcqjapmdu.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>,
);
