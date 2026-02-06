import React, { useState, useEffect, useContext } from "react";
import "../../styles/sidebar.css";
import munc_logo from "../../assets/images/munc-logo.png";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { IoIosArrowDown } from "react-icons/io";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";
import UserId from "../../assets/images/user-logo.png";
import all_p from "../../assets/images/allp-icon.png";
import cat_icon from "../../assets/images/cat-icon.png";
import exp_icon from "../../assets/images/exp-icon.png";
import dam_icon from "../../assets/images/dam-icon.png";
import low_icon from "../../assets/images/low-icon.png";
import cus_icon from "../../assets/images/cus-icon.png";
import dues_icon from "../../assets/images/over-icon.png";
import "../../styles/Responsive.css";
import { FaAnglesLeft } from "react-icons/fa6";
import { useAuth } from "../../components/auth/AuthContext";
import { IoLogOutOutline } from "react-icons/io5";
import api from "../../pages/config/axiosInstance"
import { read } from "xlsx";
import { RxCross2 } from "react-icons/rx";
import creater_logo from "../../assets/images/munc-logo.png";

//icons
import { RiDashboardHorizontalLine } from "react-icons/ri";
import { LuMail } from "react-icons/lu";
import { SiWhatsapp } from "react-icons/si";
import { LuMessagesSquare } from "react-icons/lu";
import { LuBoxes } from "react-icons/lu";
import { LuShapes } from "react-icons/lu";
import { LuBiohazard } from "react-icons/lu";
import { LuDiamondMinus } from "react-icons/lu";
import { LuCombine } from "react-icons/lu";
import { LuPrinter } from "react-icons/lu";
import { LuUsers } from "react-icons/lu";
import { LuClipboardList } from "react-icons/lu";
import { LuShoppingBag } from "react-icons/lu";
import { LuScrollText } from "react-icons/lu";
import { LuPackageCheck } from "react-icons/lu";
import { LuNotebookPen } from "react-icons/lu";
import { LuNotepadText } from "react-icons/lu";
import { LuReceiptIndianRupee } from "react-icons/lu";
import { LuFileInput } from "react-icons/lu";
import { LuFileCheck2 } from "react-icons/lu";
import { LuFileBox } from "react-icons/lu";
import { RiFileUserLine } from "react-icons/ri";
import { LuFileX2 } from "react-icons/lu";
import { LuFileChartPie } from "react-icons/lu";
import { LuFileClock } from "react-icons/lu";

