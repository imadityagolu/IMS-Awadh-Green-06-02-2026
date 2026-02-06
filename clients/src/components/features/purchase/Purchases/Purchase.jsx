import React, { useEffect, useState, useRef } from "react";
import { MdAddShoppingCart } from "react-icons/md";
import { FiSearch } from "react-icons/fi";
import { BsThreeDots } from "react-icons/bs";
import "react-datepicker/dist/react-datepicker.css";
import { Link, useNavigate } from "react-router-dom";
import Dollarimg from "../../../../assets/images/dollar.png";
import Orderimg from "../../../../assets/images/order.png";
import Purchaseimg from "../../../../assets/images/purchaserupe.png";
import Dueamountimg from "../../../../assets/images/dueamount.png";
import { FaCheck } from "react-icons/fa6";
import { RxCross2 } from "react-icons/rx";
import PurchaseImg from "../../../../assets/images/purchase.png";
import { MdOutlineAddShoppingCart } from 'react-icons/md';
import ConfirmDeleteModal from "../../../../components/ConfirmDelete";
import Convertpurchasepopupmodal from "./Convertpurchasepopupmodal";
import DatePicker from "../../../DateFilterDropdown";
import total_orders_icon from "../../../../assets/images/totalorders-icon.png";
import Pagination from "../../../../components/Pagination";
import { TbFileExport } from "react-icons/tb";
import CreditNoteImg from "../../../../assets/images/create-creditnote.png";
import DeleteICONImg from "../../../../assets/images/delete.png";
import ViewDetailsImg from "../../../../assets/images/view-details.png";
import EditICONImg from "../../../../assets/images/edit.png";
import DuplicateICONImg from "../../../../assets/images/duplicate.png";
import api from "../../../../pages/config/axiosInstance";
import { toast } from "react-toastify";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import EmptyPurchase from "./EmptyPurchase"
import { HiOutlineDotsHorizontal } from "react-icons/hi";

const statsTop = [
  {
    title: "Total Purchase Value",
    value: "0",
    currency: "INR",
    image: Dollarimg,
    link: "",
  },
  {
    title: "Total Order",
    value: "0",
    currency: "",
    image: Orderimg,
    link: "/m/total-orders",
  },
  {
    title: "Average Purchasing",
    value: "0",
    currency: "INR",
    image: Purchaseimg,
    link: "",
  },
  {
    title: "Due Payments",
    value: "0",
    currency: "INR",
    image: Dueamountimg,
    link: "",
  },
];

const tabsData = [
  { label: "All Orders", count: 0, value: "all" },
  { label: "Pending", count: 0, value: "pending" },
  { label: "Approved", count: 0, value: "approved" },
  { label: "Rejected", count: 0, value: "rejected" },
];

// const statusStyles = {
//   draft: {
//     color: "#7E7000",
//     bg: "#F7F7C7",
//     dot: true,
//     label: "Draft",
//   },
//   received: {
//     color: "#01774B",
//     bg: "transparent",
//     dot: false,
//     icon: <FaCheck size={12} />,
//     label: "Received",
//   },
//   partial: {
//     color: "#1F7FFF",
//     bg: "#E5F0FF",
//     dot: true,
//     label: "Partial",
//   },
//   cancelled: {
//     color: "#A80205",
//     bg: "transparent",
//     dot: false,
//     icon: <RxCross2 size={12} />,
//     label: "Cancelled",
//   },
//   overdue: {
//     color: "#FF6B00",
//     bg: "#FFF0E5",
//     dot: true,
//     label: "Overdue",
//   },
//   converted: {
//     color: "#7E7000",
//     bg: "#F7F7C7",
//     dot: true,
//     label: "Converted to Purchase",
//   },
// };

