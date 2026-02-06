// import React, { useMemo, useContext, useEffect, useRef, useState, navCategoryName, navCategorySlug, handleNavCategoryNameChange, handleNavSlugChange, submitNavbarCategory, navCatErrors } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import {
//   TbBell,
//   TbCirclePlus,
//   TbCommand,
//   TbDeviceLaptop,
//   TbDotsVertical,
//   TbFileText,
//   TbLanguage,
//   TbLogout,
//   TbMail,
//   TbMaximize,
//   TbSearch,
//   TbSettings,
//   TbUserCircle,
//   TbListDetails,
// } from "react-icons/tb";
// import { GoPackage } from "react-icons/go";
// import UsFlag from "../../../assets/img/flags/us-flag.svg";
// import English from "../../../assets/img/flags/english.svg";
// import Arabic from "../../../assets/img/flags/arabic.svg";
// import Hindi from "../../../assets/img/flags/indian-flag.svg";
// import Logo from "../../../assets/img/logo/munclogotm.png";
// import { useSidebar } from "../../../Context/sidetoggle/SidebarContext";
// import { AiOutlineMenuFold, AiOutlineMenuUnfold } from "react-icons/ai";
// import axios from "axios";
// import BASE_URL from "../../../pages/config/config";
// import Profile from "../../../assets/img/profile.jpeg";
// import { LanguageContext } from "../../../Context/Language/LanguageContext";
// import { useTranslation } from "react-i18next";
// import Activities from "./activities";
// import { useSocket } from "../../../Context/SocketContext";
// import { toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import { io } from "socket.io-client";
// import { useAuth } from "../../auth/AuthContext";
// import { useInbox } from "../../../components/features/Mail/SideBar/InboxContext";
// import { getMenuData } from "../Sidebar/MenuData.jsx";
// import CategoryModal from "../../../pages/Modal/categoryModals/CategoryModal.jsx";
// import api from "../../../pages/config/axiosInstance.js"



// function Navbar() {
//   const { user: authUser, logout } = useAuth();
//   console.log("userssaasas", authUser)
//   const { inboxCount, fetchInboxCount } = useInbox();
//   // state for company logo
//   const [companyImages, setCompanyImages] = useState(null);
//   const [isDarkMode, setIsDarkMode] = useState(false);
//   // const userData = JSON.parse(localStorage.getItem("user"));
//   const userData = authUser;
//   // const { language, switchLanguage } = useContext(LanguageContext);
//   const mobileBtnRef = useRef(null);
//   const fullscreenBtnRef = useRef(null);
//   const toggleBtnRef = useRef(null);
//   const { mobileOpen, handleMobileToggle } = useSidebar();
//   const id = authUser?._id;

//   // user profile
//   const [user, setUser] = useState(null);
//   const [notificationCount, setNotificationCount] = useState(0);
//   // const userObj = JSON.parse(localStorage.getItem("user"));
//   // const userId = userObj?.id || userObj?._id; // Handle both id and _id
//   // const token = localStorage.getItem("token");
//   const userObj = authUser;
//   const userId = authUser?._id
//   const { connectSocket, getSocket } = useSocket();




//   // console.log("User ID:", userId);
//   // console.log("Token:", token);
//   // console.log("User Object:", userObj);
//   // console.log("User Data:", user);

//   // Fetch notification count
//   const fetchNotificationCount = async () => {
//     try {
//       // if (!userId || !token) return;
//       if (!userId) return;

//       // console.log('🔔 Fetching notification count for user:', userId);

//       const res = await api.get(
//         `/api/notifications/unread/${userId}`,
//         {
//           withCredentials: true
//         },
//         setNotificationCount(res.data.count || 0));
//     } catch (error) {
//       console.error("Error fetching notification count:", error);
//     }
//   };

//   useEffect(() => {
//     // if (!userId || !token) return;
//     if (!userId) return;

//     const fetchUser = async () => {
//       try {
//         // First try to use the user data from localStorage
//         if (userObj) {
//           setUser(userObj);
//         }

//         // Then fetch fresh data from the API
//         const response = await api.get(`/api/user/${userId}`, {
//           withCredentials: true,
//         });

//         if (response.data) {
//           setUser(response.data);
//           // Update localStorage with fresh data
//           // localStorage.setItem("user", JSON.stringify(response.data));
//         }
//       } catch (error) {
//         console.error("Error fetching user data:", error);
//         // If API call fails, use localStorage data if available
//         if (userObj && !user) {
//           setUser(userObj);
//         }
//       }
//     };

