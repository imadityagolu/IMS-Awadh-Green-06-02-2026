import axios from "axios";
import { TbEye, TbTrash } from "react-icons/tb";
import { useNavigate } from "react-router-dom";
import { MdNavigateNext } from "react-icons/md";
import { GrFormPrevious, GrShareOption } from "react-icons/gr";
import DeleteAlert from "../../utils/sweetAlert/DeleteAlert";
import BASE_URL from "../config/config";
import { toast } from "react-toastify";
import api from "../../pages/config/axiosInstance"
import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { IoIosSearch, IoIosArrowDown } from "react-icons/io";
import { FaArrowLeft, FaBarcode, FaFileImport } from "react-icons/fa6";
import { MdOutlineViewSidebar, MdAddShoppingCart } from "react-icons/md";
import { TbFileImport, TbFileExport } from "react-icons/tb";
import Pagination from "../../components/Pagination";
import Barcode from "../../assets/images/barcode.jpg";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ConfirmDeleteModal from "../../components/ConfirmDelete";
import { HiOutlineDotsHorizontal } from "react-icons/hi";

// Add menu items similar to customers
const menuItems = [
  // {
  //   label: "View",
  //   icon: <TbEye size={18} />,
  //   action: "view",
  // },
  // {
  //   label: "Share",
  //   icon: <GrShareOption size={18} />,
  //   action: "share",
  // },
  {
    label: "Delete",
    icon: <TbTrash size={18} />,
    action: "delete",
  },
];

