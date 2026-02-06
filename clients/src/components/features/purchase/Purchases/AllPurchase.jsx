// // import React, { useEffect, useState, useRef } from "react";
// // import { MdAddShoppingCart } from "react-icons/md";
// // import {FiSearch } from "react-icons/fi";
// // import { BsThreeDots } from "react-icons/bs";
// // import "react-datepicker/dist/react-datepicker.css";
// // import { Link } from "react-router-dom";
// // import Dollarimg from "../../assets/images/dollar.png";
// // import Orderimg from "../../assets/images/order.png";
// // import Purchaseimg from "../../assets/images/purchaserupe.png";
// // import Dueamountimg from "../../assets/images/dueamount.png";
// // import { FaCheck } from "react-icons/fa6";
// // import { RxCross2 } from "react-icons/rx";
// // import ConfirmDeleteModal from "../../componets/ConfirmDelete";
// // import Convertpurchasepopupmodal from "./Convertpurchasepopupmodal";
// // import DatePicker from "../../componets/DatePicker";
// // import total_orders_icon from "../../assets/images/totalorders-icon.png";
// // import Pagination from "../../componets/Pagination";
// // import { TbFileExport } from "react-icons/tb";
// // import CreditNoteImg from "../../assets/images/create-creditnote.png";
// // import DeleteICONImg from "../../assets/images/delete.png";
// // import ViewDetailsImg from "../../assets/images/view-details.png";
// // import EditICONImg from "../../assets/images/edit.png";
// // import DuplicateICONImg from "../../assets/images/duplicate.png";

// // const statsTop = [
// //   {
// //     title: "Total Purchase Value",
// //     value: "21,04,78,980",
// //     currency: "INR",
// //     image: Dollarimg,
// //     link: "",
// //   },
// //   {
// //     title: "Total Order",
// //     value: "156",
// //     currency: "",
// //     image: Orderimg,
// //     link: "/m/total-orders",
// //   },
// //   {
// //     title: "Average Purchasing",
// //     value: "859,980",
// //     currency: "INR",
// //     image: Purchaseimg,
// //     link: "",
// //   },
// //   {
// //     title: "Due Payments",
// //     value: "978,980",
// //     currency: "INR",
// //     image: Dueamountimg,
// //     link: "",
// //   },
// // ];

// // const tabsData = [
// //   { label: "All Orders", count: 156 },
// //   { label: "Pending", count: 91 },
// //   { label: "Approved", count: 91 },
// //   { label: "Rejected", count: 52 },
// // ];

// // const rowsSample = [
// //   {
// //     supplier: "Jethalal Gada (12 items)",
// //     invoice: "INV-012",
// //     items: "01",
// //     dates: "12/08/25 & 21/08/25",
// //     status: { label: "Convert to Purchase", type: "warning" },
// //     amount: "₹ 3,200/-",
// //   },
// //   {
// //     supplier: "Champaklal (91 items)",
// //     invoice: "INV-011",
// //     items: "09",
// //     dates: "12/08/25 & 21/08/25",
// //     status: { label: "Rejected", type: "danger" },
// //     amount: "₹ 3,200/-",
// //   },
// //   {
// //     supplier: "Gada Electronics (27 items)",
// //     invoice: "INV-010",
// //     items: "27",
// //     dates: "12/08/25 & 21/08/25",
// //     status: { label: "Convert to Purchase", type: "warning" },
// //     amount: "₹ 3,200/-",
// //   },
// //   {
// //     supplier: "Aman (91 items)",
// //     invoice: "INV-009",
// //     items: "91",
// //     dates: "12/08/25 & 21/08/25",
// //     status: { label: "Approved", type: "success" },
// //     amount: "₹ 3,200/-",
// //   },
// //   {
// //     supplier: "Ajay (03 items)",
// //     invoice: "INV-008",
// //     items: "03",
// //     dates: "12/08/25 & 21/08/25",
// //     status: { label: "Approved", type: "success" },
// //     amount: "₹ 3,200/-",
// //   },
// //   {
// //     supplier: "Ajay (03 items)",
// //     invoice: "INV-008",
// //     items: "03",
// //     dates: "12/08/25 & 21/08/25",
// //     status: { label: "Approved", type: "success" },
// //     amount: "₹ 3,200/-",
// //   },
// //   {
// //     supplier: "Ajay (03 items)",
// //     invoice: "INV-008",
// //     items: "03",
// //     dates: "12/08/25 & 21/08/25",
// //     status: { label: "Approved", type: "success" },
// //     amount: "₹ 3,200/-",
// //   },
// //   {
// //     supplier: "Ajay (03 items)",
// //     invoice: "INV-008",
// //     items: "03",
// //     dates: "12/08/25 & 21/08/25",
// //     status: { label: "Approved", type: "success" },
// //     amount: "₹ 3,200/-",
// //   },
// //   {
// //     supplier: "Ajay (03 items)",
// //     invoice: "INV-008",
// //     items: "03",
// //     dates: "12/08/25 & 21/08/25",
// //     status: { label: "Approved", type: "success" },
// //     amount: "₹ 3,200/-",
// //   },
// //   {
// //     supplier: "Ajay (03 items)",
// //     invoice: "INV-008",
// //     items: "03",
// //     dates: "12/08/25 & 21/08/25",
// //     status: { label: "Approved", type: "success" },
// //     amount: "₹ 3,200/-",
// //   },
// //   {
// //     supplier: "Ajay (03 items)",
// //     invoice: "INV-008",
// //     items: "03",
// //     dates: "12/08/25 & 21/08/25",
// //     status: { label: "Approved", type: "success" },
// //     amount: "₹ 3,200/-",
// //   },
// // ];

// // const statusStyles = {
// //   success: {
// //     color: "#01774B",
// //     bg: "transparent",
// //     dot: false,
// //     icon: <FaCheck size={12} />,
// //   },
// //   danger: {
// //     color: "#A80205",
// //     bg: "transparent",
// //     dot: false,
// //     icon: <RxCross2 size={12} />,
// //   },
// //   warning: { color: "#7E7000", bg: "#F7F7C7", dot: true },
// // };

// // const menuItems = [
// //   {
// //     label: "Edit",
// //     icon: <img src={EditICONImg} size={18} />,
// //     link: "",
// //     action: "details",
// //   },
// //   {
// //     label: "View Details",
// //     icon: <img src={ViewDetailsImg} size={18} />,
// //     link: "",
// //     action: "details",
// //   },
// //   {
// //     label: "Create Debit Notes",
// //     icon: <img src={CreditNoteImg} size={18} />,
// //     link: "/m/create-debitnote",
// //     action: "debit_note",
// //   },
// //   {
// //     label: "Duplicate",
// //     icon: <img src={DuplicateICONImg} size={18} />,
// //     link: "",
// //     action: "details",
// //   },
// //   {
// //     label: "Delete",
// //     icon: <img src={DeleteICONImg} size={18} />,
// //     link: "/m/confirm-delete",
// //     action: "delete",
// //   },
// // ];