//     fetchUser();
//     fetchNotificationCount(); // Fetch notification count

//     // Initialize socket connection for real-time notifications
//     const socket = connectSocket(BASE_URL);

//     if (socket) {
//       // Register current user so server can route events correctly
//       try {
//         socket.emit("add-user", userId);
//       } catch (e) {
//         console.error("Failed to register user on socket:", e);
//       }

//       // Listen for new notifications
//       socket.on("new-notification", (notificationData) => {
//         setNotificationCount((prev) => prev + 1);
//       });
//     }

//     return () => {
//     };
//   }, [userId]);

//   const handleFullscreen = async () => {
//     try {
//       if (!document.fullscreenElement) {
//         await document.documentElement.requestFullscreen();
//         setIsFullscreen(true);
//       } else {
//         await document.exitFullscreen();
//         setIsFullscreen(false);
//       }
//     } catch (err) {
//       console.error("Fullscreen toggle failed:", err);
//     }
//   };

//   useEffect(() => {
//     const onFullscreenChange = () => {
//       setIsFullscreen(!!document.fullscreenElement);
//     };

//     document.addEventListener("fullscreenchange", onFullscreenChange);
//     return () => {
//       document.removeEventListener("fullscreenchange", onFullscreenChange);
//     };
//   }, []);

//   const navigate = useNavigate();

//   const handleLogout = async () => {
//     try {
//       await api.post("/api/auth/logout", {}, { withCredentials: true });
//       logout();
//       navigate("/login");
//     } catch (err) {
//       console.error("Logout error:", err);
//     }
//   };


//   const { t, i18n } = useTranslation();



//   const languageOptions = {
//     en: { name: t("english"), flag: English },
//     hi: { name: t("hindi"), flag: Hindi },
//     ar: { name: t("arabic"), flag: Arabic },
//   };

//   const [currentLang, setCurrentLang] = useState(i18n.language || "en");

//   const handleChangeLanguage = (lang) => {
//     i18n.changeLanguage(lang);
//     document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
//     setCurrentLang(lang);
//   };

//   // Defensive fallback for languageOptions[currentLang]
//   const langObj = languageOptions[currentLang] || languageOptions["en"];

//   // Handle unread count changes coming from Activities
//   const handleUnreadCountChange = (count) => {
//     setNotificationCount(Math.max(0, Number(count) || 0));
//   };

//   // fetch company details
//   useEffect(() => {
//     const fetchCompanyDetails = async () => {
//       try {
//         const res = await api.get("/api/companyprofile/get", {
//           withCredentials: true
//         });
//         if (res.status === 200) {
//           setCompanyImages(res.data.data);
//           // console.log("res.data", res.data.data)
//         }
//       } catch (error) {
//         toast.error("Unable to find company details", {
//           position: "top-center",
//         });
//       }
//     };
//     fetchCompanyDetails();
//   }, []);

//   useEffect(() => {
//     if (companyImages?.companyFavicon) {
//       let favicon = document.querySelector("link[rel*='icon']");
//       if (!favicon) {
//         favicon = document.createElement("link");
//         favicon.rel = "icon";
//         document.head.appendChild(favicon);
//       }
//       favicon.type = "image/png";
//       favicon.href = companyImages.companyFavicon;
//     }
//   }, [companyImages]);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       fetchInboxCount();
//     }, 5000);
//     return () => clearInterval(interval);
//   }, []);

//   //Search Box
//   const menuData = useMemo(() => getMenuData(user, t), [user, t]); // same as sidebar
//   const [searchQuery, setSearchQuery] = useState("");
//   const [searchResults, setSearchResults] = useState([]);
//   const handleSearch = (e) => {
//     const query = e.target.value;
//     setSearchQuery(query);

//     if (!query) {
//       setSearchResults([]);
//       return;
//     }

//     // Flatten menuData to get all links
//     const allLinks = [];
//     menuData.forEach((section) => {
//       section.items.forEach((item) => {
//         if (item.subItems) {
//           item.subItems.forEach((sub) => {
//             if (sub.nested) {
//               sub.nested.forEach((n) =>
//                 allLinks.push({ title: n.label, path: n.path, icon: n.icon })
//               );
//             } else {
//               allLinks.push({
//                 title: sub.label,
//                 path: sub.path,
//                 icon: sub.icon,
//               });
//             }
//           });
//         } else {
//           allLinks.push({
//             title: item.label,
//             path: item.path,
//             icon: item.icon,
//           });
//         }
//       });
//     });

