import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../../pages/config/axiosInstance";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    try {
      const cached = localStorage.getItem("user");
      if (cached && !user) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed._id) {
          setUser(parsed);
          try {
            window.__authGraceUntil = Date.now() + 3000;
          } catch (e) { void e; }
        }
      }
    } catch (e) { void e; }
  }, []);
  const logout = async () => {
    setUser(null);
    try {
      await api.post("/api/auth/logout");
    } catch (e) { void e; }
  };

  const fetchUser = async () => {
    try {
      const res = await api.get("/api/auth/me");
      setUser(res.data.user);
    } catch (e) {
      void e;
    } finally {
      setLoading(false);
    }
  };
  const refreshUser = async () => {
  try {
    const res = await api.get("/api/auth/me", { withCredentials: true });
    setUser(res.data.user);
  } catch (e) {
    console.error("Failed to refresh user");
  }
};


  useEffect(() => {
    const path = window.location.pathname;

    // 🚫 Never check auth during auth flows
    const skipPaths = [
      "/login",
      "/signin",
      "/otp",
      "/forgot-password",
      "/reset-password",
    ];

    if (skipPaths.includes(path)) {
      setLoading(false);
      setAuthReady(true);
      return;
    }

    // ✅ If user already exists (OTP just set it), skip /me
    if (user) {
      setLoading(false);
      setAuthReady(true);
      return;
    }

    fetchUser().finally(() => {
      setAuthReady(true);
    });
  }, [user]);
  
  useEffect(() => {
    if (user) {
      try {
        window.__authGraceUntil = Date.now() + 3000;
      } catch (e) { void e; }
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, authReady, logout,refreshUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