// // export default function AllPurchase() {
// //   const [activeTab, setActiveTab] = useState("All Orders");
// //   const [search, setSearch] = useState("");
// //   const [openMenu, setOpenMenu] = useState(null);
// //   const [modalContent, setModalContent] = useState("");
// //   const [openModal, setOpenModal] = useState(false);
// //   const menuRef = useRef(null);
// //   const [showDeleteModal, setShowDeleteModal] = useState(false);
// //   const [selectedUser, setSelectedUser] = useState(null);
// //   const [selectedDateRange, setSelectedDateRange] = useState({
// //     startDate: new Date(2025, 2, 15),
// //     endDate: new Date(2025, 2, 22),
// //     key: "selection",
// //   });
  

// //   const [showModal, setShowModal] = useState(false);

// //   const handleClick = (text) => {
// //     setModalContent(text);
// //     setOpenModal(true);
// //     setOpenMenu(false);
// //   };

// //   useEffect(() => {
// //     function handleClickOutside(e) {
// //       if (menuRef.current && !menuRef.current.contains(e.target)) {
// //         setOpenMenu(null);
// //       }
// //     }
// //     document.addEventListener("mousedown", handleClickOutside);
// //     return () => {
// //       document.removeEventListener("mousedown", handleClickOutside);
// //     };
// //   }, []);

// //   const filteredRows = rowsSample.filter((r) =>
// //     r.supplier.toLowerCase().includes(search.toLowerCase())
// //   );

// //   const cardStyle = {
// //     borderRadius: 6,
// //     boxShadow: "rgba(0, 0, 0, 0.1)",
// //     padding: 0,
// //     background: "white",
// //   };

// //   return (
// //     <div className="px-4 py-4">
// //       {/* Header: back + title + right-side controls */}
// //       <div className="d-flex justify-content-between align-items-center mb-3">
// //         <div className="d-flex align-items-center justify-content-center gap-3">
// //           <span
// //             style={{
// //               backgroundColor: "white",
// //               width: "32px",
// //               height: "32px",
// //               borderRadius: "50px",
// //               display: "flex",
// //               justifyContent: "center",
// //               alignItems: "center",
// //               border: "1px solid #FCFCFC",
// //               cursor: "pointer",
// //             }}
// //           >
// //             <img src={total_orders_icon} alt="total_orders_icon" />
// //           </span>
// //           <h3
// //             style={{
// //               fontSize: "22px",
// //               color: "#0E101A",
// //               fontFamily: '"Inter", sans-serif',
// //               fontWeight: 500,
// //               lineHeight: "120%",
// //             }}
// //           >
// //             All Purchase Orders
// //           </h3>
// //         </div>

// //         <div className="d-flex align-items-center gap-3">
// //           <div className="d-flex align-items-center gap-4">
// //             <DatePicker />
// //           </div>

// //           {/* Create Purchase */}
// //           <Link style={{ textDecoration: "none" }} to="/m/create-purchase">
// //             <button
// //               className="btn d-flex align-items-center"
// //               style={{
// //                 background: "#fff",
// //                 border: "1.5px solid #1F7FFF",
// //                 color: "#1F7FFF",
// //                 borderRadius: "8px",
// //                 padding: "8px 16px",
// //                 boxShadow: "-1px -1px 1.6px rgba(0,0,0,0.08) inset",
// //                 fontWeight: 500,
// //                 fontSize: "14px",
// //                 fontFamily: '"Inter", sans-serif',
// //               }}
// //             >
// //               <MdAddShoppingCart style={{ marginRight: 8, fontSize: "16px" }} />
// //               Create Purchase
// //             </button>
// //           </Link>
// //         </div>
// //       </div>

// //       {/* Top stat cards */}
// //       <div className="row g-3 mb-3">
// //         {statsTop.map((s, idx) => (
// //           <Link
// //             to={s.link}
// //             key={idx}
// //             className="col-12 col-sm-6 col-lg-3"
// //             style={{ textDecoration: "none" }}
// //           >
// //             <div
// //               className="d-flex justify-content-between align-items-center bg-white position-relative"
// //               style={{
// //                 width: "100%",
// //                 height: "86px",
// //                 padding: "16px 24px 16px 16px",
// //                 fontFamily: "Inter",
// //                 boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.10)",
// //                 border: "1px solid #E5F0FF",
// //                 borderRadius: "8px",
// //                 backgroundColor: "#FFFFFF",
// //               }}
// //             >
// //               {/* Blue Left Accent Line */}
// //               <span
// //                 style={{
// //                   position: "absolute",
// //                   left: 0,
// //                   top: "50%",
// //                   transform: "translateY(-50%)",
// //                   width: "4px",
// //                   height: "70%",
// //                   backgroundColor: "#1F7FFF",
// //                   borderRadius: "1px 10px 1px 10px",
// //                 }}
// //               ></span>

// //               {/* Left Content */}
// //               <div
// //                 className="d-flex align-items-center"
// //                 style={{ gap: "24px" }}
// //               >
// //                 <div className="d-flex flex-column" style={{ gap: "11px" }}>
// //                   <h6
// //                     className="mb-0"
// //                     style={{
// //                       fontSize: "14px",
// //                       color: "#727681",
// //                       fontWeight: "500",
// //                     }}
// //                   >
// //                     {s.title}
// //                   </h6>
// //                   <div className="d-flex align-items-end gap-2">
// //                     <h5
// //                       className="mb-0"
// //                       style={{
// //                         fontSize: "22px",
// //                         color: "#0E101A",
// //                         fontWeight: "600",
// //                       }}
// //                     >
// //                       {s.value}
// //                     </h5>
// //                     {s.currency && (
// //                       <span style={{ fontSize: "14px", color: "#0E101A" }}>
// //                         {s.currency}
// //                       </span>
// //                     )}
// //                   </div>
// //                 </div>
// //               </div>

// //               {/* Right Icon Circle */}
// //               <div
// //                 className="d-flex justify-content-center align-items-center rounded-circle"
// //                 style={{
// //                   width: "50px",
// //                   height: "50px",
// //                   backgroundColor: "#FFFFFF",
// //                   border: "1px solid #E5F0FF",
// //                   flexShrink: 0,
// //                 }}
// //               >
// //                 <img
// //                   src={s.image}
// //                   alt={s.title}
// //                   style={{
// //                     width: "36px",
// //                     height: "36px",
// //                     objectFit: "contain",
// //                   }}
// //                 />
// //               </div>
// //             </div>
// //           </Link>
// //         ))}
// //       </div>