const Sidebar = () => {
  const { user: authUser, logout } = useAuth();
  const userData = authUser;
  // console.log("usersrs", userData);
  const [loginPop, setloginPop] = useState(false)
  const [users, setUser] = useState(null);
  const userObj = authUser;
  const userId = authUser?._id
  const { user } = useAuth();
  // const [isDarkMode, setIsDarkMode] = useState(false);
  // const [companyImages, setCompanyImages] = useState(null);
  // fetch company details
  // useEffect(() => {
  //   const fetchCompanyDetails = async () => {
  //     try {
  //       const res = await api.get("/api/companyprofile/get", {
  //         withCredentials: true
  //       });
  //       if (res.status === 200) {
  //         setCompanyImages(res.data.data);
  //         // console.log("res.data", res.data.data)
  //       }
  //     } catch (error) {
  //       toast.error("Unable to find company details", {
  //         position: "top-center",
  //       });
  //     }
  //   };
  //   fetchCompanyDetails();
  // });

  // useEffect(() => {
  //   if (companyImages?.companyFavicon) {
  //     let favicon = document.querySelector("link[rel*='icon']");
  //     if (!favicon) {
  //       favicon = document.createElement("link");
  //       favicon.rel = "icon";
  //       document.head.appendChild(favicon);
  //     }
  //     favicon.type = "image/png";
  //     favicon.href = companyImages.companyFavicon;
  //   }
  // }, [companyImages]);

  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post("/api/auth/logout", {}, { withCredentials: true });
      logout();
      navigate("/login");
    } catch (err) {
      // console.error("Logout error:", err);
    }
  };

  useEffect(() => {
    // if (!userId || !token) return;
    if (!userId) return;

    const fetchUser = async () => {
      try {
        // First try to use the user data from localStorage
        if (userObj) {
          setUser(userObj);
        }

        // Then fetch fresh data from the API
        const response = await api.get(`/api/user/${userId}`, {
          withCredentials: true,
        });

        if (response.data) {
          setUser(response.data);
          // Update localStorage with fresh data
          // localStorage.setItem("user", JSON.stringify(response.data));
        }
      } catch (error) {
        // console.error("Error fetching user data:", error);
        // If API call fails, use localStorage data if available
        if (userObj && !user) {
          setUser(userObj);
        }
      }
    };

    fetchUser();
  })

  // const permissions = user?.role?.modulePermissions || {};
  if (!user) return null;

  const id = user?._id || user?.id;
  const permissions = user?.role?.modulePermissions || {};

  const canAccess = (module, action = "read") => {
    // ✅ Admin bypass: full access - check roleName instead of name
    if (user?.role?.roleName?.toLowerCase() === "admin") return true;

    // If no permissions or module not defined → deny
    if (!permissions || !permissions[module]) {
      // console.warn(`Module "${module}" not found in permissions for user ${user?.name}`);
      return false;
    }

    const modulePerms = permissions[module];

    // ✅ Allow only if all:true or specific action:true
    return modulePerms?.all === true || modulePerms?.[action] === true;
  };

  const [openDropdown, setOpenDropdown] = useState(null);
  const handleToggle = (name) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  // Close button handler
  const handleSidebarClose = () => {
    const sidebar = document.querySelector(".sidebarmenu-container");
    sidebar?.classList.remove("sidebar-active");
    setSidebarActive(false);
  };

  const hasInventoryAccess =
    canAccess("AddProduct", "read") ||
    canAccess("Product", "read") ||
    canAccess("Brand", "read") ||
    canAccess("Category", "read") ||
    canAccess("DamageRecord", "read") ||
    canAccess("LowStocks", "read") ||
    canAccess("HSN", "read") ||
    canAccess("Barcode", "read");

  const hasMainAccess =
    canAccess("Dashboard", "read")
  // canAccess("POS", "read")

  const hasConnectAccess =
    canAccess("Whatsapp", "read") ||
    canAccess("Chat", "read") ||
    canAccess("Mail", "read")

  const hasCustomerAccess =
    canAccess("Customer", "read") ||
    canAccess("DuesAdvance", "read")

  const hasSuppliersAccess =
    canAccess("Supplier", "read")

  const hasPurachseOrderAccess =
    canAccess("Purchase", "read") ||
    canAccess("DebitNote", "read")

  const hasSalesOrderAccess =
    canAccess("Sales", "read") ||
    canAccess("Invoices", "read") ||
    canAccess("Quotation", "read") ||
    canAccess("CreditNote", "read")

  const hasMyOnlineStoreAcess =
    canAccess("MyOnlineStore", "read")

  // const hasWarehouseAccess =
  //   canAccess("Warehouse", "read") ||
  //   canAccess("StockMovementLog", "read") 

  const hasExpensesAccess =
    canAccess("ExpenseReport", "read")

  const hasPointRewardsAccess =
    canAccess("PointsRewards", "read")

  const hasRepostrsacces =
    canAccess("SalesReport", "read") ||
    canAccess("PurchaseReport", "read") ||
    canAccess("InventoryReport", "read") ||
    canAccess("SupplierReport", "read") ||
    canAccess("DamageReport", "read") ||
    canAccess("CreditDebitNoteReport", "read") ||
    canAccess("OverdueReport", "read")

  const hasSettingsAccess =
    canAccess("Settings", read)

  // const stopToggle = (e) => {
  //   e.stopPropagation();
  // };

  const location = useLocation();

  const routeDropdownMap = {
    "/dashboard": "main",

    "/whatsapp": "connect",
    "/chat": "connect",
    "/mail": "connect",

    "/product": "inventory",
    "/brand-list": "inventory",
    "/category-list": "inventory",
    "/damage-return": "inventory",
    "/low-stocks": "inventory",
    "/hsn": "inventory",
    "/barcode": "inventory",

    "/customers": "customers",
    "/customerdueadvance": "customers",

    "/supplier-list": "suppliers",

    "/purchase-list": "purchase",
    "/debit-note": "purchase",

    "/online-orders": "sales",
    "/invoice": "sales",
    "/quotation": "sales",
    "/creditnotelist": "sales",

    // "/warehouse":"warehouse",
    // "/stock-movement-log":"warehouse",

    "/expense-report": "Expenses",

    "/sales-report": "reports",
    "/purchase-report": "reports",
    "/inventory-report": "reports",
    "/supplier-report": "reports",
    "/return-damage-report": "reports",
    "/credit&debit-note": "reports",
    "/overdue-report": "reports",

    "/users": "Users Role & Management",

    "/settings": "settings",
  };

  useEffect(() => {
    const currentPath = location.pathname;

    const matchedDropdown = Object.keys(routeDropdownMap).find((path) =>
      currentPath.startsWith(path)
    );

    if (matchedDropdown) {
      setOpenDropdown(routeDropdownMap[matchedDropdown]);
    }
  }, [location.pathname]);

  return (
    <div>
      <div
        id="sidebarMenu"
        className="sidebarmenu-container"
        style={{
          width: "235px",
          height: "100vh",
          backgroundColor: "white",
          padding: "16px 16px 16px 16px",
          zIndex: "11"
        }}
      >
        {/* Close Button */}
        <div
          className="close-btn"
          onClick={handleSidebarClose}
          style={{
            position: "absolute",
            right: "-20px",
            top: "50px",
            backgroundColor: "rgb(185 212 228)",
            borderRadius: "50px",
            padding: "5px",
            width: "35px",
            height: "35px",
            // display: "flex",
            alignItems: "center",
            justifyContent: "center",
            display: "none",
          }}
        >
          <FaAnglesLeft className="close-icon" size={22} color="#52adfa" />
        </div>

        {/* {companyImages && ( */}
        <div className="sidebar-logoss d-flex justify-content-center" style={{ display: "flex", justifyContent: "center" }}>
          <img
            src={creater_logo}
            alt="company-logo"
            style={{ objectFit: "contain", maxHeight: "30px", width: "100%", }}
          />
        </div>
        {/* )} */}

        {/* Siebar Menu Link */}
        <div className="sidebar-menu-link" >
          {/* Main  */}
          {hasMainAccess && (
            <ul className="sidebarmenu">
              <hr style={{ height: "1px", color: "#979797ff" }} />

              <li
                className="user-role-li"
                style={{ fontSize: "10px", paddingBottom: "5px" }}
              >
                <NavLink
                  className="sidebarmenu-title"
                  to="dashboard"
                  style={{
                    fontSize: "15px",
                    textDecoration: "none",
                    color: "black",
                  }}
                >
                  Dashboard
                </NavLink>
              </li>
              <hr style={{ height: "1px", color: "#979797ff" }} />
            </ul>
          )}

          {/* Connect */}
          {hasConnectAccess && (
            <ul className="sidebarmenu" style={{ paddingBottom: "18px" }}>
              <li className="sidebarmenu-item">
                <div
                  onClick={() => handleToggle("connect")}
                  className="sidebarmenu-title"
                  style={{ color: "black", fontSize: "14px" }}
                >
                  <span>Connect</span>
                  <MdOutlineKeyboardArrowRight
                    size={14}
                    // className={`dropdown-icon ${openDropdown === "connect" ? "rotate" : ""}`}
                    style={{ transform: openDropdown === "connect" ? 'rotate(90deg)' : "" }}
                  />
                </div>

                {/* Dropdown items */}
                <ul
                  className={`dropdown ${openDropdown === "connect" ? "open" : ""
                    }`}
                >{canAccess("Mail", "read") && (
                  <li>
                    <NavLink to="/mail/inbox">
                      <LuMail className="fs-6" />
                      Mail
                    </NavLink>
                  </li>
                )}
                  {canAccess("Whatsapp", "read") && (
                    <li>
                      <NavLink to="whatsapp">
                        <SiWhatsapp className="fs-6" />
                        Whats App
                      </NavLink>
                    </li>
                  )}
                  {canAccess("Chat", "read") && (
                    <li>
                      <NavLink to="/chat">
                        <LuMessagesSquare className="fs-6" />
                        Chat
                      </NavLink>
                    </li>
                  )}
                </ul>
              </li>
            </ul>
          )}

          {/* Inventory */}
          {hasInventoryAccess && (
            <ul className="sidebarmenu" style={{ paddingBottom: "18px" }}>
              <li className="sidebarmenu-item">
                <div
                  onClick={() => handleToggle("inventory")}
                  className="sidebarmenu-title"
                  style={{ color: "black", fontSize: "14px" }}
                >
                  <span>Inventory</span>
                  <MdOutlineKeyboardArrowRight
                    size={14}
                    // className={`dropdown-icon ${openDropdown === "inventory" ? "rotate" : ""}`}
                    style={{ transform: openDropdown === "inventory" ? 'rotate(90deg)' : "" }}
                  />
                </div>

                {/* Dropdown items */}
                <ul className={`dropdown ${openDropdown === "inventory" ? "open" : ""
                  }`}>
                  {canAccess("Product", "read") && (
                    <li>
                      <NavLink to="product">
                        <LuBoxes className="fs-6" />
                        All Products
                      </NavLink>
                    </li>
                  )}
                  {canAccess("Brand", "read") && (
                    <li>
                      <NavLink to="brand-list">
                        <LuShapes className="fs-6" />
                        Brand
                      </NavLink>
                    </li>
                  )}
                  {canAccess("Category", "read") && (
                    <li>
                      <NavLink to="category-list">
                        <LuShapes className="fs-6" />
                        Category
                      </NavLink>
                    </li>
                  )}
                  {canAccess("DamageRecord", "read") && (
                    <li>
                      <NavLink to="damage-record">
                        <LuBiohazard className="fs-6" />
                        Damage Record
                      </NavLink>
                    </li>
                  )}
                  {canAccess("LowStocks", "read") && (
                    <li>
                      <NavLink to="low-stocks">
                        <LuDiamondMinus className="fs-6" />
                        Low Stocks
                      </NavLink>
                    </li>
                  )}
                  {canAccess("HSN", "read") && (
                    <li>
                      <NavLink to="hsn">
                        <LuCombine className="fs-6" />
                        HSN
                      </NavLink>
                    </li>
                  )}
                  {canAccess("Barcode", "read") && (
                    <li>
                      <NavLink to="barcode">
                        <LuPrinter className="fs-6" />
                        Print Barcode
                      </NavLink>
                    </li>
                  )}
                </ul>
              </li>
              {/* <hr style={{height:"1px", color:"#979797ff"}}/> */}
            </ul>
          )}

          {/* Customers */}
          {hasCustomerAccess && (
            <ul className="sidebarmenu" style={{ paddingBottom: "18px" }}>
              <li className="sidebarmenu-item">
                <div
                  onClick={() => handleToggle("customers")}
                  className="sidebarmenu-title"
                  style={{ color: "black", fontSize: "14px" }}
                >
                  <span>Customers</span>
                  <MdOutlineKeyboardArrowRight
                    size={14}
                    // className={`dropdown-icon ${openDropdown === "customers" ? "rotate" : ""}`}
                    style={{ transform: openDropdown === "customers" ? 'rotate(90deg)' : "" }}
                  />
                </div>

                {/* Dropdown items */}
                <ul className={`dropdown ${openDropdown === "customers" ? "open" : ""}`}>
                  {canAccess("Customer", "read") && (
                    <li>
                      <NavLink to="customers">
                        <LuUsers className="fs-6" />
                        All Customers
                      </NavLink>
                    </li>
                  )}
                  {canAccess("DuesAdvance", "read") && (
                    <li>
                      <NavLink to="customerdueadvance">
                        <LuClipboardList className="fs-6" />
                        Dues & Advance
                      </NavLink>
                    </li>
                  )}
                </ul>
              </li>
              {/* <hr style={{height:"1px", color:"#979797ff"}}/> */}
            </ul>
          )}

          {/* Supplires */}
          {hasSuppliersAccess && (
            <ul className="sidebarmenu" style={{ paddingBottom: "10px" }}>
              <li
                className="user-role-li"
                style={{ fontSize: "10px", paddingBottom: "10px" }}
              >
                <NavLink
                  className="sidebarmenu-title"
                  to="supplier-list"
                  style={{
                    fontSize: "15px",
                    textDecoration: "none",
                    color: "black",
                  }}
                >
                  Suppliers
                </NavLink>
              </li>
            </ul>
          )}

          {/* {hasSuppliersAccess && (
            <ul className="sidebarmenu" style={{ paddingBottom: "18px" }}>
              <li className="sidebarmenu-item">
                <div
                  onClick={() => handleToggle("suppliers")}
                  className="sidebarmenu-title"
                  style={{ color: "black", fontSize: "14px" }}
                >
                  <span>Suppliers</span>
                  <MdOutlineKeyboardArrowRight
                    size={14}
                    
                    style={{transform: openDropdown === "suppliers" ? 'rotate(90deg)' : ""}}
                  />
                </div>

                <ul className={`dropdown ${openDropdown === "suppliers" ? "open" : ""}`}>
                  {canAccess("Supplier", "read") && (
                    <li>
                      <NavLink to="supplier-list">
                        <RiDashboardHorizontalLine size={16} />
                        All Suppliers
                      </NavLink>
                    </li>
                  )}
                </ul>
              </li>
             
            </ul>
          )} */}

          {/* Purchase Order */}
          {hasPurachseOrderAccess && (
            <ul className="sidebarmenu" style={{ paddingBottom: "18px" }}>
              <li className="sidebarmenu-item">
                <div
                  onClick={() => handleToggle("purchase")}
                  className="sidebarmenu-title"
                  style={{ color: "black", fontSize: "14px" }}
                >
                  <span>Purchase Order</span>
                  <MdOutlineKeyboardArrowRight
                    size={14}
                    // className={`dropdown-icon ${openDropdown === "purchase" ? "rotate" : ""}`}
                    style={{ transform: openDropdown === "purchase" ? 'rotate(90deg)' : "" }}
                  />
                </div>

                {/* Dropdown items */}
                <ul className={`dropdown ${openDropdown === "purchase" ? "open" : ""}`}>
                  {/* <li>
                <NavLink to="/m/create-purchase"><RiDashboardHorizontalLine size={16}/>Create Purchase Order</NavLink>
              </li> */}
                  {canAccess("Purchase", "read") && (
                    <li>
                      <NavLink to="purchase-list">
                        <LuShoppingBag className="fs-6" />
                        Purchase Orders
                      </NavLink>
                    </li>
                  )}
                  {canAccess("DebitNote", "read") && (
                    <li>
                      <NavLink to="debit-note">
                        <LuScrollText className="fs-6" />
                        Debit Note
                      </NavLink>
                    </li>
                  )}
                </ul>
              </li>
            </ul>
          )}

          {/* Sales Order */}
          {hasSalesOrderAccess && (
            <ul className="sidebarmenu" style={{ paddingBottom: "0px" }}>
              <li className="sidebarmenu-item">
                <div
                  onClick={() => handleToggle("sales")}
                  className="sidebarmenu-title"
                  style={{ color: "black", fontSize: "14px" }}
                >
                  <span>Sales Order</span>
                  <MdOutlineKeyboardArrowRight
                    size={14}
                    // className={`dropdown-icon ${openDropdown === "sales" ? "rotate" : ""}`}
                    style={{ transform: openDropdown === "sales" ? 'rotate(90deg)' : "" }}
                  />
                </div>

                {/* Dropdown items */}
                <ul className={`dropdown ${openDropdown === "sales" ? "open" : ""}`}>
                  {canAccess("Sales", "read") && (
                    <li>
                      <NavLink to="online-orders">
                        <LuPackageCheck className="fs-6" />
                        Sales Order
                      </NavLink>
                    </li>
                  )}
                  {canAccess("Invoices", "read") && (
                    <li>
                      <NavLink to="createinvoice">
                        <LuNotebookPen className="fs-6" />
                        Invoice
                      </NavLink>
                    </li>
                  )}
                  {canAccess("Quotation", "read") && (
                    <li>
                      <NavLink to="quotation">
                        <LuNotepadText className="fs-6" />
                        Quotaion
                      </NavLink>
                    </li>
                  )}
                  {canAccess("CreditNote", "read") && (
                    <li>
                      <NavLink to="creditnotelist">
                        <LuReceiptIndianRupee className="fs-6" />
                        Credit Note
                      </NavLink>
                    </li>
                  )}
                </ul>
              </li>
              <hr style={{ height: "1px", color: "#979797ff" }} />
            </ul>
          )}

          {/* My Online Store */}
          {hasMyOnlineStoreAcess && (
            <ul className="sidebarmenu" style={{ paddingBottom: "0px" }}>
              <li className="sidebarmenu-item">
                <div
                  onClick={() => handleToggle("myonlinestore")}
                  className="sidebarmenu-title"
                  style={{ color: "black", fontSize: "14px" }}
                >
                  <span>
                    My Online Store
                  </span>
                  <button
                    style={{
                      border: "1px solid #4105F5",
                      borderRadius: "50px",
                      backgroundColor: "transparent",
                      fontSize: "12px",
                      fontFamily: "Inter",
                      color: "#4105F5",
                      fontWeight: "500",
                    }}
                  >
                    UPCOMING
                  </button>
                </div>
              </li>
              <hr style={{ height: "1px", color: "#979797ff" }} />
            </ul>
          )}

          {/* warehouse */}
          {/* {hasWarehouseAccess && (
          <ul className="sidebarmenu" style={{ paddingBottom: "0px" }}>
            <li className="sidebarmenu-item">
              <div
                onClick={() => handleToggle("warehouse")}
                className="sidebarmenu-title"
                style={{ color: "black", fontSize: "14px" }}
              >
                <span>Warehouse</span>
                <MdOutlineKeyboardArrowRight
                  size={14}
                  
                    style={{transform: openDropdown === "warehouse" ? 'rotate(90deg)' : ""}}
                />
              </div>

              <ul className={`dropdown ${openDropdown === "warehouse" ? "open" : ""}`}>
                  <>
                   {canAccess("Warehouse", "read") && (
                    <li>
                      <NavLink to="warehouse">
                        <RiDashboardHorizontalLine size={16} />
                        All Warehouse
                      </NavLink>
                    </li>
                    )}
                    {canAccess("StockMovementLog", "read") && (
                    <li>
                      <NavLink to="stock-movement-log">
                        <RiDashboardHorizontalLine size={16} />
                        Stock Movement
                      </NavLink>
                    </li>
                     )}
                  </>
              </ul>
               
            </li>
            <hr style={{ height: "1px", color: "#979797ff" }} />
          </ul>
          )} */}

          {/* Expenses */}
          {hasExpensesAccess && (
            <ul className="sidebarmenu" style={{ paddingBottom: "10px" }}>
              {canAccess("ExpenseReport", "read") && (
                <li
                  className="expenses-li"
                  style={{ fontSize: "15px", paddingBottom: "10px" }}
                >
                  <NavLink
                    to='expense-report'
                    style={{
                      fontSize: "15px",
                      textDecoration: "none",
                      color: "black",
                    }}
                  >
                    Expenses
                  </NavLink>
                </li>
              )}
            </ul>
          )}

          {/* Points & Rewards */}
          {hasPointRewardsAccess && (
            <ul className="sidebarmenu" style={{ paddingBottom: "10px" }}>

              <li
                className="pointsrewards-li"
                style={{ fontSize: "15px", paddingBottom: "10px" }}
              >
                <NavLink
                  to='point-rewards'
                  style={{
                    fontSize: "15px",
                    textDecoration: "none",
                    color: "black",
                  }}
                >
                  Points & Rewards
                </NavLink>
              </li>

            </ul>
          )}

          {/* Reports */}
          {hasRepostrsacces && (
            <ul className="sidebarmenu" style={{ paddingBottom: "10px" }}>
              <li
                className="sidebarmenu-item"
                style={{ paddingBottom: "10px" }}
              >
                <div
                  onClick={() => handleToggle("reports")}
                  className="sidebarmenu-title"
                  style={{ color: "black", fontSize: "14px" }}
                >
                  <span>Reports</span>
                  <MdOutlineKeyboardArrowRight
                    size={14}
                    // className={`dropdown-icon ${openDropdown === "reports" ? "rotate" : ""}`}
                    style={{ transform: openDropdown === "reports" ? 'rotate(90deg)' : "" }}
                  />
                </div>

                {/* Dropdown items */}
                <ul className={`dropdown ${openDropdown === "reports" ? "open" : ""}`}>
                  {canAccess("SalesReport", "read") && (
                    <li>
                      <NavLink to="sales-report">
                        <LuFileInput className="fs-6" />
                        Sales Report
                      </NavLink>
                    </li>
                  )}
                  {canAccess("PurchaseReport", "read") && (
                    <li>
                      <NavLink to="purchase-report">
                        <LuFileCheck2 className="fs-6" />
                        Purchase Report
                      </NavLink>
                    </li>
                  )}
                  {canAccess("InventoryReport", "read") && (
                    <li>
                      <NavLink to="inventory-report">
                        <LuFileBox className="fs-6" />
                        Inventory Report
                      </NavLink>
                    </li>
                  )}
                  {canAccess("SupplierReport", "read") && (
                    <li>
                      <NavLink to="supplier-report">
                        <RiFileUserLine className="fs-6" />
                        Supplier Report
                      </NavLink>
                    </li>
                  )}
                  {canAccess("DamageReport", "read") && (
                    <li>
                      <NavLink to="damage-report">
                        <LuFileX2 className="fs-6" />
                        Damage Report
                      </NavLink>
                    </li>
                  )}
                  {canAccess("CreditDebitNoteReport", "read") && (
                    <li>
                      <NavLink to="credit&debit-note">
                        <LuFileChartPie className="fs-6" />
                        Credit & Debit Report
                      </NavLink>
                    </li>
                  )}
                  {canAccess("OverdueReport", "read") && (
                    <li>
                      <NavLink to="overdue-report">
                        <LuFileClock className="fs-6" />
                        Overdue Report
                      </NavLink>
                    </li>
                  )}
                </ul>
              </li>
              {/* <hr style={{height:"1px", color:"#979797ff"}}/> */}
            </ul>
          )}

          {/* User Role and managemnt */}
          {canAccess("Users", "read") && (
            <ul className="sidebarmenu" style={{ paddingBottom: "10px" }}>
              <li
                className="user-role-li"
                style={{ fontSize: "10px", paddingBottom: "10px" }}
              >
                <NavLink
                  className="sidebarmenu-title"
                  to='users'
                  style={{
                    fontSize: "15px",
                    textDecoration: "none",
                    color: "black",
                  }}
                >
                  Users Role & Management
                </NavLink>
              </li>
            </ul>
          )}

          {/* Settings */}
          {hasSettingsAccess && (
            <ul className="sidebarmenu" style={{ paddingBottom: "10px" }}>
              <li
                className="user-role-li"
                style={{ fontSize: "10px", paddingBottom: "10px" }}
              >
                <NavLink
                  className="sidebarmenu-title"
                  to="settings/user-profile-settings"
                  style={{
                    fontSize: "15px",
                    textDecoration: "none",
                    color: "black",
                  }}
                >
                  Settings
                </NavLink>
              </li>
            </ul>
          )}

          {/* Settings */}
          {/* {hasSettingsAccess && (
            <ul className="sidebarmenu" style={{ paddingBottom: "10px" }}>
              <li className="sidebarmenu-item">
                <div
                  onClick={() => handleToggle("settings")}
                  className="sidebarmenu-title"
                  style={{ color: "black", fontSize: "14px" }}
                >
                  <span>Settings</span>
                  <MdOutlineKeyboardArrowRight
                    size={14}
                  
                    style={{transform: openDropdown === "settings" ? 'rotate(90deg)' : ""}}
                  />
                </div>

               
                <ul className={`dropdown ${openDropdown === "settings" ? "open" : ""}`}>
                  {canAccess("Settings", "read") && (
                    <li>
                      <NavLink to="settings/user-profile-settings">
                        <RiDashboardHorizontalLine size={16} />
                        Users Setting
                      </NavLink>
                    </li>
                  )}
                </ul>
              </li>
           
            </ul>
          )} */}

        </div>
        {/* User Info */}
        {userData ? (
          <div
            className="d-flex justify-content-between align-items-center"
            style={{ backgroundColor: "white", position: "absolute", bottom: "5px", width: "200px" }}
          >
            <div className="d-flex gap-2">
              {/* Profile Image OR First Letter */}
              {userData?.profileImage?.url ? (
                <img
                  src={userData.profileImage.url}
                  alt="Profile"
                  style={{
                    borderRadius: "50px",
                    objectFit: "fil",
                    height: "40px",
                    width: "40px",
                  }}
                />
              ) : (
                <div
                  style={{
                    height: "40px",
                    width: "40px",
                    borderRadius: "50%",
                    backgroundColor: "#e5e7eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "600",
                  }}
                >
                  {userData?.name?.charAt(0)?.toUpperCase()}
                </div>
              )}

              {/* User Info */}
              <div className="user-id-info">
                <p
                  style={{
                    marginBottom: "0",
                    color: "black",
                    fontSize: "14px",
                    fontFamily: "Inter"
                  }}
                >
                  {userData?.name || "User"}
                </p>
                <p
                  style={{
                    marginBottom: "0",
                    color: "grey",
                    fontSize: "14px",
                    fontFamily: "Inter"
                  }}
                >
                  {userData?.role?.roleName || "User"}
                </p>
              </div>
            </div>

            {/* Logout */}
            <IoLogOutOutline
              onClick={setloginPop}
              color="red"
              title="Logout"
              size={18}
              style={{ cursor: "pointer" }}
            />
          </div>
        ) : null}

        {/* Logout PopUp */}
        {loginPop && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0, 0, 0, 0.30)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
            }}

          >
            {/* Modal Box */}
            <div
              style={{
                backgroundColor: "white",
                width: "420px",
                maxWidth: "92vw",
                borderRadius: "12px",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.12)",
                overflow: "hidden",
                padding: "15px 20px 10px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center"
              }}

            >
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  width: '100%'
                }}
              >
                <span
                  style={{
                    margin: 0,
                    fontSize: "24px",
                    fontWeight: "600",
                    color: "#1F2937",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  Confirm Logout
                </span>
              </div>

              {/* Body */}
              <div style={{ padding: "0px 0px 10px 0px", textAlign: "center", borderBottom: "1px solid #F1F1F1", width: '100%' }}>
                <p
                  style={{
                    margin: "0 0 0px 0",
                    fontSize: "18px",
                    color: "#9c9da0ff",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  Are You Sure You Want to Logout ?
                </p>
              </div>

              {/* Footer Buttons */}
              <div
                style={{
                  padding: "15px 0px",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "12px",
                }}
              >
                <button
                  onClick={() => setloginPop(false)}
                  style={{
                    padding: "6px 10px",
                    fontSize: "18px",
                    fontWeight: "400",
                    color: "#6B7280",
                    backgroundColor: "#6b728038",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    cursor: "pointer",
                    minWidth: "80px",
                  }}
                  onMouseEnter={(e) => (e.target.style.backgroundColor = "#F3F4F6")}
                  onMouseLeave={(e) => (e.target.style.backgroundColor = "#6b728038")}
                >
                  Cancel
                </button>

                <button
                  onClick={handleLogout}
                  style={{
                    padding: "6px 10px",
                    fontSize: "18px",
                    fontWeight: "400",
                    color: "#EF4444",
                    backgroundColor: "#ef44443f ",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    cursor: "pointer",
                    minWidth: "80px",
                  }}
                  onMouseEnter={(e) => (e.target.style.backgroundColor = "#F3F4F6")}
                  onMouseLeave={(e) => (e.target.style.backgroundColor = "#ef44443f")}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