// Update your statusStyles object:
const statusStyles = {
  draft: {
    color: "#7E7000",
    // bg: "#F7F7C7",
    dot: true,
    label: "Draft",
  },
  received: {
    color: "#059669", // Green for approved
    // bg: "#D1FAE5",
    dot: false,
    icon: <FaCheck size={12} />,
    label: "Received",
  },
  partial: {
    color: "#1F7FFF",
    // bg: "#E5F0FF",
    dot: true,
    label: "Partial",
  },
  cancelled: {
    color: "#DC2626", // Red for rejected
    // bg: "#FEE2E2",
    dot: false,
    icon: <RxCross2 size={12} />,
    label: "Cancelled",
  },
  overdue: {
    color: "#FF6B00",
    // bg: "#FFF0E5",
    dot: true,
    label: "Overdue",
  },
  converted: {
    color: "#7E7000",
    bg: "#F7F7C7",
    dot: true,
    label: "Convert to Purchase", // Clear label
  },
};
const menuItems = [
  // {
  //   label: "Edit",
  //   icon: (
  //     <img src={EditICONImg} alt="edit" style={{ width: 18, height: 18 }} />
  //   ),
  //   action: "edit",
  // },
  {
    label: "View Details",
    icon: (
      <img src={ViewDetailsImg} alt="view" style={{ width: 18, height: 18 }} />
    ),
    action: "view",
  },
  {
    label: "Create Debit Notes",
    icon: (
      <img src={CreditNoteImg} alt="debit" style={{ width: 18, height: 18 }} />
    ),
    action: "debit_note",
  },
  // {
  //   label: "Duplicate",
  //   icon: (
  //     <img
  //       src={DuplicateICONImg}
  //       alt="duplicate"
  //       style={{ width: 18, height: 18 }}
  //     />
  //   ),
  //   action: "duplicate",
  // },
  // {
  //   label: "Delete",
  //   icon: (
  //     <img src={DeleteICONImg} alt="delete" style={{ width: 18, height: 18 }} />
  //   ),
  //   action: "delete",
  // },
];