// //       {/* Search + Tabs */}
// //       <div
// //         style={{
// //           backgroundColor: "white",
// //           borderRadius: "16px",
// //           padding: "20px",
// //         }}
// //       >
// //         <div
// //           className="d-flex"
// //           style={{
// //             gap: "20px",
// //             justifyContent: "space-between",
// //             marginBottom: "20px",
// //           }}
// //         >
// //           <div className="col-md-6 d-flex align-items-center">
// //             <div
// //               style={{
// //                 background: "#F3F8FB",
// //                 padding: 2,
// //                 borderRadius: 8,
// //                 display: "flex",
// //                 gap: 8,
// //                 overflowX: "auto",
// //               }}
// //             >
// //               {tabsData.map((t) => {
// //                 const active = activeTab === t.label;
// //                 return (
// //                   <div
// //                     key={t.label}
// //                     onClick={() => setActiveTab(t.label)}
// //                     role="button"
// //                     style={{
// //                       padding: "6px 12px",
// //                       borderRadius: 8,
// //                       background: active ? "#fff" : "transparent",
// //                       boxShadow: active ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
// //                       display: "flex",
// //                       gap: 8,
// //                       alignItems: "center",
// //                       cursor: "pointer",
// //                       minWidth: 90,
// //                       whiteSpace: "nowrap",
// //                       height: "33px",
// //                     }}
// //                   >
// //                     <div style={{ fontSize: 14, color: "#0E101A" }}>
// //                       {t.label}
// //                     </div>
// //                     <div style={{ color: "#727681", fontSize: 14 }}>
// //                       {t.count}
// //                     </div>
// //                   </div>
// //                 );
// //               })}
// //             </div>
// //           </div>
// //           <div className="d-flex align-items-center gap-4">
// //             {/* Search Box */}
// //             <div
// //               className="d-flex align-items-center search-box"
// //               style={{
// //                 background: "#FCFCFC",
// //                 padding: "5px 16px",
// //                 borderRadius: 8,
// //                 border: "1px solid #EAEAEA",
// //                 width: "465px",
// //               }}
// //             >
// //               <FiSearch style={{ color: "#14193D66" }} />
// //               <input
// //                 type="search"
// //                 placeholder="Search"
// //                 value={search}
// //                 onChange={(e) => setSearch(e.target.value)}
// //                 style={{
// //                   border: "none",
// //                   outline: "none",
// //                   width: "100%",
// //                   backgroundColor: "transparent",
// //                   fontSize: "15px",
// //                 }}
// //               />
// //             </div>

// //             {/* Export Button */}
// //             <button
// //               style={{
// //                 background: "#FCFCFC",
// //                 border: "1px solid #EAEAEA",
// //                 borderRadius: 8,
// //                 padding: "4px 14px",
// //                 fontSize: "14px",
// //                 fontFamily: '"Inter", sans-serif',
// //                 color: "#0E101A",
// //                 height: "32px",
// //                 whiteSpace: "nowrap",
// //                 display: "flex",
// //                 alignItems: "center",
// //                 justifyContent: "center",
// //                 fontWeight: 500,
// //               }}
// //             >
// //               <TbFileExport
// //                 className="fs-5 text-secondary"
// //                 style={{ marginRight: "10px" }}
// //               />
// //               Export
// //             </button>
// //           </div>
// //         </div>

// //         {/* Table card */}
// //         <div style={{ ...cardStyle }}>
// //           <div
// //             className="table-responsive"
// //             style={{
// //               cursor: "pointer",
// //               height: "600px",
// //               overflowY: "scroll",
// //               scrollbarWidth: "none",
// //               msOverflowStyle: "none",
// //             }}
// //           >
// //             {/* wrapper for top + bottom spacing (important for sticky alignment) */}
// //             <div>
// //               <table
// //                 className="table align-middle"
// //                 style={{
// //                   fontSize: 14,
// //                   marginBottom: 0,
// //                   borderCollapse: "separate",
// //                   borderSpacing: 0,
// //                 }}
// //               >
// //                 <thead>
// //                   <tr>
// //                     {/* Checkbox */}
// //                     <th
// //                       style={{
// //                         width: 0,
// //                         backgroundColor: "#F3F8FB",
// //                         position: "sticky",
// //                         top: 0,
// //                         zIndex: 10,
// //                         fontWeight: 400,
// //                         padding: "12px 16px",
// //                         color: "#727681",
// //                         fontSize: "14px",
// //                         fontFamily: '"Inter", sans-serif',
// //                       }}
// //                     >
// //                       <input type="checkbox" aria-label="select row" />
// //                     </th>

// //                     {/* Supplier Name */}
// //                     <th
// //                       style={{
// //                         backgroundColor: "#F3F8FB",
// //                         position: "sticky",
// //                         top: 0,
// //                         zIndex: 10,
// //                         fontWeight: 400,
// //                         padding: "12px 16px",
// //                         color: "#727681",
// //                         fontSize: "14px",
// //                         fontFamily: '"Inter", sans-serif',
// //                       }}
// //                     >
// //                       Supplier Name
// //                     </th>

// //                     {/* Invoice */}
// //                     <th
// //                       style={{
// //                         backgroundColor: "#F3F8FB",
// //                         position: "sticky",
// //                         top: 0,
// //                         zIndex: 10,
// //                         fontWeight: 400,
// //                         padding: "12px 16px",
// //                         color: "#727681",
// //                         fontSize: "14px",
// //                         fontFamily: '"Inter", sans-serif',
// //                       }}
// //                     >
// //                       Invoice No.
// //                     </th>

// //                     {/* Items */}
// //                     <th
// //                       style={{
// //                         backgroundColor: "#F3F8FB",
// //                         position: "sticky",
// //                         zIndex: 10,
// //                         fontWeight: 400,
// //                         padding: "12px 16px",
// //                         color: "#727681",
// //                         fontSize: "14px",
// //                         fontFamily: '"Inter", sans-serif',
// //                         top: 0,
// //                       }}
// //                     >
// //                       No. Of Items
// //                     </th>

// //                     {/* Dates */}
// //                     <th
// //                       style={{
// //                         backgroundColor: "#F3F8FB",
// //                         position: "sticky",
// //                         zIndex: 10,
// //                         fontWeight: 400,
// //                         padding: "12px 16px",
// //                         color: "#727681",
// //                         fontSize: "14px",
// //                         fontFamily: '"Inter", sans-serif',
// //                         top: 0,
// //                       }}
// //                     >
// //                       Order Date & Arriving On
// //                     </th>

// //                     {/* Status */}
// //                     <th
// //                       style={{
// //                         backgroundColor: "#F3F8FB",
// //                         position: "sticky",
// //                         zIndex: 10,
// //                         fontWeight: 400,
// //                         padding: "12px 16px",
// //                         color: "#727681",
// //                         fontSize: "14px",
// //                         fontFamily: '"Inter", sans-serif',
// //                         top: 0,
// //                       }}
// //                     >
// //                       Status
// //                     </th>

// //                     {/* Total */}
// //                     <th
// //                       style={{
// //                         backgroundColor: "#F3F8FB",
// //                         position: "sticky",
// //                         zIndex: 10,
// //                         fontWeight: 400,
// //                         padding: "12px 16px",
// //                         color: "#727681",
// //                         fontSize: "14px",
// //                         fontFamily: '"Inter", sans-serif',
// //                         top: 0,
// //                       }}
// //                     >
// //                       Total Amount
// //                     </th>

// //                     {/* Actions */}
// //                     <th
// //                       className="text-center"
// //                       style={{
// //                         width: 60,
// //                         backgroundColor: "#F3F8FB",
// //                         position: "sticky",
// //                         zIndex: 10,
// //                         fontWeight: 400,
// //                         padding: "12px 16px",
// //                         color: "#727681",
// //                         fontSize: "14px",
// //                         fontFamily: '"Inter", sans-serif',
// //                         top: 0,
// //                       }}
// //                     >
// //                       Actions
// //                     </th>
// //                   </tr>
// //                 </thead>

// //                 <tbody>
// //                   {filteredRows.map((row, idx) => {
// //                     const sty =
// //                       statusStyles[row.status.type] || statusStyles.warning;