const Invoice = () => {
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState("");
  const [customer, setCustomer] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const navigate = useNavigate();
  const [shareLoadingId, setShareLoadingId] = useState(null);

  // Add state for delete modal and menu
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ x: 0, y: 0 });
  const [openUpwards, setOpenUpwards] = useState(false);
  const menuRef = useRef();

  const [activeRow, setActiveRow] = useState(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuIndex(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle menu actions
  const handleMenuAction = async (action, invoice) => {
    setOpenMenuIndex(null);
    switch (action) {
      case "view":
        navigate(`/sales-invoice/${invoice._id}`, {
          state: { from: "/invoice" }
        });
        break;
      case "share":
        await shareInvoice(
          invoice._id,
          invoice.customerId?.email,
          invoice.customerId?.phone
        );
        break;
      case "delete":
        setSelectedInvoice(invoice);
        setShowDeleteModal(true);
        break;
      default:
        break;
    }
  };
  // navigate(`/sales-invoice/${inv._id}`, {
  //   state:{from:"/invoice"}
  // })

  // Fetch invoices from backend (CustomerInvoiceController)
  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        search, // matches invoiceNo search in controller
        customerId: customer || undefined,
        startDate,
        endDate,
      };
      // Remove empty params
      Object.keys(params).forEach((key) => {
        if (!params[key]) delete params[key];
      });
      const res = await api.get('/api/invoices', {
        params,
      });
      if (res.data?.success && Array.isArray(res.data.invoices)) {
        setInvoices(res.data.invoices);
        setTotal(res.data.total || 0);
        // console.log("Fetched invoices:", res.data.invoices.length);
      } else {
        setInvoices([]);
        setTotal(0);
      }
    } catch (err) {
      // console.error("Failed to fetch invoices:", err);
      setInvoices([]);
      setTotal(0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInvoices();
    // eslint-disable-next-line
  }, [page, limit, search, customer, invoiceId, startDate, endDate]);

  useEffect(() => {
    setPage(1);
  }, [search, customer, startDate, endDate]);

  // Delete invoice function
  const deleteInvoice = async (invoiceId) => {
    try {
      await api.delete(`/api/invoices/${invoiceId}`);
      toast.success("Invoice deleted successfully!");
      fetchInvoices(); // Refresh the list
    } catch (error) {
      // console.error("Failed to delete invoice:", error);
      toast.error("Failed to delete invoice");
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    const confirmed = await DeleteAlert({});
    if (!confirmed) return;
    try {
      await api.post(
        '/api/invoice/bulk-delete',
        {
          ids: selectedInvoices,
        },
      );
      toast.success("Selected invoices deleted");
      setSelectedInvoices([]);
      fetchInvoices();
    } catch (error) {
      // console.log(error);
      if (error.response?.status === 401) {
        toast.error("Unauthorized. please login again");
      } else if (error.response?.status === 403) {
        toast.error("You don't have permission to delete invoices");
      } else {
        toast.error("Bulk delete failed. Please try again");
      }
    }
  };

  // Share invoice via email (matches backend: POST /api/invoice/email/:id)
  const shareInvoice = async (invoiceMongoId, customerEmail, customerPhone) => {
    try {
      setShareLoadingId(invoiceMongoId);

      // Send Email
      await api.post(
        `/api/invoice/email/${encodeURIComponent(invoiceMongoId)}`,
        { email: customerEmail || undefined },
      );

      // Send WhatsApp
      await api.post(
        `/api/invoice/whatsapp/${encodeURIComponent(invoiceMongoId)}`,
        { phone: customerPhone || undefined },
      );

      // Send SMS
      await api.post(
        `/api/invoice/sms/${invoiceMongoId}`,
        { phone: customerPhone },
      );

      toast.success("Invoice shared.");
    } catch (e) {
      // console.error(e);
      toast.error(e?.response?.data?.message || "Failed to share invoice.");
    } finally {
      setShareLoadingId(null);
    }
  };

  // Export PDF function
  const handlePdf = () => {
    const doc = new jsPDF();
    doc.text("Invoice", 14, 15);
    const tableColumns = [
      "Invoice No",
      "Customer Name",
      "Due Date",
      "Amount",
      "Paid",
      "Amount Due",
      "Status",
    ];

    const visibleRows = selectedInvoices.length > 0
      ? invoices.filter((e) => selectedInvoices.includes(e._id))
      : invoices;

    if (visibleRows.length === 0) {
      toast.warn("No invoices selected to export");
      return;
    }

    const tableRows = visibleRows.map((e) => [
      e.invoiceNo,
      e.customerId?.name || "-",
      e.dueDate ? new Date(e.dueDate).toLocaleDateString() : "-",
      (e.grandTotal || 0).toFixed(2),
      (e.paidAmount || 0).toFixed(2),
      (e.dueAmount || 0).toFixed(2),
      e.status,
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

    const filename = `invoices-${visibleRows.length}-${new Date().toISOString().split('T')[0]}`;
    doc.save(`${filename}.pdf`);

    toast.success(`Exported ${visibleRows.length} invoice${visibleRows.length !== 1 ? "s" : ""}`);
  };

  const tabs = [{ label: "All", count: total, active: true }];

  return (
    <div className="p-4">
      {/* back, header, view style */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0px 0px 16px 0px",
        }}
      >
        {/* Left: Title + Icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 11,
            height: '33px'
          }}
        >
          <h2
            style={{
              margin: 0,
              color: "black",
              fontSize: 22,
              fontFamily: "Inter, sans-serif",
              fontWeight: 500,
              height: '33px'
            }}
          >
            Invoices
          </h2>
        </div>
      </div>

      {/* main body */}
      <div style={{
        width: '100%',
        minHeight: 'auto',
        maxHeight: 'calc(100vh - 160px)',
        padding: 16,
        background: 'white',
        borderRadius: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        fontFamily: 'Inter, sans-serif',
      }}>
        {/* tabs + Search Bar & import */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: '100%',
            height: "33px",
          }}
        >
          {/* Tabs */}
          <div
            style={{
              display: "flex",
              gap: 8,
              padding: 2,
              background: "#F3F8FB",
              borderRadius: 8,
              flexWrap: "wrap",
              maxWidth: '50%',
              width: "fit-content",
              height: "33px",
            }}
          >
            {tabs.map((tab) => (
              <div
                key={tab.label}
                style={{
                  padding: "4px 12px",
                  background: tab.active ? "white" : "transparent",
                  borderRadius: 8,
                  boxShadow: tab.active
                    ? "0px 1px 4px rgba(0, 0, 0, 0.10)"
                    : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 14,
                  color: "#0E101A",
                }}
              >
                {tab.label}
                <span style={{ color: "#727681" }}>{tab.count}</span>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "inline-flex",
              justifyContent: "end",
              alignItems: "center",
              gap: 16,
              width: '50%',
              height: "33px",
            }}
          >
            {/* Bulk delete button */}
            {/* {selectedInvoices.length > 0 && (
              <div
                className="button-hover"
                style={{
                  borderRadius: "8px",
                  padding: "5px 16px",
                  border: "1px solid #dc3545",
                  color: "#dc3545",
                  fontFamily: "Inter",
                  backgroundColor: "white",
                  fontSize: "14px",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                }}
                onClick={handleBulkDelete}
              >
                <TbTrash /> Delete Selected ({selectedInvoices.length})
              </div>
            )} */}

            {/* search bar */}
            <div
              style={{
                width: "50%",
                position: "relative",
                padding: "5px 0px 5px 10px",
                display: "flex",
                borderRadius: 8,
                alignItems: "center",
                background: "#FCFCFC",
                border: "1px solid #EAEAEA",
                gap: "5px",
                color: "rgba(19.75, 25.29, 61.30, 0.40)",
                height: "33px",
              }}
            >
              <IoIosSearch style={{ fontSize: '25px' }} />
              <input
                type="search"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
              title="Export"
              onClick={handlePdf}
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
                cursor: invoices.length > 0 ? "pointer" : "not-allowed",
                fontFamily: "Inter, sans-serif",
                fontSize: 14,
                fontWeight: 400,
                color: "#0E101A",
                height: "33px",
                opacity: invoices.length > 0 ? 1 : 0.5,
              }}
              disabled={invoices.length === 0}
            >
              <TbFileExport className="fs-5 text-secondary" />
              Export
            </button>
          </div>
        </div>

        {/* Table */}
        <div
          className="table-responsive"
          style={{
            overflowY: "auto",
            maxHeight: "510px",
          }}
        >
          <table
            className="table-responsive"
            style={{
              width: "100%",
              borderCollapse: "collapse",
              overflowX: "auto",
            }}
          >
            {/* Header */}
            <thead
              style={{
                position: "sticky",
                top: 0,
                zIndex: 10,
                height: "38px",
              }}
            >
              <tr style={{ background: "#F3F8FB", }}>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    width: 80,
                    fontWeight: '400'
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <input
                      type="checkbox"
                      id="select-all"
                      style={{ width: 18, height: 18 }}
                      checked={
                        (() => {
                          const allIds = invoices.map((i) => i._id).filter(Boolean);
                          const uniqueSelected = new Set(selectedInvoices);
                          return allIds.length > 0 && uniqueSelected.size === allIds.length;
                        })()
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedInvoices(
                            invoices.map((i) => i._id).filter(Boolean)
                          );
                        } else {
                          setSelectedInvoices([]);
                        }
                      }}
                    />
                    Invoice No
                  </div>
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    width: 200,
                    fontWeight: '400'
                  }}
                >
                  Customer
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    width: 123,
                    fontWeight: '400'
                  }}
                >
                  Due Date
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    width: 112,
                    fontWeight: '400'
                  }}
                >
                  Amount
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    width: 100,
                    fontWeight: '400'
                  }}
                >
                  Paid
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    width: 100,
                    fontWeight: '400'
                  }}
                >
                  Amount Due
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    width: 100,
                    fontWeight: '400'
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    textAlign: "center",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    width: 100,
                    fontWeight: '400'
                  }}
                >
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-5">
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-5 text-muted">
                    No invoices found
                  </td>
                </tr>
              ) : (
                invoices.map((inv, idx) => (
                  <tr key={inv._id}
                    style={{ borderBottom: "1px solid #EAEAEA", cursor: 'pointer' }}
                    onClick={() => navigate(`/sales-invoice/${inv._id}`, {
                      state: { from: "/invoice" }
                    })}
                    className={`table-hover ${activeRow === idx ? "active-row" : ""}`}
                  >
                    {/* invoice no */}
                    <td style={{ padding: "8px 16px", verticalAlign: "middle", height: '46px', }}>
                      <div
                        style={{ display: "flex", alignItems: "center", gap: 12 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          style={{ width: 18, height: 18, }}
                          checked={selectedInvoices.includes(inv._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedInvoices((prev) => {
                                const next = new Set(prev);
                                next.add(inv._id);
                                return Array.from(next);
                              });
                            } else {
                              setSelectedInvoices((prev) =>
                                prev.filter((id) => id !== inv._id)
                              );
                            }
                          }}
                        />
                        <div>
                          <div
                            style={{
                              fontSize: 14,
                              color: "#0E101A",
                              whiteSpace: "nowrap",
                              display: "flex",
                              gap: "5px",
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            {inv.invoiceNo}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* customer details */}
                    <td
                      style={{
                        padding: "8px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                      }}
                    >
                      <span>
                        {inv.customerId?.name ||
                          inv.customerId?.email ||
                          inv.customerId?._id ||
                          "-"}
                      </span>
                    </td>

                    {/* date */}
                    <td
                      style={{
                        padding: "8px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                      }}
                    >
                      {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "-"}
                    </td>

                    {/* amount */}
                    <td
                      style={{
                        padding: "8px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                      }}
                    >
                      ₹{inv.grandTotal?.toFixed(2) || "0.00"}
                    </td>

                    {/* paid */}
                    <td
                      style={{
                        padding: "8px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                      }}
                    >
                      ₹{Number(inv.paidAmount ?? 0).toFixed(2)}
                    </td>

                    {/* due amount */}
                    <td
                      style={{
                        padding: "8px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                      }}
                    >
                      ₹{Number(inv.dueAmount ?? 0).toFixed(2)}
                    </td>

                    {/* status */}
                    <td
                      style={{
                        padding: "8px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                      }}
                    >
                      <span
                        className={`badge badge-soft-${(inv.status === "paid" ? "success" : "danger")} badge-xs shadow-none`}
                      >
                        <i className="ti ti-point-filled me-1" />
                        {inv.status || "-"}
                      </span>
                    </td>

                    {/* action */}
                    <td
                      style={{
                        padding: "4px 16px",
                        position: "relative",
                        overflow: "visible",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* three dot button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuIndex(
                            openMenuIndex === idx ? null : idx
                          );
                          const rect = e.currentTarget.getBoundingClientRect();

                          const dropdownHeight = 180;
                          const spaceBelow = window.innerHeight - rect.bottom;
                          const spaceAbove = rect.top;

                          // decide direction
                          if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
                            setOpenUpwards(true);
                            setDropdownPos({
                              x: rect.left,
                              y: rect.top - 6,
                            });
                          } else {
                            setOpenUpwards(false);
                            setDropdownPos({
                              x: rect.left,
                              y: rect.bottom + 6,
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
                        <HiOutlineDotsHorizontal size={28} color="grey" />
                      </button>

                      {/* dropdown */}
                      {openMenuIndex === idx && (
                        <div
                          style={{
                            position: "fixed",
                            top: openUpwards
                              ? dropdownPos.y - 180
                              : dropdownPos.y,
                            left: dropdownPos.x - 80,
                            zIndex: 999999,
                          }}
                        >
                          <div
                            ref={menuRef}
                            style={{
                              background: "white",
                              padding: 8,
                              borderRadius: 12,
                              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                              minWidth: 180,
                              height: "auto",
                              display: "flex",
                              flexDirection: "column",
                              gap: 4,
                            }}
                          >
                            {menuItems.map((item) => (
                              <div
                                key={item.action}
                                onClick={() => handleMenuAction(item.action, inv)}
                                className="button-action"
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 12,
                                  padding: "8px 12px",
                                  fontFamily: "Inter, sans-serif",
                                  fontSize: 16,
                                  fontWeight: 400,
                                  cursor: "pointer",
                                  borderRadius: 8,
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = "#e3f2fd";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = "transparent";
                                }}
                              >
                                <span>{item.icon}</span>
                                <span>{item.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-2">
          <Pagination
            currentPage={page}
            total={total}
            itemsPerPage={limit}
            onPageChange={(p) => setPage(p)}
            onItemsPerPageChange={(n) => {
              setLimit(n);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onCancel={() => {
          setShowDeleteModal(false);
          setSelectedInvoice(null);
        }}
        onConfirm={async () => {
          try {
            await deleteInvoice(selectedInvoice._id);
            toast.success("Invoice deleted successfully!");
            fetchInvoices();
          } catch (error) {
            toast.error("Failed to delete invoice");
          } finally {
            setShowDeleteModal(false);
            setSelectedInvoice(null);
          }
        }}
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice ${selectedInvoice?.invoiceNo || ''}? This action cannot be undone.`}
      />
    </div>
  );
};

export default Invoice;