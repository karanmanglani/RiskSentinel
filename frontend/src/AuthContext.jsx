import { createContext, useState, useEffect, useContext } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("riskSentinelToken"));

  // Function to handle Login Success
  const login = (newToken) => {
    localStorage.setItem("riskSentinelToken", newToken);
    setToken(newToken);
  };

  // Function to handle Logout
  const logout = () => {
    localStorage.removeItem("riskSentinelToken");
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