// //                     return (
// //                       <tr key={idx} style={{ verticalAlign: "middle" }}>
// //                         {/* Checkbox */}
// //                         <td
// //                           className="text-center"
// //                           style={{ padding: "14px 16px" }}
// //                         >
// //                           <input type="checkbox" aria-label="select row" />
// //                         </td>

// //                         {/* Supplier */}
// //                         <td style={{ padding: "14px 16px", color: "#0E101A" }}>
// //                           {row.supplier}
// //                         </td>

// //                         {/* Invoice */}
// //                         <td style={{ padding: "14px 16px" }}>{row.invoice}</td>

// //                         {/* Items */}
// //                         <td style={{ padding: "14px 16px" }}>{row.items}</td>

// //                         {/* Dates */}
// //                         <td style={{ padding: "14px 16px" }}>
// //                           <div
// //                             style={{
// //                               display: "flex",
// //                               gap: 6,
// //                               flexWrap: "wrap",
// //                             }}
// //                           >
// //                             {row.dates.split(" & ").map((d, i) => (
// //                               <span key={i}>{d}</span>
// //                             ))}
// //                           </div>
// //                         </td>

// //                         {/* Status chip */}
// //                         <td style={{ padding: "14px 16px" }}>
// //                           <div
// //                             style={{
// //                               display: "inline-flex",
// //                               alignItems: "center",
// //                               gap: 8,
// //                               padding: "6px 10px",
// //                               borderRadius: 50,
// //                               background: sty.bg,
// //                               color: sty.color,
// //                               fontSize: 14,
// //                               whiteSpace: "nowrap",
// //                               minWidth: 120,
// //                             }}
// //                             onClick={() => setShowModal(true)}
// //                           >
// //                             {sty.dot ? (
// //                               <span
// //                                 style={{
// //                                   width: 10,
// //                                   height: 10,
// //                                   borderRadius: 20,
// //                                   background: sty.color,
// //                                   display: "inline-block",
// //                                 }}
// //                               />
// //                             ) : (
// //                               <span style={{ color: sty.color }}>
// //                                 {sty.icon}
// //                               </span>
// //                             )}
// //                             {row.status.label}
// //                           </div>
// //                         </td>

// //                         {/* Amount */}
// //                         <td style={{ padding: "14px 16px" }}>{row.amount}</td>

// //                         {/* Actions */}
// //                         <td
// //                           className="text-center"
// //                           style={{ padding: "14px 16px", position: "relative" }}
// //                         >
// //                           <button
// //                             onClick={() =>
// //                               setOpenMenu(openMenu === idx ? null : idx)
// //                             }
// //                             className="btn"
// //                             style={{
// //                               border: "none",
// //                               background: "transparent",
// //                               padding: 4,
// //                               display: "flex",
// //                               alignItems: "center",
// //                             }}
// //                             aria-label="actions"
// //                           >
// //                             <BsThreeDots style={{ color: "#6C748C" }} />
// //                           </button>

// //                           {openMenu === idx && (
// //                             <div
// //                               ref={menuRef}
// //                               style={{
// //                                 position: "absolute",
// //                                 right: 140,
// //                                 width: "210px",
// //                                 backgroundColor: "#ffff",
// //                                 borderRadius: "12px",
// //                                 boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)",
// //                                 border: "1px solid #E5E7EB",
// //                                 overflow: "hidden",
// //                                 animation: "fadeIn 0.2s ease-out",
// //                                 zIndex: 1000,
// //                               }}
// //                             >
// //                               {menuItems.map((item) =>
// //                                 item.action === "delete" ? (
// //                                   <div
// //                                     key={item.action}
// //                                     onClick={() => {
// //                                       setSelectedUser(idx);
// //                                       setShowDeleteModal(true);
// //                                       setOpenMenu(false);
// //                                     }}
// //                                     style={{
// //                                       display: "flex",
// //                                       alignItems: "center",
// //                                       gap: "12px",
// //                                       padding: "8px 18px",
// //                                       fontFamily: "Inter, sans-serif",
// //                                       fontSize: "14px",
// //                                       fontWeight: 500,
// //                                       cursor: "pointer",
// //                                       transition: "0.2s",
// //                                       textDecoration: "none",
// //                                     }}
// //                                     onMouseEnter={(e) => {
// //                                       e.currentTarget.style.backgroundColor =
// //                                         "#e3f2fd";
// //                                     }}
// //                                     onMouseLeave={(e) => {
// //                                       e.currentTarget.style.backgroundColor =
// //                                         "transparent";
// //                                     }}
// //                                   >
// //                                     <span style={{ fontSize: "18px" }}>
// //                                       {item.icon}
// //                                     </span>
// //                                     <span>{item.label}</span>
// //                                   </div>
// //                                 ) : (
// //                                   <Link
// //                                     key={item.action}
// //                                     to={item.link}
// //                                     onClick={() => setOpenMenu(false)}
// //                                     style={{
// //                                       display: "flex",
// //                                       alignItems: "center",
// //                                       gap: "12px",
// //                                       padding: "8px 18px",
// //                                       fontFamily: "Inter, sans-serif",
// //                                       fontSize: "14px",
// //                                       fontWeight: 500,
// //                                       color: "#344054",
// //                                       textDecoration: "none",
// //                                     }}
// //                                     onMouseEnter={(e) =>
// //                                       (e.currentTarget.style.backgroundColor =
// //                                         "#e3f2fd")
// //                                     }
// //                                     onMouseLeave={(e) =>
// //                                       (e.currentTarget.style.backgroundColor =
// //                                         "transparent")
// //                                     }
// //                                   >
// //                                     {item.icon} <span>{item.label}</span>
// //                                   </Link>
// //                                 )
// //                               )}
// //                               {/* animation */}
// //                               <style>{`
// //                                   @keyframes fadeIn {
// //                                     from { opacity: 0; transform: translateY(-6px); }
// //                                     to { opacity: 1; transform: translateY(0); }
// //                                   }
// //                                 `}</style>
// //                             </div>
// //                           )}
// //                         </td>
// //                       </tr>
// //                     );
// //                   })}

// //                   {filteredRows.length === 0 && (
// //                     <tr>
// //                       <td colSpan="8" className="text-center text-muted py-4">
// //                         No rows found
// //                       </td>
// //                     </tr>
// //                   )}
// //                 </tbody>
// //               </table>
// //             </div>
// //           </div>
// //           {/* pagination */}
// //           <Pagination />
// //           <ConfirmDeleteModal
// //             isOpen={showDeleteModal}
// //             onCancel={() => setShowDeleteModal(false)}
// //             onConfirm={() => {
// //               setShowDeleteModal(false);
// //             }}
// //           />
// //           {/* convert purchase  */}
// //           <Convertpurchasepopupmodal
// //             isOpen={showModal}
// //             onCancel={() => setShowModal(false)}
// //             onConfirm={() => {
// //               setShowModal(false);
// //             }}
// //           />
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }




// import React, { useEffect, useState, useRef } from "react";
// import { MdAddShoppingCart } from "react-icons/md";
// import { FiSearch } from "react-icons/fi";
// import { BsThreeDots } from "react-icons/bs";
// import "react-datepicker/dist/react-datepicker.css";
// import { Link, useNavigate } from "react-router-dom";
// import Dollarimg from "../../assets/images/dollar.png";
// import Orderimg from "../../assets/images/order.png";
// import Purchaseimg from "../../assets/images/purchaserupe.png";
// import Dueamountimg from "../../assets/images/dueamount.png";
// import { FaCheck } from "react-icons/fa6";
// import { RxCross2 } from "react-icons/rx";
// import ConfirmDeleteModal from "../../componets/ConfirmDelete";
// import Convertpurchasepopupmodal from "./Convertpurchasepopupmodal";
// import DatePicker from "../../componets/DatePicker";
// import total_orders_icon from "../../assets/images/totalorders-icon.png";
// import Pagination from "../../componets/Pagination";
// import { TbFileExport } from "react-icons/tb";
// import CreditNoteImg from "../../assets/images/create-creditnote.png";
// import DeleteICONImg from "../../assets/images/delete.png";
// import ViewDetailsImg from "../../assets/images/view-details.png";
// import EditICONImg from "../../assets/images/edit.png";
// import DuplicateICONImg from "../../assets/images/duplicate.png";
// import api from "../config/axiosInstance";
// import { toast } from "react-toastify";
// import { format } from "date-fns";

// const statsTop = [
//   {
//     title: "Total Purchase Value",
//     value: "0",
//     currency: "INR",
//     image: Dollarimg,
//     link: "",
//   },
//   {
//     title: "Total Order",
//     value: "0",
//     currency: "",
//     image: Orderimg,
//     link: "/m/total-orders",
//   },
//   {
//     title: "Average Purchasing",
//     value: "0",
//     currency: "INR",
//     image: Purchaseimg,
//     link: "",
//   },
//   {
//     title: "Due Payments",
//     value: "0",
//     currency: "INR",
//     image: Dueamountimg,
//     link: "",
//   },
// ];

// const tabsData = [
//   { label: "All Orders", count: 0, value: "all" },
//   { label: "Pending", count: 0, value: "pending" },
//   { label: "Approved", count: 0, value: "approved" },
//   { label: "Rejected", count: 0, value: "rejected" },
// ];

// const statusStyles = {
//   draft: {
//     color: "#7E7000",
//     bg: "#F7F7C7",
//     dot: true,
//     label: "Draft"
//   },
//   received: {
//     color: "#01774B",
//     bg: "transparent",
//     dot: false,
//     icon: <FaCheck size={12} />,
//     label: "Received"
//   },
//   partial: {
//     color: "#1F7FFF",
//     bg: "#E5F0FF",
//     dot: true,
//     label: "Partial"
//   },
//   cancelled: {
//     color: "#A80205",
//     bg: "transparent",
//     dot: false,
//     icon: <RxCross2 size={12} />,
//     label: "Cancelled"
//   },
//   overdue: {
//     color: "#FF6B00",
//     bg: "#FFF0E5",
//     dot: true,
//     label: "Overdue"
//   }
// };

// const menuItems = [
//   {
//     label: "Edit",
//     icon: <img src={EditICONImg} alt="edit" style={{ width: 18, height: 18 }} />,
//     action: "edit",
//   },
//   {
//     label: "View Details",
//     icon: <img src={ViewDetailsImg} alt="view" style={{ width: 18, height: 18 }} />,
//     action: "view",
//   },
//   {
//     label: "Create Debit Notes",
//     icon: <img src={CreditNoteImg} alt="debit" style={{ width: 18, height: 18 }} />,
//     action: "debit_note",
//   },
//   {
//     label: "Duplicate",
//     icon: <img src={DuplicateICONImg} alt="duplicate" style={{ width: 18, height: 18 }} />,
//     action: "duplicate",
//   },
//   {
//     label: "Delete",
//     icon: <img src={DeleteICONImg} alt="delete" style={{ width: 18, height: 18 }} />,
//     action: "delete",
//   },
// ];

// export default function AllPurchase() {
//   const navigate = useNavigate();
//   const [activeTab, setActiveTab] = useState("All Orders");
//   const [search, setSearch] = useState("");
//   const [openMenu, setOpenMenu] = useState(null);
//   const [modalContent, setModalContent] = useState("");
//   const [openModal, setOpenModal] = useState(false);
//   const menuRef = useRef(null);
//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [selectedInvoice, setSelectedInvoice] = useState(null);
//   const [selectedDateRange, setSelectedDateRange] = useState({
//     startDate: new Date(),
//     endDate: new Date(),
//     key: "selection",
//   });
//   const [showModal, setShowModal] = useState(false);
  
//   // State for purchase orders
//   const [purchaseOrders, setPurchaseOrders] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [stats, setStats] = useState(statsTop);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [totalCount, setTotalCount] = useState(0);

//   // Fetch purchase orders
//   const fetchPurchaseOrders = async (page = 1, status = "") => {
//     try {
//       setLoading(true);
//       const params = {
//         page,
//         limit: 10,
//         ...(status && status !== "all" && { status }),
//         ...(search && { search }),
//         ...(selectedDateRange.startDate && { 
//           startDate: selectedDateRange.startDate.toISOString().split('T')[0] 
//         }),
//         ...(selectedDateRange.endDate && { 
//           endDate: selectedDateRange.endDate.toISOString().split('T')[0] 
//         })
//       };

//       const response = await api.get("/api/purchase-orders", { params });
      
//       if (response.data.success) {
//         setPurchaseOrders(response.data.invoices || []);
//         setTotalCount(response.data.total || 0);
//         setTotalPages(response.data.pagination?.totalPages || 1);
        
//         // Update tab counts
//         updateTabCounts(response.data.invoices || []);
        
//         // Update stats
//         updateStats(response.data.invoices || []);
//       }
//     } catch (error) {
//       console.error("Error fetching purchase orders:", error);
//       toast.error("Failed to load purchase orders");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Update tab counts based on data
//   const updateTabCounts = (orders) => {
//     const allCount = orders.length;
//     const pendingCount = orders.filter(order => order.status === "draft").length;
//     const approvedCount = orders.filter(order => order.status === "received").length;
//     const rejectedCount = orders.filter(order => order.status === "cancelled").length;

//     // Update tabsData
//     tabsData[0].count = allCount;
//     tabsData[1].count = pendingCount;
//     tabsData[2].count = approvedCount;
//     tabsData[3].count = rejectedCount;
//   };

//   // Update statistics cards
//   const updateStats = (orders) => {
//     const totalPurchaseValue = orders.reduce((sum, order) => sum + (order.grandTotal || 0), 0);
//     const totalOrders = orders.length;
//     const averagePurchasing = totalOrders > 0 ? totalPurchaseValue / totalOrders : 0;
//     const duePayments = orders.reduce((sum, order) => sum + (order.dueAmount || 0), 0);

//     setStats([
//       {
//         ...statsTop[0],
//         value: totalPurchaseValue.toLocaleString('en-IN'),
//       },
//       {
//         ...statsTop[1],
//         value: totalOrders.toString(),
//       },
//       {
//         ...statsTop[2],
//         value: Math.round(averagePurchasing).toLocaleString('en-IN'),
//       },
//       {
//         ...statsTop[3],
//         value: duePayments.toLocaleString('en-IN'),
//       },
//     ]);
//   };

//   // Handle menu actions
//   const handleMenuAction = (invoice, action) => {
//     setSelectedInvoice(invoice);
    