//     const filtered = allLinks.filter((link) =>
//       link.title.toLowerCase().includes(query.toLowerCase())
//     );

//     setSearchResults(filtered);
//   };

//   return (
//     <div className="header">
//       <div className="main-header">
//         {companyImages ? (
//           <>
//             {/* Logo */}
//             <div className="header-left active">
//               <Link to="/home" className="logo logo-normal">
//                 <img
//                   src={
//                     isDarkMode
//                       ? companyImages.companyDarkLogo
//                       : companyImages.companyLogo
//                   }
//                   alt="company logo"
//                 />
//               </Link>
//             </div>

//             {/* Mobile Toggle */}
//             <a
//               id="mobile_btn"
//               className="mobile_btn"
//               onClick={handleMobileToggle}
//               ref={mobileBtnRef}
//             >
//               {mobileOpen ? <AiOutlineMenuFold /> : <AiOutlineMenuUnfold />}
//             </a>
//             <button
//               id="toggle_btn"
//               ref={toggleBtnRef}
//               style={{ display: "none" }}
//             ></button>

//             {/* Header Right Menu */}

//             <ul className="nav user-menu">
//               <li className="nav-item nav-searchinputs">
//                 <div className="top-nav-search">
//                   <button className="responsive-search">
//                     <TbSearch />
//                   </button>
//                   <form className="dropdown">
//                     <div
//                       className="searchinputs input-group dropdown-toggle"
//                       data-bs-toggle="dropdown"
//                       data-bs-auto-close="outside"
//                     >
//                       <input
//                         type="text"
//                         placeholder="Search"
//                         value={searchQuery}
//                         onChange={handleSearch}
//                       />
//                     </div>
//                     {searchResults.length > 0 && (
//                       <div
//                         className=""
//                         style={{
//                           backgroundColor: "white",
//                           width: "200px",
//                           minHeight: "auto ",
//                           maxHeight: "250px",
//                           overflowY: "scroll",
//                           position: "absolute",
//                           top: "50px",
//                           zIndex: "1",
//                           padding: "10px 0px",
//                           boxShadow: "rgba(149, 157, 165, 0.2) 0px 8px 24px",
//                           border: "1px solid rgb(230, 230, 230)",
//                           borderRadius: "4px",
//                         }}
//                       >
//                         {searchResults.map((result, idx) => (
//                           <div
//                             key={idx}
//                             className="dropdown-item"
//                             onClick={() => {
//                               navigate(result.path);
//                               setSearchQuery("");
//                               setSearchResults([]);
//                             }}
//                             style={{
//                               display: "flex",
//                               gap: "5px",
//                               cursor: "pointer",
//                             }}
//                           >
//                             {result.icon}
//                             {result.title}
//                           </div>
//                         ))}
//                       </div>
//                     )}
//                   </form>
//                 </div>
//               </li>
//               {/* Add New Dropdown */}
//               <li className="nav-item dropdown link-nav">
//                 <button
//                   className="btn btn-primary btn-md d-inline-flex align-items-center"
//                   data-bs-toggle="dropdown"
//                 >
//                   <TbCirclePlus className="me-1" style={{ color: "white" }} />
//                   {t("addNew")}
//                 </button>
//                 <div className="dropdown-menu dropdown-xl dropdown-menu-center">
//                   <div className="row g-2">
//                     <div className="col-md-2">
//                       <Link to="/category-list" className="link-item">
//                         <span className=" no-hover"> <TbListDetails className="ti ti-brand-codepen" /> </span>
//                         <span>{t("category")}</span>
//                       </Link>
//                     </div>
//                     <div className="col-md-2">
//                       <Link to="/add-product" className="link-item">
//                         <span className="" style={{}}>
//                           <GoPackage className="ti ti-square-plus" />
//                         </span>
//                         <p>{t("product")}</p>
//                       </Link>
//                     </div>
//                   </div>
//                 </div>
//               </li>

//               {/* POS Button */}
//               <li className="nav-item pos-nav">
//                 <Link
//                   to="/pos"
//                   className="btn btn-dark btn-md d-inline-flex align-items-center"
//                 >
//                   <TbDeviceLaptop
//                     className=" me-1"
//                     style={{ color: "white" }}
//                   />
//                   {t("pos")}
//                 </Link>
//               </li>
//               <li className="nav-item dropdown has-arrow flag-nav nav-item-box">
//                 <a
//                   className="nav-link dropdown-toggle"
//                   data-bs-toggle="dropdown"
//                 >
//                   <img
//                     src={langObj.flag}
//                     alt={langObj.name}
//                     style={{ width: "20px" }}
//                   />
//                 </a>

