import React,{useEffect,useState,createContext } from "react";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./router/AppRoutes";
import LanguageSwitcher from "./utils/LanguageSwitch/LanguageSwitcher";
import "./i18n"; // Import i18n config
import { InboxProvider } from "./components/features/Mail/SideBar/InboxContext";
import { ToastContainer } from "react-toastify";
import api from "./pages/config/axiosInstance";

export const AppRefreshContext = createContext();
const App = () => {
    const [refreshKey, setRefreshKey] = useState(0);

  const refreshApp = () => {
    setRefreshKey(prev => prev + 1);
  };
    const [favicon, setFavicon] = useState(null);
 useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await api.get("/api/companyprofile/get", {
          withCredentials: true,
        });

        if (res.data?.data?.companyFavicon) {
          setFavicon(res.data.data.companyFavicon);
        }
      } catch (err) {
        console.error("Failed to load favicon");
      }
    };

    fetchCompany();
  }, []);

  // 🔥 GLOBAL FAVICON EFFECT
  useEffect(() => {
    let link = document.querySelector("link[rel='icon']");

    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }

    if (favicon) {
      link.href = favicon + "?v=" + Date.now(); // cache bust
    } else {
      link.remove(); // 🔥 favicon remove if null
    }

    // Cleanup when App unmounts
    return () => {
      link?.remove();
    };
  }, [favicon]);

   useEffect(() => {
    const title = localStorage.getItem("companyTitle") || "IMS";
    document.title = title;
  }, []);
  return (
  <AppRefreshContext.Provider value={{ refreshKey, refreshApp }}>
    <BrowserRouter>
      {/* <LanguageSwitcher /> */}
      <InboxProvider>
        <ToastContainer />
        <AppRoutes key={refreshKey} />
      </InboxProvider>
      </BrowserRouter>
      </AppRefreshContext.Provider>
  );
};

export default App;