//     switch (action) {
//       case "edit":
//         navigate(`/edit-purchase-order/${invoice._id}`);
//         break;
//       case "view":
//         navigate(`/show-purchase-orders/${invoice._id}`);
//         break;
//       case "delete":
//         setShowDeleteModal(true);
//         break;
//       case "duplicate":
//         handleDuplicateInvoice(invoice);
//         break;
//       case "debit_note":
//         navigate(`/create-debitnote?invoiceId=${invoice._id}`);
//         break;
//       default:
//         break;
//     }
//     setOpenMenu(null);
//   };

//   // Handle duplicate invoice
//   const handleDuplicateInvoice = async (invoice) => {
//     try {
//       const response = await api.post(`/api/purchase-orders/${invoice._id}/duplicate`);
//       if (response.data.success) {
//         toast.success("Purchase order duplicated successfully");
//         fetchPurchaseOrders();
//       }
//     } catch (error) {
//       console.error("Error duplicating invoice:", error);
//       toast.error("Failed to duplicate purchase order");
//     }
//   };

//   // Handle delete invoice
//   const handleDeleteInvoice = async () => {
//     if (!selectedInvoice) return;
    
//     try {
//       const response = await api.delete(`/api/purchase-orders/${selectedInvoice._id}`);
//       if (response.data.success) {
//         toast.success("Purchase order deleted successfully");
//         fetchPurchaseOrders();
//         setShowDeleteModal(false);
//         setSelectedInvoice(null);
//       }
//     } catch (error) {
//       console.error("Error deleting invoice:", error);
//       toast.error("Failed to delete purchase order");
//     }
//   };

//   // Handle tab change
//   const handleTabChange = (tab) => {
//     setActiveTab(tab.label);
//     let status = "";
//     switch (tab.value) {
//       case "pending": status = "draft"; break;
//       case "approved": status = "received"; break;
//       case "rejected": status = "cancelled"; break;
//       default: status = "";
//     }
//     fetchPurchaseOrders(1, status);
//   };

//   // Handle search
//   const handleSearch = (e) => {
//     setSearch(e.target.value);
//     // Add debounce here if needed
//     fetchPurchaseOrders(1);
//   };

//   // Handle pagination
//   const handlePageChange = (page) => {
//     setCurrentPage(page);
//     let status = "";
//     switch (activeTab) {
//       case "Pending": status = "draft"; break;
//       case "Approved": status = "received"; break;
//       case "Rejected": status = "cancelled"; break;
//       default: status = "";
//     }
//     fetchPurchaseOrders(page, status);
//   };

//   // Format date
//   const formatDate = (dateString) => {
//     if (!dateString) return "-";
//     return format(new Date(dateString), "dd/MM/yy");
//   };

//   // Calculate arriving date (7 days after order date)
//   const getArrivingDate = (orderDate) => {
//     if (!orderDate) return "-";
//     const date = new Date(orderDate);
//     date.setDate(date.getDate() + 7);
//     return format(date, "dd/MM/yy");
//   };

//   // Initial fetch
//   useEffect(() => {
//     fetchPurchaseOrders();
//   }, []);

//   // Handle date range change
//   useEffect(() => {
//     if (selectedDateRange.startDate && selectedDateRange.endDate) {
//       fetchPurchaseOrders(1);
//     }
//   }, [selectedDateRange]);

//   useEffect(() => {
//     function handleClickOutside(e) {
//       if (menuRef.current && !menuRef.current.contains(e.target)) {
//         setOpenMenu(null);
//       }
//     }
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, []);

//   const cardStyle = {
//     borderRadius: 6,
//     boxShadow: "rgba(0, 0, 0, 0.1)",
//     padding: 0,
//     background: "white",
//   };

//   return (
//     <div className="px-4 py-4">
//       {/* Header: back + title + right-side controls */}
//       <div className="d-flex justify-content-between align-items-center mb-3">
//         <div className="d-flex align-items-center justify-content-center gap-3">
//           <span
//             style={{
//               backgroundColor: "white",
//               width: "32px",
//               height: "32px",
//               borderRadius: "50px",
//               display: "flex",
//               justifyContent: "center",
//               alignItems: "center",
//               border: "1px solid #FCFCFC",
//               cursor: "pointer",
//             }}
//           >
//             <img src={total_orders_icon} alt="total_orders_icon" />
//           </span>
//           <h3
//             style={{
//               fontSize: "22px",
//               color: "#0E101A",
//               fontFamily: '"Inter", sans-serif',
//               fontWeight: 500,
//               lineHeight: "120%",
//             }}
//           >
//             All Purchase Orders
//           </h3>
//         </div>

//         <div className="d-flex align-items-center gap-3">
//           <div className="d-flex align-items-center gap-4">
//             <DatePicker 
//               selectedDateRange={selectedDateRange}
//               setSelectedDateRange={setSelectedDateRange}
//             />
//           </div>

//           {/* Create Purchase */}
//           <Link style={{ textDecoration: "none" }} to="/create-purchase-order">
//             <button
//               className="btn d-flex align-items-center"
//               style={{
//                 background: "#fff",
//                 border: "1.5px solid #1F7FFF",
//                 color: "#1F7FFF",
//                 borderRadius: "8px",
//                 padding: "8px 16px",
//                 boxShadow: "-1px -1px 1.6px rgba(0,0,0,0.08) inset",
//                 fontWeight: 500,
//                 fontSize: "14px",
//                 fontFamily: '"Inter", sans-serif',
//               }}
//             >
//               <MdAddShoppingCart style={{ marginRight: 8, fontSize: "16px" }} />
//               Create Purchase
//             </button>
//           </Link>
//         </div>
//       </div>

//       {/* Top stat cards */}
//       <div className="row g-3 mb-3">
//         {stats.map((s, idx) => (
//           <Link
//             to={s.link}
//             key={idx}
//             className="col-12 col-sm-6 col-lg-3"
//             style={{ textDecoration: "none" }}
//           >
//             <div
//               className="d-flex justify-content-between align-items-center bg-white position-relative"
//               style={{
//                 width: "100%",
//                 height: "86px",
//                 padding: "16px 24px 16px 16px",
//                 fontFamily: "Inter",
//                 boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.10)",
//                 border: "1px solid #E5F0FF",
//                 borderRadius: "8px",
//                 backgroundColor: "#FFFFFF",
//               }}
//             >
//               {/* Blue Left Accent Line */}
//               <span
//                 style={{
//                   position: "absolute",
//                   left: 0,
//                   top: "50%",
//                   transform: "translateY(-50%)",
//                   width: "4px",
//                   height: "70%",
//                   backgroundColor: "#1F7FFF",
//                   borderRadius: "1px 10px 1px 10px",
//                 }}
//               ></span>