//                 <div className="dropdown-menu dropdown-menu-end">
//                   {Object.entries(languageOptions).map(
//                     ([code, { name, flag }]) => (
//                       <button
//                         key={code}
//                         className={`dropdown-item d-flex align-items-center ${currentLang === code ? "active" : ""
//                           }`}
//                         onClick={() => handleChangeLanguage(code)}
//                       >
//                         <img
//                           src={flag}
//                           alt={name}
//                           style={{ width: "20px", marginRight: "8px" }}
//                         />
//                         {name}
//                       </button>
//                     )
//                   )}
//                 </div>
//               </li>
//               <li className="nav-item nav-item-box">
//                 <a
//                   id="btnFullscreen"
//                   style={{ cursor: "pointer" }}
//                   onClick={handleFullscreen}
//                 >
//                   <TbMaximize />
//                 </a>
//               </li>

//               {/* Email */}
//               <li className="nav-item nav-item-box">
//                 <Link to="/mail/inbox" className="position-relative">
//                   <TbMail />
//                   {inboxCount > 0 && (
//                     <span className="badge rounded-pill">{inboxCount}</span>
//                   )}
//                 </Link>
//               </li>
//               {/* Notifications */}
//               <li className="nav-item dropdown nav-item-box">
//                 <a
//                   href="#"
//                   className="dropdown-toggle nav-link"
//                   data-bs-toggle="dropdown"
//                   onClick={(e) => e.preventDefault()}
//                 >
//                   <TbBell style={{ position: "absolute", left: "7px" }} />
//                   {notificationCount > 0 && (
//                     <span
//                       className="badge rounded-pill"
//                       style={{
//                         position: "absolute",
//                         top: "-8px",
//                         right: "-8px",
//                         backgroundColor: "red",
//                         color: "white",
//                         fontSize: "10px",
//                         minWidth: "18px",
//                         height: "18px",
//                         display: "flex",
//                         alignItems: "center",
//                         justifyContent: "center",
//                         borderRadius: "50%",
//                         border: "2px solid white",
//                         boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
//                       }}
//                     >
//                       {notificationCount > 99 ? "99+" : notificationCount}
//                     </span>
//                   )}
//                 </a>
//                 <div
//                   className="dropdown-menu notifications"
//                   style={{ border: "1px solid #E6E6E6", borderRadius: "8px" }}
//                 >
//                   <Activities onUnreadCountChange={handleUnreadCountChange} />
//                 </div>
//               </li>
//               {/* Settings */}
//               <li className="nav-item nav-item-box">
//                 <Link to={`profile/${id}`}>
//                   <TbSettings className="ti" />
//                 </Link>
//               </li>