export default function Purchase() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("All Orders");
  const [search, setSearch] = useState("");
  const [openMenu, setOpenMenu] = useState(null);
  const [modalContent, setModalContent] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const menuRef = useRef(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedDateRange, setSelectedDateRange] = useState({
    startDate: null,
    endDate: null,
  });
  const [showModal, setShowModal] = useState(false);
  const [tabs, setTabs] = useState(tabsData);

  // State for purchase orders
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(statsTop);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedOrdersForExport, setSelectedOrdersForExport] = useState([]);
  const [selectAllOrdersForExport, setSelectAllOrdersForExport] =
    useState(false);

  const [selectedRowIds, setSelectedRowIds] = useState(new Set());
  const [allVisibleSelected, setAllVisibleSelected] = useState(false);

  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [dropdownPos, setDropdownPos] = useState({ x: 0, y: 0 });
  const [openUpwards, setOpenUpwards] = useState(false);

  const [activeRow, setActiveRow] = useState(null);

  const toggleRow = (idx) => {
    const newOpen = openRow === idx ? null : idx;
    setOpenRow(newOpen);
    if (newOpen === null && activeRow === idx) {
      setActiveRow(null);
    } else if (newOpen !== null) {
      setActiveRow(idx);
    }
  };

  // ADD THIS: Track if system has ANY orders
  const [hasAnyOrdersInSystem, setHasAnyOrdersInSystem] = useState(null);

  // Fetch purchase orders
  const fetchPurchaseOrders = async (page = 1, status = "", limitOverride) => {
    try {
      setLoading(true);
      // console.log("Fetching purchase orders...");

      const params = {
        page,
        limit: limitOverride ?? itemsPerPage,
        ...(status && status !== "all" && { status }),
        ...(search && { search }),
      };

      // ONLY add dates if they are selected (not null)
      if (selectedDateRange.startDate) {
        params.startDate = format(selectedDateRange.startDate, "yyyy-MM-dd");
      }
      if (selectedDateRange.endDate) {
        params.endDate = format(selectedDateRange.endDate, "yyyy-MM-dd");
      }
      const response = await api.get("/api/purchase-orders", { params });

      // console.log("API Response:", response.data);

      if (response.data.success) {

        setPurchaseOrders(response.data.invoices || []);
        setTotalCount(response.data.total || 0);
        setTotalPages(response.data.pagination?.totalPages || 1);

        // Update tab counts
        updateTabCounts(response.data.invoices || []);

        // Update stats
        updateStats(response.data.invoices || []);
      } else {
        toast.error(response.data.error || "Failed to load purchase orders");
      }
    } catch (error) {
      // console.error("Error fetching purchase orders:", error);
      // console.error("Error response:", error.response?.data);
      // console.error("Error status:", error.response?.status);
      toast.error("Failed to load purchase orders");
    } finally {
      setLoading(false);
    }
  };

  // Update tab counts based on data
  const updateTabCounts = (orders) => {
    setTabs((prev) => [
      { ...prev[0], count: orders.length },
      {
        ...prev[1],
        count: orders.filter((o) => o.status === "converted").length,
      },
      {
        ...prev[2],
        count: orders.filter((o) => o.status === "received").length,
      },
      {
        ...prev[3],
        count: orders.filter((o) => o.status === "cancelled").length,
      },
    ]);
  };

  // Update statistics cards
  const updateStats = (orders) => {
    const totalPurchaseValue = orders.reduce(
      (sum, order) => sum + (order.grandTotal || 0),
      0
    );
    const totalOrders = orders.length;
    const averagePurchasing =
      totalOrders > 0 ? totalPurchaseValue / totalOrders : 0;
    const duePayments = orders.reduce(
      (sum, order) => sum + (order.dueAmount || 0),
      0
    );

    setStats([
      {
        ...statsTop[0],
        value: totalPurchaseValue.toLocaleString("en-IN"),
      },
      {
        ...statsTop[1],
        value: totalOrders.toString(),
      },
      {
        ...statsTop[2],
        value: Math.round(averagePurchasing).toLocaleString("en-IN"),
      },
      {
        ...statsTop[3],
        value: duePayments.toLocaleString("en-IN"),
      },
    ]);
  };

  // Handle menu actions
  const handleMenuAction = (invoice, action) => {
    setSelectedInvoice(invoice);

    switch (action) {
      case "edit":
        navigate(`/edit-purchase-order/${invoice._id}`);
        break;
      case "view":
        navigate(`/show-purchase-orders/${invoice._id}`);
        break;
      case "delete":
        setShowDeleteModal(true);
        break;
      case "duplicate":
        handleDuplicateInvoice(invoice);
        break;
      case "debit_note":
        navigate(`/create-supplier-debitnote/${invoice._id}`, {
          state: {
            type: "purchase",
            invoice: invoice,
            from: "/purchase-list"
          }
        });
        break;
      default:
        break;
    }
    setOpenMenu(null);
  };

  // Handle duplicate invoice
  const handleDuplicateInvoice = async (invoice) => {
    try {
      const response = await api.post(
        `/api/purchase-orders/${invoice._id}/duplicate`
      );
      if (response.data.success) {
        toast.success("Purchase order duplicated successfully");
        fetchPurchaseOrders();
      }
    } catch (error) {
      // console.error("Error duplicating invoice:", error);
      toast.error("Failed to duplicate purchase order");
    }
  };

  // Handle delete invoice
  const handleDeleteInvoice = async () => {
    if (!selectedInvoice) return;

    try {
      const response = await api.delete(
        `/api/purchase-orders/${selectedInvoice._id}`
      );
      if (response.data.success) {
        toast.success("Purchase order deleted successfully");
        // imediatley update local state
        setPurchaseOrders((prev) => prev.filter((order) => order._id !== selectedInvoice._id))
        // reset stats and tabs immediately
        const updatedOrders = purchaseOrders.filter((order) => order._id !== selectedInvoice._id)
        updateStats(updatedOrders);
        updateTabCounts(updatedOrders)
        fetchPurchaseOrders();
        setShowDeleteModal(false);
        setSelectedInvoice(null);
      }
    } catch (error) {
      // console.error("Error deleting invoice:", error);
      toast.error("Failed to delete purchase order");
    }
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab.label);
    let status = "";
    switch (tab.value) {
      case "pending":
        status = "converted";
        break;
      case "approved":
        status = "received";
        break;
      case "rejected":
        status = "cancelled";
        break;
      default:
        status = "";
    }
    fetchPurchaseOrders(1, status);
  };

  // Handle search
  const handleSearch = (e) => {
    setSearch(e.target.value);
    // Add debounce here if needed
    fetchPurchaseOrders(1);
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
    let status = "";
    switch (activeTab) {
      case "pending":
        status = "converted";
        break;
      case "approved":
        status = "received";
        break;
      case "rejected":
        status = "cancelled";
        break;
      default:
        status = "";
    }
    fetchPurchaseOrders(page, status);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "dd/MM/yy");
  };

  // Calculate arriving date (7 days after order date)
  const getArrivingDate = (orderDate) => {
    if (!orderDate) return "-";
    const date = new Date(orderDate);
    date.setDate(date.getDate() + 7);
    return format(date, "dd/MM/yy");
  };

  // Initial fetch
  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  // Handle date range change
  useEffect(() => {
    fetchPurchaseOrders(1);
  }, [selectedDateRange]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const cardStyle = {
    borderRadius: 6,
    boxShadow: "rgba(0, 0, 0, 0.1)",
    padding: 0,
    background: "white",
  };

  const updateInvoiceStatus = async (status) => {
    if (!selectedInvoice) return;

    try {
      await api.put(`/api/purchase-orders/${selectedInvoice._id}`, {
        status,
      });

      toast.success(`Invoice ${status}`);
      setShowModal(false);
      setSelectedInvoice(null);
      fetchPurchaseOrders(currentPage);
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Purchase Orders Report", 14, 15);

    const tableColumns = [
      "PO No.",
      "Supplier",
      "Order Date",
      "Due Date",
      "Items",
      "Status",
    ];

    // Get visible rows - selected ones or all if none selected
    const visibleRows =
      selectedRowIds.size > 0
        ? purchaseOrders.filter((order) => selectedRowIds.has(order._id))
        : purchaseOrders;

    if (visibleRows.length === 0) {
      toast.warn("No purchase orders selected to export");
      return;
    }

    const tableRows = visibleRows.map((order) => [
      order.invoiceNo || "—",
      order.supplierId?.supplierName || "Unknown Supplier",
      order.invoiceDate
        ? format(new Date(order.invoiceDate), "dd/MM/yyyy")
        : "-",
      order.dueDate ? format(new Date(order.dueDate), "dd/MM/yyyy") : "-",
      order.items?.length || 0,
      order.status || "draft",
      `₹${(order.grandTotal || 0).toLocaleString("en-IN")}`,
    ]);

    autoTable(doc, {
      head: [tableColumns],
      body: tableRows,
      startY: 20,
      styles: {
        fontSize: 8,
      },
      headStyles: {
        fillColor: [155, 155, 155],
        textColor: "white",
      },
      theme: "striped",
    });

    const filename = `purchase-orders-${visibleRows.length}-items-${format(
      new Date(),
      "yyyy-MM-dd"
    )}`;
    doc.save(`${filename}.pdf`);

    toast.success(
      `Exported ${visibleRows.length} purchase order${visibleRows.length !== 1 ? "s" : ""
      }`
    );
    // Clear selection after export
    setSelectedRowIds(new Set());
    setAllVisibleSelected(false);
  };

  // Add to your existing useEffect or create a new one
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExportMenu && !event.target.closest(".export-container")) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showExportMenu]);

  // Add this useEffect near your other useEffect hooks
  useEffect(() => {
    const allCurrentPageIds = purchaseOrders.map((order) => order._id);
    const allSelected =
      allCurrentPageIds.length > 0 &&
      allCurrentPageIds.every((id) => selectedRowIds.has(id));
    setAllVisibleSelected(allSelected);
  }, [selectedRowIds, purchaseOrders]);

  useEffect(() => {
    if (!loading && hasAnyOrdersInSystem === false && !selectedDateRange.startDate && !selectedDateRange.endDate && search === "" && activeTab === "All Orders") {
      navigate("/empty-purchase", { replace: true })
    }
  }, [loading, hasAnyOrdersInSystem, selectedDateRange, search, activeTab, navigate])



  return (
    <div className="px-4 py-4" style={{ overflowY: "auto", height: "100vh" }}>
      {/* Header: back + title + right-side controls */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center justify-content-center gap-3">
          {/* <span
            style={{
              backgroundColor: "white",
              width: "32px",
              height: "32px",
              borderRadius: "50px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              border: "1px solid #FCFCFC",
              cursor: "pointer",
            }}
          >
            <img src={total_orders_icon} alt="total_orders_icon" />
          </span> */}
          <h3
            style={{
              fontSize: "22px",
              color: "#0E101A",
              fontFamily: '"Inter", sans-serif',
              fontWeight: 500,
              lineHeight: "120%",
            }}
          >
            All Purchase Orders
          </h3>
        </div>

        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center gap-4">
            <DatePicker
              selectedDateRange={selectedDateRange}
              setSelectedDateRange={setSelectedDateRange}
            />
          </div>

          {/* Create Purchase */}
          <Link style={{ textDecoration: "none" }} to="/create-purchase-orders">
            <button
              className="button-hover"
              style={{
                borderRadius: "8px",
                padding: "5px 16px",
                border: "1px solid #1F7FFF",
                color: "rgb(31, 127, 255)",
                fontFamily: "Inter",
                backgroundColor: "white",
                fontSize: "14px",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <MdAddShoppingCart className="fs-5" />
              Create Purchase
            </button>
          </Link>
        </div>
      </div>

      {/* Top stat cards */}
      <div className="row g-3 mb-3">
        {stats.map((s, idx) => (
          <Link
            to={s.link}
            key={idx}
            className="col-12 col-sm-6 col-lg-3"
            style={{ textDecoration: "none" }}
          >
            <div
              className="d-flex justify-content-between align-items-center bg-white position-relative"
              style={{
                width: "100%",
                height: "86px",
                padding: "16px 24px 16px 16px",
                fontFamily: "Inter",
                boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.10)",
                border: "1px solid #E5F0FF",
                borderRadius: "8px",
                backgroundColor: "#FFFFFF",
              }}
            >
              {/* Blue Left Accent Line */}
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "4px",
                  height: "70%",
                  backgroundColor: "#1F7FFF",
                  borderRadius: "1px 10px 1px 10px",
                }}
              ></span>

              {/* Left Content */}
              <div
                className="d-flex align-items-center"
                style={{ gap: "24px" }}
              >
                <div className="d-flex flex-column" style={{ gap: "11px" }}>
                  <h6
                    className="mb-0"
                    style={{
                      fontSize: "14px",
                      color: "#727681",
                      fontWeight: "500",
                    }}
                  >
                    {s.title}
                  </h6>
                  <div className="d-flex align-items-end gap-2">
                    <h5
                      className="mb-0"
                      style={{
                        fontSize: "22px",
                        color: "#0E101A",
                        fontWeight: "600",
                      }}
                    >
                      {s.value}
                    </h5>
                    {s.currency && (
                      <span style={{ fontSize: "14px", color: "#0E101A" }}>
                        {s.currency}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Icon Circle */}
              <div
                className="d-flex justify-content-center align-items-center rounded-circle"
                style={{
                  width: "50px",
                  height: "50px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5F0FF",
                  flexShrink: 0,
                }}
              >
                <img
                  src={s.image}
                  alt={s.title}
                  style={{
                    width: "36px",
                    height: "36px",
                    objectFit: "contain",
                  }}
                />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Search + Tabs + Table */}
      <div
        style={{
          overflowX: "auto",
          width: "100%",
          padding: 16,
          background: "white",
          borderRadius: 16,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div
          className="d-flex"
          style={{
            gap: "20px",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div className="col-md-6 d-flex align-items-center" style={{ width: "50%" }}>
            <div
              style={{
                background: "#F3F8FB",
                padding: 2,
                borderRadius: 8,
                display: "flex",
                gap: 8,
                overflowX: "auto",
              }}
            >
              {tabs.map((t) => {
                const active = activeTab === t.label;
                return (
                  <div
                    key={t.label}
                    onClick={() => handleTabChange(t)}
                    role="button"
                    style={{
                      padding: "6px 12px",
                      borderRadius: 8,
                      background: active ? "#fff" : "transparent",
                      boxShadow: active ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      cursor: "pointer",
                      minWidth: 90,
                      whiteSpace: "nowrap",
                      height: "33px",
                    }}
                  >
                    <div style={{ fontSize: 14, color: "#0E101A" }}>
                      {t.label}
                    </div>
                    <div style={{ color: "#727681", fontSize: 14 }}>
                      {t.count}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="d-flex align-items-center gap-4" style={{
            display: "flex",
            justifyContent: "end",
            gap: "24px",
            height: "33px",
            width: "50%",
          }}>
            {/* Search Box */}
            <div
              style={{
                width: "50%",
                position: "relative",
                padding: "4px 8px 4px 20px",
                display: "flex",
                borderRadius: 8,
                alignItems: "center",
                background: "#FCFCFC",
                border: "1px solid #EAEAEA",
                gap: "5px",
                color: "rgba(19.75, 25.29, 61.30, 0.40)",
              }}
            >
              <FiSearch style={{ color: "#14193D66" }} className="fs-5" />
              <input
                type="search"
                placeholder="Search by Supplier name, invoice no."
                value={search}
                onChange={handleSearch}
                style={{
                  width: "100%",
                  border: "none",
                  outline: "none",
                  fontSize: 14,
                  background: "#FCFCFC",
                  color: "rgba(19.75, 25.29, 61.30, 0.40)",
                }}
              />
            </div>

            {/* Export Button */}
            <button
              style={{
                display: "flex",
                justifyContent: "flex-start",
                alignItems: "center",
                gap: 9,
                padding: "8px 16px",
                background: "#FCFCFC",
                borderRadius: 8,
                outline: "1px solid #EAEAEA",
                outlineOffset: "-1px",
                border: "none",
                fontFamily: "Inter, sans-serif",
                fontSize: 14,
                fontWeight: 400,
                color: "#0E101A",
                height: "33px",
                cursor:
                  selectedRowIds.size > 0 || purchaseOrders.length > 0
                    ? "pointer"
                    : "not-allowed",
                opacity:
                  selectedRowIds.size > 0 || purchaseOrders.length > 0
                    ? 1
                    : 0.5,
              }}
              onClick={handleExportPDF}
              disabled={purchaseOrders.length === 0}
              title={
                selectedRowIds.size > 0
                  ? `Export ${selectedRowIds.size} selected`
                  : "Export all"
              }
            >
              <TbFileExport className="fs-5 text-secondary" />
              Export
            </button>
          </div>
        </div>

        {/* Table card */}
        <div className="" style={{ overflow: "auto", maxHeight: "calc(100vh - 455px)" }}>
          <table
            style={{
              width: "100%",
              borderSpacing: "0 0px",
              fontFamily: "Inter",
            }}
          >
            <thead style={{ position: "sticky", top: 0, zIndex: 9 }}>
              <tr style={{ backgroundColor: "#F3F8FB", textAlign: "left" }}>
                {/* Checkbox */}
                <th
                  style={{
                    padding: "0px 0px",
                    color: "#727681",
                    fontSize: "14px",
                    fontWeight: 400,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0px", justifyContent: 'center' }}>
                    <input
                      type="checkbox"
                      aria-label="select all"
                      checked={allVisibleSelected}
                      onChange={(e) => {
                        const next = new Set(selectedRowIds);
                        if (e.target.checked) {
                          // Add all current page orders
                          purchaseOrders.forEach((order) => {
                            if (order._id) next.add(order._id);
                          });
                        } else {
                          // Remove all current page orders
                          purchaseOrders.forEach((order) => {
                            if (order._id) next.delete(order._id);
                          });
                        }
                        setSelectedRowIds(next);
                      }}
                    />
                  </div>
                </th>

                {/* Supplier Name */}
                <th
                  style={{
                    padding: "12px 16px",
                    color: "#727681",
                    fontSize: "14px",
                    fontWeight: 400,
                    fontFamily: '"Inter", sans-serif',
                  }}
                >
                  Supplier Name
                </th>

                {/* Invoice */}
                <th
                  style={{
                    padding: "12px 16px",
                    color: "#727681",
                    fontSize: "14px",
                    fontWeight: 400,
                    fontFamily: '"Inter", sans-serif',
                  }}
                >
                  Invoice No.
                </th>

                {/* Items */}
                <th
                  style={{
                    padding: "12px 16px",
                    color: "#727681",
                    fontSize: "14px",
                    fontWeight: 400,
                    fontFamily: '"Inter", sans-serif',
                  }}
                >
                  No. Of Items
                </th>

                {/* Dates */}
                <th
                  style={{
                    padding: "12px 16px",
                    color: "#727681",
                    fontSize: "14px",
                    fontWeight: 400,
                    fontFamily: '"Inter", sans-serif',
                  }}
                >
                  Order Date & Arriving On
                </th>

                {/* Status */}
                <th
                  style={{
                    padding: "12px 16px",
                    color: "#727681",
                    fontSize: "14px",
                    fontWeight: 400,
                    fontFamily: '"Inter", sans-serif',
                  }}
                >
                  Status
                </th>

                {/* Total */}
                <th
                  style={{
                    padding: "12px 16px",
                    color: "#727681",
                    fontSize: "14px",
                    fontWeight: 400,
                    fontFamily: '"Inter", sans-serif',
                  }}
                >
                  Total Amount
                </th>

                {/* Actions */}
                <th
                  className="text-center"
                  style={{
                    padding: "12px 16px",
                    color: "#727681",
                    fontSize: "14px",
                    fontWeight: 400,
                    fontFamily: '"Inter", sans-serif',
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    <div
                      className="spinner-border text-primary"
                      role="status"
                    >
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : purchaseOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center text-muted py-5">
                    No purchase orders found
                  </td>
                </tr>
              ) : (
                purchaseOrders.map((order, idx) => {
                  const sty =
                    statusStyles[order.status] || statusStyles.draft;
                  const supplierName =
                    order.supplierId?.supplierName || "Unknown Supplier";
                  const itemsCount = order.items?.length || 0;

                  return (
                    <tr key={order._id}
                      className={`table-hover ${activeRow === idx ? "active-row" : ""}`}
                      style={{
                        borderBottom: "1px solid #EAEAEA",
                        cursor: 'pointer',
                      }}
                      onClick={() => navigate(`/show-purchase-orders/${order._id}`)}
                    >
                      {/* Checkbox */}
                      <td
                        className="text-center"
                        style={{ padding: "6px 16px" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: 'center' }}>
                          <input
                            type="checkbox"
                            aria-label="select row"
                            checked={selectedRowIds.has(order._id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              const next = new Set(selectedRowIds);
                              if (e.target.checked) {
                                if (order._id) next.add(order._id);
                              } else {
                                if (order._id) next.delete(order._id);
                              }
                              setSelectedRowIds(next);
                            }}
                          />
                        </div>
                      </td>

                      {/* Supplier */}
                      <td
                        style={{ fontFamily: "inter 'sans-serif", fontWeight: 400, fontSize: "14px", lineHeight: "120%", padding: "6px 16px", color: "#0E101A" }}
                      >
                        {supplierName} ({itemsCount} items)
                      </td>

                      {/* Invoice */}
                      <td style={{ fontFamily: "inter 'sans-serif", fontWeight: 400, fontSize: "14px", lineHeight: "120%", padding: "6px 16px", color: "#0E101A" }}>
                        {order.invoiceNo}
                      </td>

                      {/* Items */}
                      <td style={{ fontFamily: "inter 'sans-serif", fontWeight: 400, fontSize: "14px", lineHeight: "120%", padding: "6px 16px", color: "#0E101A" }}>{itemsCount}</td>

                      {/* Dates */}
                      <td style={{ fontFamily: "inter 'sans-serif", fontWeight: 400, fontSize: "14px", lineHeight: "120%", padding: "6px 16px", color: "#0E101A" }}>
                        <div
                          style={{
                            display: "flex",
                            gap: 6,
                            flexWrap: "wrap",
                          }}
                        >
                          <span>{formatDate(order.invoiceDate)}</span>&
                          <span>{getArrivingDate(order.invoiceDate)}</span>
                        </div>
                      </td>

                      {/* Status chip */}
                      <td style={{ fontFamily: "inter 'sans-serif", fontWeight: 400, fontSize: "14px", lineHeight: "120%", padding: "6px 16px", color: "#0E101A" }}>
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "2px 5px",
                            borderRadius: 50,
                            background: sty.bg,
                            color: sty.color,
                            fontSize: 14,
                            whiteSpace: "nowrap",
                            minWidth: 120,
                            cursor: order.status === "converted" ? "pointer" : "default",
                            opacity: order.status === "converted" ? 1 : 0.9
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (order.status === "converted") {
                              setSelectedInvoice(order);
                              setShowModal(true);
                            }
                          }}
                          title={
                            order.status === "converted"
                              ? "Click to approve or reject"
                              : order.status === "received"
                                ? "Already approved"
                                : order.status === "cancelled"
                                  ? "Already rejected"
                                  : "Status cannot be changed"
                          }
                        >
                          {sty.dot ? (
                            <span
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: 20,
                                background: sty.color,
                                display: "inline-block",
                              }}
                            />
                          ) : (
                            <span style={{ color: sty.color }}>
                              {sty.icon}
                            </span>
                          )}
                          {sty.label}
                          {order.status !== "converted" && (
                            <span style={{ marginLeft: "4px", fontSize: "12px" }}></span>
                          )}
                        </div>
                      </td>

                      {/* Amount */}
                      <td style={{ fontFamily: "inter 'sans-serif", fontWeight: 400, fontSize: "14px", lineHeight: "120%", padding: "6px 16px", color: "#0E101A" }}>
                        ₹ {order.grandTotal?.toLocaleString("en-IN")}/-
                      </td>

                      {/* Actions */}
                      <td
                        style={{
                          padding: "6px 16px",
                          position: "relative",
                          overflow: "visible",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();

                            const rect =
                              e.currentTarget.getBoundingClientRect();
                            setOpenMenu(openMenu === idx ? null : idx)

                            const dropdownHeight = 160; // your menu height
                            const spaceBelow =
                              window.innerHeight - rect.bottom;
                            const spaceAbove = rect.top;

                            // decide direction
                            if (
                              spaceBelow < dropdownHeight &&
                              spaceAbove > dropdownHeight
                            ) {
                              setOpenUpwards(true);
                              setDropdownPos({
                                x: rect.left,
                                y: rect.top - 6, // position above button
                              });
                            } else {
                              setOpenUpwards(false);
                              setDropdownPos({
                                x: rect.left,
                                y: rect.bottom + 6, // position below button
                              });
                            }
                          }}
                          className="btn"
                          style={{
                            border: "none",
                            background: "transparent",
                            padding: 4,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            position: "relative",
                          }}
                          aria-label="actions"
                        >
                          <HiOutlineDotsHorizontal size={20} color="grey" />
                        </button>

                        {openMenu === idx && (
                          <div
                            style={{
                              position: "fixed",
                              top: openUpwards
                                ? dropdownPos.y - 110
                                : dropdownPos.y,
                              left: dropdownPos.x - 110,
                              zIndex: 999999,
                            }}
                          >
                            <div
                              ref={menuRef}
                              style={{
                                background: "white",
                                padding: 8,
                                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                minWidth: 210,
                                height: "auto", // height must match dropdownHeight above
                                display: "flex",
                                flexDirection: "column",
                                borderRadius: '8px',
                                gap: 4,
                              }}
                            >
                              {menuItems.map((item) => (
                                <div
                                  key={item.action}
                                  onClick={() =>
                                    handleMenuAction(order, item.action)
                                  }
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    padding: "8px 18px",
                                    fontFamily: "Inter, sans-serif",
                                    fontSize: "14px",
                                    fontWeight: 500,
                                    cursor: "pointer",
                                    transition: "0.2s",
                                    borderRadius: '8px',
                                    textDecoration: "none",
                                    color: "#344054",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                      "#e3f2fd";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                      "transparent";
                                  }}
                                >
                                  <span style={{ fontSize: "20px" }}>
                                    {item.icon}
                                  </span>
                                  <span>{item.label}</span>
                                </div>
                              ))}
                              {/* animation */}
                              <style>{`
                                    @keyframes fadeIn {
                                      from { opacity: 0; transform: translateY(-6px); }
                                      to { opacity: 1; transform: translateY(0); }
                                    }
                                  `}</style>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <ConfirmDeleteModal
          isOpen={showDeleteModal}
          onCancel={() => {
            setShowDeleteModal(false);
            setSelectedInvoice(null);
          }}
          onConfirm={handleDeleteInvoice}
          title="Delete Purchase Order"
          message={`Are you sure you want to delete invoice ${selectedInvoice?.invoiceNo}? This action cannot be undone.`}
        />

        {/* Convert purchase modal */}
        <Convertpurchasepopupmodal
          isOpen={showModal}
          onCancel={() => setShowModal(false)}
          onConfirm={(status) => updateInvoiceStatus(status)}
          currentStatus={selectedInvoice?.status}
          type="purchase"
        />

        {/* Pagination */}
        {!loading && purchaseOrders.length > 0 && (
          <div className="page-redirect-btn px-2">
            <Pagination
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              total={totalCount}
              onPageChange={handlePageChange}
              onItemsPerPageChange={(n) => {
                setItemsPerPage(n);
                setCurrentPage(1);
                let status = "";
                switch (activeTab) {
                  case "pending":
                    status = "converted";
                    break;
                  case "approved":
                    status = "received";
                    break;
                  case "rejected":
                    status = "cancelled";
                    break;
                  default:
                    status = "";
                }
                fetchPurchaseOrders(1, status, n);
              }}
            />
          </div>
        )}

      </div>
    </div>
  );
}