//               {/* Left Content */}
//               <div
//                 className="d-flex align-items-center"
//                 style={{ gap: "24px" }}
//               >
//                 <div className="d-flex flex-column" style={{ gap: "11px" }}>
//                   <h6
//                     className="mb-0"
//                     style={{
//                       fontSize: "14px",
//                       color: "#727681",
//                       fontWeight: "500",
//                     }}
//                   >
//                     {s.title}
//                   </h6>
//                   <div className="d-flex align-items-end gap-2">
//                     <h5
//                       className="mb-0"
//                       style={{
//                         fontSize: "22px",
//                         color: "#0E101A",
//                         fontWeight: "600",
//                       }}
//                     >
//                       {s.value}
//                     </h5>
//                     {s.currency && (
//                       <span style={{ fontSize: "14px", color: "#0E101A" }}>
//                         {s.currency}
//                       </span>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {/* Right Icon Circle */}
//               <div
//                 className="d-flex justify-content-center align-items-center rounded-circle"
//                 style={{
//                   width: "50px",
//                   height: "50px",
//                   backgroundColor: "#FFFFFF",
//                   border: "1px solid #E5F0FF",
//                   flexShrink: 0,
//                 }}
//               >
//                 <img
//                   src={s.image}
//                   alt={s.title}
//                   style={{
//                     width: "36px",
//                     height: "36px",
//                     objectFit: "contain",
//                   }}
//                 />
//               </div>
//             </div>
//           </Link>
//         ))}
//       </div>

//       {/* Search + Tabs */}
//       <div
//         style={{
//           backgroundColor: "white",
//           borderRadius: "16px",
//           padding: "20px",
//         }}
//       >
//         <div
//           className="d-flex"
//           style={{
//             gap: "20px",
//             justifyContent: "space-between",
//             marginBottom: "20px",
//           }}
//         >
//           <div className="col-md-6 d-flex align-items-center">
//             <div
//               style={{
//                 background: "#F3F8FB",
//                 padding: 2,
//                 borderRadius: 8,
//                 display: "flex",
//                 gap: 8,
//                 overflowX: "auto",
//               }}
//             >
//               {tabsData.map((t) => {
//                 const active = activeTab === t.label;
//                 return (
//                   <div
//                     key={t.label}
//                     onClick={() => handleTabChange(t)}
//                     role="button"
//                     style={{
//                       padding: "6px 12px",
//                       borderRadius: 8,
//                       background: active ? "#fff" : "transparent",
//                       boxShadow: active ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
//                       display: "flex",
//                       gap: 8,
//                       alignItems: "center",
//                       cursor: "pointer",
//                       minWidth: 90,
//                       whiteSpace: "nowrap",
//                       height: "33px",
//                     }}
//                   >
//                     <div style={{ fontSize: 14, color: "#0E101A" }}>
//                       {t.label}
//                     </div>
//                     <div style={{ color: "#727681", fontSize: 14 }}>
//                       {t.count}
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
//           <div className="d-flex align-items-center gap-4">
//             {/* Search Box */}
//             <div
//               className="d-flex align-items-center search-box"
//               style={{
//                 background: "#FCFCFC",
//                 padding: "5px 16px",
//                 borderRadius: 8,
//                 border: "1px solid #EAEAEA",
//                 width: "465px",
//               }}
//             >
//               <FiSearch style={{ color: "#14193D66" }} />
//               <input
//                 type="search"
//                 placeholder="Search by supplier or invoice number"
//                 value={search}
//                 onChange={handleSearch}
//                 style={{
//                   border: "none",
//                   outline: "none",
//                   width: "100%",
//                   backgroundColor: "transparent",
//                   fontSize: "15px",
//                 }}
//               />
//             </div>

//             {/* Export Button */}
//             <button
//               style={{
//                 background: "#FCFCFC",
//                 border: "1px solid #EAEAEA",
//                 borderRadius: 8,
//                 padding: "4px 14px",
//                 fontSize: "14px",
//                 fontFamily: '"Inter", sans-serif',
//                 color: "#0E101A",
//                 height: "32px",
//                 whiteSpace: "nowrap",
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 fontWeight: 500,
//               }}
//             >
//               <TbFileExport
//                 className="fs-5 text-secondary"
//                 style={{ marginRight: "10px" }}
//               />
//               Export
//             </button>
//           </div>
//         </div>

//         {/* Table card */}
//         <div style={{ ...cardStyle }}>
//           <div
//             className="table-responsive"
//             style={{
//               cursor: "pointer",
//               height: "600px",
//               overflowY: "scroll",
//               scrollbarWidth: "none",
//               msOverflowStyle: "none",
//             }}
//           >
//             {/* wrapper for top + bottom spacing (important for sticky alignment) */}
//             <div>
//               <table
//                 className="table align-middle"
//                 style={{
//                   fontSize: 14,
//                   marginBottom: 0,
//                   borderCollapse: "separate",
//                   borderSpacing: 0,
//                 }}
//               >
//                 <thead>
//                   <tr>
//                     {/* Checkbox */}
//                     <th
//                       style={{
//                         width: 0,
//                         backgroundColor: "#F3F8FB",
//                         position: "sticky",
//                         top: 0,
//                         zIndex: 10,
//                         fontWeight: 400,
//                         padding: "12px 16px",
//                         color: "#727681",
//                         fontSize: "14px",
//                         fontFamily: '"Inter", sans-serif',
//                       }}
//                     >
//                       <input type="checkbox" aria-label="select row" />
//                     </th>

//                     {/* Supplier Name */}
//                     <th
//                       style={{
//                         backgroundColor: "#F3F8FB",
//                         position: "sticky",
//                         top: 0,
//                         zIndex: 10,
//                         fontWeight: 400,
//                         padding: "12px 16px",
//                         color: "#727681",
//                         fontSize: "14px",
//                         fontFamily: '"Inter", sans-serif',
//                       }}
//                     >
//                       Supplier Name
//                     </th>

//                     {/* Invoice */}
//                     <th
//                       style={{
//                         backgroundColor: "#F3F8FB",
//                         position: "sticky",
//                         top: 0,
//                         zIndex: 10,
//                         fontWeight: 400,
//                         padding: "12px 16px",
//                         color: "#727681",
//                         fontSize: "14px",
//                         fontFamily: '"Inter", sans-serif',
//                       }}
//                     >
//                       Invoice No.
//                     </th>

//                     {/* Items */}
//                     <th
//                       style={{
//                         backgroundColor: "#F3F8FB",
//                         position: "sticky",
//                         zIndex: 10,
//                         fontWeight: 400,
//                         padding: "12px 16px",
//                         color: "#727681",
//                         fontSize: "14px",
//                         fontFamily: '"Inter", sans-serif',
//                         top: 0,
//                       }}
//                     >
//                       No. Of Items
//                     </th>

//                     {/* Dates */}
//                     <th
//                       style={{
//                         backgroundColor: "#F3F8FB",
//                         position: "sticky",
//                         zIndex: 10,
//                         fontWeight: 400,
//                         padding: "12px 16px",
//                         color: "#727681",
//                         fontSize: "14px",
//                         fontFamily: '"Inter", sans-serif',
//                         top: 0,
//                       }}
//                     >
//                       Order Date & Arriving On
//                     </th>

//                     {/* Status */}
//                     <th
//                       style={{
//                         backgroundColor: "#F3F8FB",
//                         position: "sticky",
//                         zIndex: 10,
//                         fontWeight: 400,
//                         padding: "12px 16px",
//                         color: "#727681",
//                         fontSize: "14px",
//                         fontFamily: '"Inter", sans-serif',
//                         top: 0,
//                       }}
//                     >
//                       Status
//                     </th>

//                     {/* Total */}
//                     <th
//                       style={{
//                         backgroundColor: "#F3F8FB",
//                         position: "sticky",
//                         zIndex: 10,
//                         fontWeight: 400,
//                         padding: "12px 16px",
//                         color: "#727681",
//                         fontSize: "14px",
//                         fontFamily: '"Inter", sans-serif',
//                         top: 0,
//                       }}
//                     >
//                       Total Amount
//                     </th>