//               {/* Profile */}
//               {userData ? (
//                 <li className="nav-item dropdown has-arrow main-drop profile-nav">
//                   <a
//                     className="nav-link userset"
//                     data-bs-toggle="dropdown"
//                     href="#"
//                   >
//                     <span className="user-info p-0">
//                       <span className="user-letter">
//                         {userData?.profileImage?.url ? (
//                           <img
//                             src={userData.profileImage?.url}
//                             alt="Profile"
//                             style={{
//                               width: "40px",
//                               height: "30px",
//                               borderRadius: "50%",
//                               objectFit: "cover",
//                             }}
//                           />
//                         ) : (
//                           <div
//                             className="bg-secondary text-white d-flex justify-content-center align-items-center"
//                             style={{
//                               width: "40px",
//                               height: "30px",
//                               borderRadius: "50%",
//                               fontSize: "14px",
//                               fontWeight: "bold",
//                             }}
//                           >
//                             {userData.name?.charAt(0)?.toUpperCase() || ""}
//                           </div>
//                         )}
//                       </span>
//                     </span>
//                   </a>
//                   <div className="dropdown-menu menu-drop-user">
//                     <div className="profileset d-flex align-items-center">
//                       <span className="user-img me-2">
//                         {userData?.profileImage?.url ? (
//                           <img
//                             src={userData.profileImage?.url}
//                             alt="Profile"
//                             style={{
//                               width: "40px",
//                               height: "40px",
//                               borderRadius: "50%",
//                               objectFit: "cover",
//                             }}
//                           />
//                         ) : (
//                           <div
//                             className="bg-secondary text-white d-flex justify-content-center align-items-center"
//                             style={{
//                               width: "40px",
//                               height: "40px",
//                               borderRadius: "50%",
//                               fontSize: "14px",
//                               fontWeight: "bold",
//                             }}
//                           >
//                             {user.name?.charAt(0)?.toUpperCase() || ""}
//                           </div>
//                         )}
//                       </span>
//                       <div>
//                         <h6 className="fw-medium" style={{ margin: "0px" }}>
//                           {user?.name}
//                         </h6>
//                         <p style={{ marginBottom: "0" }}>
//                           {user?.role?.roleName || "User"}
//                         </p>
//                       </div>
//                     </div>
//                     <Link className="dropdown-item" to={`/profile/${id}`}>
//                       <TbUserCircle className="me-2" /> {t("myProfile")}
//                     </Link>
//                     <Link
//                       onClick={handleLogout}
//                       to="/logout"
//                       className="dropdown-item logout pb-0"
//                     >
//                       <TbLogout className=" me-2" /> {t("logout")}
//                     </Link>
//                   </div>
//                 </li>
//               ) : (
//                 <li className="nav-item dropdown has-arrow main-drop profile-nav">
//                   <a
//                     className="nav-link userset"
//                     data-bs-toggle="dropdown"
//                     href="#"
//                   >
//                     <span className="user-info p-0">
//                       <span className="user-letter">
//                         <div
//                           className="bg-secondary text-white d-flex justify-content-center align-items-center"
//                           style={{
//                             width: "40px",
//                             height: "40px",
//                             borderRadius: "50%",
//                             fontSize: "14px",
//                             fontWeight: "bold",
//                           }}
//                         >
//                           {userObj?.name?.charAt(0)?.toUpperCase() || "U"}
//                         </div>
//                       </span>
//                     </span>
//                   </a>
//                   <div className="dropdown-menu menu-drop-user">
//                     <div className="profileset d-flex align-items-center">
//                       <span className="user-img me-2">
//                         <div
//                           className="bg-secondary text-white d-flex justify-content-center align-items-center"
//                           style={{
//                             width: "40px",
//                             height: "40px",
//                             borderRadius: "50%",
//                             fontSize: "14px",
//                             fontWeight: "bold",
//                           }}
//                         >
//                           {userObj?.name?.charAt(0)?.toUpperCase() || "U"}
//                         </div>
//                       </span>
//                       <div>
//                         <h6 className="fw-medium">
//                           {userObj?.name || "User"}
//                         </h6>
//                         <p>{userObj?.role?.roleName || "User"}</p>
//                       </div>
//                     </div>
//                     <Link className="dropdown-item" to="/profile">
//                       <TbUserCircle className="me-2" /> {t("myProfile")}
//                     </Link>
//                     <Link className="dropdown-item" to="/sales-report">
//                       <TbFileText className=" me-2" /> {t("reports")}
//                     </Link>
//                     <Link className="dropdown-item" to="/general-settings">
//                       <TbSettings className=" me-2" /> {t("settings")}
//                     </Link>
//                     <hr className="my-2" />
//                     <button onClick={handleLogout} className="dropdown-item logout pb-0">
//                       <TbLogout className=" me-2" /> {t("logout")}
//                     </button>
//                   </div>
//                 </li>
//               )}
//             </ul>
//           </>
//         ) : (
//           <p>No Company Logo Image</p>
//         )}
//         {/* Mobile Menu (3 dots) */}
//         <div className="dropdown mobile-user-menu">
//           <a
//             className="nav-link dropdown-toggle"
//             data-bs-toggle="dropdown"
//             href="#"
//           >
//             <TbDotsVertical />
//           </a>
//           <div className="dropdown-menu dropdown-menu-end">
//             <Link className="dropdown-item" to="/profile">
//               {t("myProfile")}
//             </Link>
//             <Link className="dropdown-item" to="/general-settings">
//               {t("settings")}
//             </Link>
//             <Link to="/logout" className="dropdown-item">
//               {t("logout")}
//             </Link>
//           </div>
//         </div>
//         {/* Navbar Add Category Modal */}
//         <CategoryModal
//           modalId="navbarCategoryModal"
//           title={t("Add Category")}
//           categoryName={navCategoryName}
//           categorySlug={navCategorySlug}
//           onCategoryChange={handleNavCategoryNameChange}
//           onSlugChange={handleNavSlugChange}
//           onSubmit={submitNavbarCategory}
//           submitLabel={t("Add Category")}
//           errors={navCatErrors}
//         />
//       </div>
//     </div>
//   );
// }

// export default Navbar;