//                     {/* Actions */}
//                     <th
//                       className="text-center"
//                       style={{
//                         width: 60,
//                         backgroundColor: "#F3F8FB",
//                         position: "sticky",
//                         zIndex: 10,
//                         fontWeight: 400,
//                         padding: "12px 16px",
//                         color: "#727681",
//                         fontSize: "14px",
//                         fontFamily: '"Inter", sans-serif',
//                         top: 0,
//                       }}
//                     >
//                       Actions
//                     </th>
//                   </tr>
//                 </thead>

//                 <tbody>
//                   {loading ? (
//                     <tr>
//                       <td colSpan="8" className="text-center py-5">
//                         <div className="spinner-border text-primary" role="status">
//                           <span className="visually-hidden">Loading...</span>
//                         </div>
//                       </td>
//                     </tr>
//                   ) : purchaseOrders.length === 0 ? (
//                     <tr>
//                       <td colSpan="8" className="text-center text-muted py-5">
//                         No purchase orders found
//                       </td>
//                     </tr>
//                   ) : (
//                     purchaseOrders.map((order, idx) => {
//                       const sty = statusStyles[order.status] || statusStyles.draft;
//                       const supplierName = order.supplierId?.supplierName || "Unknown Supplier";
//                       const itemsCount = order.items?.length || 0;

//                       return (
//                         <tr key={order._id} style={{ verticalAlign: "middle" }}>
//                           {/* Checkbox */}
//                           <td
//                             className="text-center"
//                             style={{ padding: "14px 16px" }}
//                           >
//                             <input type="checkbox" aria-label="select row" />
//                           </td>

//                           {/* Supplier */}
//                           <td style={{ padding: "14px 16px", color: "#0E101A" }}>
//                             {supplierName} ({itemsCount} items)
//                           </td>

//                           {/* Invoice */}
//                           <td style={{ padding: "14px 16px" }}>{order.invoiceNo}</td>

//                           {/* Items */}
//                           <td style={{ padding: "14px 16px" }}>{itemsCount}</td>

//                           {/* Dates */}
//                           <td style={{ padding: "14px 16px" }}>
//                             <div
//                               style={{
//                                 display: "flex",
//                                 gap: 6,
//                                 flexWrap: "wrap",
//                               }}
//                             >
//                               <span>{formatDate(order.invoiceDate)}</span>
//                               & 
//                               <span>{getArrivingDate(order.invoiceDate)}</span>
//                             </div>
//                           </td>

//                           {/* Status chip */}
//                           <td style={{ padding: "14px 16px" }}>
//                             <div
//                               style={{
//                                 display: "inline-flex",
//                                 alignItems: "center",
//                                 gap: 8,
//                                 padding: "6px 10px",
//                                 borderRadius: 50,
//                                 background: sty.bg,
//                                 color: sty.color,
//                                 fontSize: 14,
//                                 whiteSpace: "nowrap",
//                                 minWidth: 120,
//                               }}
//                             >
//                               {sty.dot ? (
//                                 <span
//                                   style={{
//                                     width: 10,
//                                     height: 10,
//                                     borderRadius: 20,
//                                     background: sty.color,
//                                     display: "inline-block",
//                                   }}
//                                 />
//                               ) : (
//                                 <span style={{ color: sty.color }}>
//                                   {sty.icon}
//                                 </span>
//                               )}
//                               {sty.label}
//                             </div>
//                           </td>

//                           {/* Amount */}
//                           <td style={{ padding: "14px 16px" }}>
//                             ₹ {order.grandTotal?.toLocaleString('en-IN')}/-
//                           </td>

//                           {/* Actions */}
//                           <td
//                             className="text-center"
//                             style={{ padding: "14px 16px", position: "relative" }}
//                           >
//                             <button
//                               onClick={() =>
//                                 setOpenMenu(openMenu === idx ? null : idx)
//                               }
//                               className="btn"
//                               style={{
//                                 border: "none",
//                                 background: "transparent",
//                                 padding: 4,
//                                 display: "flex",
//                                 alignItems: "center",
//                               }}
//                               aria-label="actions"
//                             >
//                               <BsThreeDots style={{ color: "#6C748C" }} />
//                             </button>

//                             {openMenu === idx && (
//                               <div
//                                 ref={menuRef}
//                                 style={{
//                                   position: "absolute",
//                                   right: 140,
//                                   width: "210px",
//                                   backgroundColor: "#ffff",
//                                   borderRadius: "12px",
//                                   boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)",
//                                   border: "1px solid #E5E7EB",
//                                   overflow: "hidden",
//                                   animation: "fadeIn 0.2s ease-out",
//                                   zIndex: 1000,
//                                 }}
//                               >
//                                 {menuItems.map((item) => (
//                                   <div
//                                     key={item.action}
//                                     onClick={() => handleMenuAction(order, item.action)}
//                                     style={{
//                                       display: "flex",
//                                       alignItems: "center",
//                                       gap: "12px",
//                                       padding: "8px 18px",
//                                       fontFamily: "Inter, sans-serif",
//                                       fontSize: "14px",
//                                       fontWeight: 500,
//                                       cursor: "pointer",
//                                       transition: "0.2s",
//                                       textDecoration: "none",
//                                       color: "#344054",
//                                     }}
//                                     onMouseEnter={(e) => {
//                                       e.currentTarget.style.backgroundColor =
//                                         "#e3f2fd";
//                                     }}
//                                     onMouseLeave={(e) => {
//                                       e.currentTarget.style.backgroundColor =
//                                         "transparent";
//                                     }}
//                                   >
//                                     <span style={{ fontSize: "18px" }}>
//                                       {item.icon}
//                                     </span>
//                                     <span>{item.label}</span>
//                                   </div>
//                                 ))}
//                                 {/* animation */}
//                                 <style>{`
//                                     @keyframes fadeIn {
//                                       from { opacity: 0; transform: translateY(-6px); }
//                                       to { opacity: 1; transform: translateY(0); }
//                                     }
//                                   `}</style>
//                               </div>
//                             )}
//                           </td>
//                         </tr>
//                       );
//                     })
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </div>
          
//           {/* Pagination */}
//           {!loading && purchaseOrders.length > 0 && (
//             <Pagination 
//               currentPage={currentPage}
//               totalPages={totalPages}
//               totalCount={totalCount}
//               onPageChange={handlePageChange}
//             />
//           )}
          
//           <ConfirmDeleteModal
//             isOpen={showDeleteModal}
//             onCancel={() => {
//               setShowDeleteModal(false);
//               setSelectedInvoice(null);
//             }}
//             onConfirm={handleDeleteInvoice}
//             title="Delete Purchase Order"
//             message={`Are you sure you want to delete invoice ${selectedInvoice?.invoiceNo}? This action cannot be undone.`}
//           />
          
//           {/* Convert purchase modal */}
//           <Convertpurchasepopupmodal
//             isOpen={showModal}
//             onCancel={() => setShowModal(false)}
//             onConfirm={() => {
//               setShowModal(false);
//             }}
//           />
//         </div>
//       </div>
//     </div>
//   );
// }
