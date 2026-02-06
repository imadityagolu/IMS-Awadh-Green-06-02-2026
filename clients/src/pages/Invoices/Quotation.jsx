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

function Quotation() {
    const [quotation, setQuotation] = useState([]);
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

    const [activeRow, setActiveRow] = useState(null);

    const toggleRow = (index) => {
        const newOpen = openRow === index ? null : index;
        setOpenRow(newOpen);
        if (newOpen === null && activeRow === index) {
            setActiveRow(null);
        } else if (newOpen !== null) {
            setActiveRow(index);
        }
    };

    // const token = localStorage.getItem("token");
    // Fetch quotations from backend (CustomerInvoiceController)
    const fetchQuotations = async () => {
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
            const res = await api.get('/api/quotations', {
                params,
                // headers: { Authorization: `Bearer ${token}` },
            });
            if (res.data?.success && Array.isArray(res.data.quotations)) {
                setQuotation(res.data.quotations);
                setTotal(res.data.total || 0);
                console.log("Fetched quotations:", res.data.quotations.length);
            } else {
                setQuotation([]);
                setTotal(0);
            }
        } catch (err) {
            console.error("Failed to fetch quotations:", err);
            setQuotation([]);
            setTotal(0);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchQuotations();
        // eslint-disable-next-line
    }, [page, limit, search, customer, invoiceId, startDate, endDate]);

    useEffect(() => {
        setPage(1);
    }, [search, customer, startDate, endDate]);

    // Pagination controls
    const totalPages = Math.ceil(total / limit);

    // Calculation helpers (copied from AddSalesModal.jsx for consistency)
    const [summary, setSummary] = useState({
        subTotal: 0,
        discountSum: 0,
        taxableSum: 0,
        cgst: 0,
        sgst: 0,
        taxSum: 0,
        shippingCost: 0,
        labourCost: 0,
        orderDiscount: 0,
        roundOff: 0,
        grandTotal: 0,
    });
    const [isUpdating, setIsUpdating] = useState(false);
    // const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!Array.isArray(quotation)) return;
        const allItems = quotation.flatMap((inv) => Array.isArray(inv.items) ? inv.items : []);
        let subTotal = 0;
        let discountSum = 0;
        let taxableSum = 0;
        let taxSum = 0;
        let grandTotal = 0;

        allItems.forEach((item) => {
            const qty = Number(item.qty || 1);
            const price = Number(item.unitPrice || 0);
            const discountAmount = Number(item.discountAmt || 0);
            const taxableAmount = Math.max(0, qty * price - discountAmount);
            const taxRate = Number(item.taxRate || 0);
            const taxAmount = item.taxAmount !== undefined
                ? Number(item.taxAmount || 0)
                : (taxableAmount * taxRate) / 100;
            const lineTotal = item.amount !== undefined
                ? Number(item.amount || 0)
                : taxableAmount + taxAmount;

            subTotal += qty * price;
            discountSum += discountAmount;
            taxableSum += taxableAmount;
            taxSum += taxAmount;
            grandTotal += lineTotal;
        });

        const cgst = taxSum / 2;
        const sgst = taxSum / 2;

        setSummary({
            subTotal,
            discountSum,
            taxableSum,
            cgst,
            sgst,
            taxSum,
            grandTotal,
        });
    }, [quotation]);

    const handleBulkDelete = async () => {
        const confirmed = await DeleteAlert({});
        if (!confirmed) return;
        try {
            // const token = localStorage.getItem("token");
            await api.post(
                '/api/quotation/bulk-delete',
                {
                    ids: selectedInvoices,
                },
            );
            toast.success("Selected quotations deleted");
            setSelectedInvoices([]);
            fetchQuotations();
        } catch (error) {
            console.log(error);
            if (error.response?.status === 401) {
                toast.error("Unauthorized. please login again");
            } else if (error.response?.status === 403) {
                toast.error("You don't have permission to delete quotations");
            } else {
                toast.error("Bulk delete quotations failed. Please try again");
            }
        }
    };

    // share quotation via email (matches backend: POST /api/quotation/email/:id)
    const shareQuotation = async (quotationMongoId, customerEmail, customerPhone) => {
        try {
            setShareLoadingId(quotationMongoId);

            // Send Email 
            await api.post(
                `/api/quotation/email/${encodeURIComponent(quotationMongoId)}`,
                { email: customerEmail || undefined },
                // { headers: { Authorization: `Bearer ${token}` } }
            );

            // Send WhatsApp
            await api.post(
                `/api/quotation/whatsapp/${encodeURIComponent(quotationMongoId)}`,
                { phone: customerPhone || undefined },
                // { headers: { Authorization: `Bearer ${token}` } }
            );

            // Send SMS
            await api.post(
                `/api/quotation/sms/${encodeURIComponent(quotationMongoId)}`,
                { phone: customerPhone || undefined },
                // { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success("Quotation shared.");
        } catch (e) {
            console.error(e);
            toast.error(e?.response?.data?.message || "Failed to share quotation.");
        } finally {
            setShareLoadingId(null);
        }
    };


    const [viewBarcode, setViewBarcode] = useState([]);
    const [viewOptions, setViewOptions] = useState([]);

    const buttonRefs = useRef([]);
    const modelRef = useRef(null); // reference to modal area

    // ✅ close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            // close only when:
            const isClickInsideModel =
                modelRef.current && modelRef.current.contains(event.target);

            const isClickInsideButton =
                buttonRefs.current[viewBarcode] &&
                buttonRefs.current[viewBarcode].contains(event.target);

            buttonRefs.current[viewOptions] &&
                buttonRefs.current[viewOptions].contains(event.target);

            if (!isClickInsideModel && !isClickInsideButton) {
                setViewBarcode(false);
                setViewOptions(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [viewBarcode][viewOptions]);

    const tabs = [{ label: "All", count: total, active: true }];

  const handlePdf = () => {
    const doc = new jsPDF();
    doc.text("Quotation", 14, 15);
    const tableColumns = [
      "Quotation No",
      "Customer Name",
      "Amount",
      "Status",
    ];

    const visibleRows = selectedInvoices.length > 0
      ? quotation.filter((e) => selectedInvoices.includes(e._id))
      : quotation;

    const tableRows = visibleRows.map((e) => [
      e.quotationNo,
      e.customerId?.name || "-",
      (e.grandTotal || 0).toFixed(2),
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

    doc.save("quotation.pdf");
  };

    return (
        <div className="p-4">
            {/* back, header, view style */}
            <div
                style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0px 0px 16px 0px", // Optional: padding for container
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
                        Quotation
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
                        {/* {selectedInvoices.length > 0 && (
                            <div className="">
                                <div className="btn btn-danger" onClick={handleBulkDelete}>
                                    Delete Selected({selectedInvoices.length})
                                </div>
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
                                cursor: "pointer",
                                fontFamily: "Inter, sans-serif",
                                fontSize: 14,
                                fontWeight: 400,
                                color: "#0E101A",
                                height: "33px",
                            }}
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
                                                    const allIds = quotation.map((i) => i._id).filter(Boolean);
                                                    const uniqueSelected = new Set(selectedInvoices);
                                                    return allIds.length > 0 && uniqueSelected.size === allIds.length;
                                                })()
                                            }
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedInvoices(
                                                        quotation.map((i) => i._id).filter(Boolean)
                                                    );
                                                } else {
                                                    setSelectedInvoices([]);
                                                }
                                            }}
                                        />
                                        Quotation No
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
                                    <td colSpan={5}>Loading...</td>
                                </tr>
                            ) : quotation.length === 0 ? (
                                <td colSpan="5" className="text-center p-3">
                                    <span className="" style={{ fontStyle: "italic",fontSize: 14, }}>No Quotation Data Available</span>
                                </td>
                            ) : (
                                quotation.map((inv, idx) => {
                                    if (Array.isArray(inv.items) && inv.items.length > 0) {
                                        return inv.items.map((item, pidx) => {
                                            const qty = Number(item.qty || 1);
                                            const price = Number(item.unitPrice || 0);
                                            const discountAmount = Number(item.discountAmt || 0);
                                            const taxableAmount = Math.max(0, qty * price - discountAmount);
                                            const taxRate = Number(item.taxRate || 0);
                                            const taxAmount = item.taxAmount !== undefined
                                                ? Number(item.taxAmount || 0)
                                                : (taxableAmount * taxRate) / 100;
                                            const lineTotal = item.amount !== undefined
                                                ? Number(item.amount || 0)
                                                : taxableAmount + taxAmount;
                                            return (
                                                <tr key={`${inv._id || idx}-${pidx}`} style={{ borderBottom: "1px solid #FCFCFC" }}
                                                    className={`table-hover ${activeRow === idx ? "active-row" : ""
                                                        }`}
                                                >
                                                    {/* invoice no */}
                                                    <td style={{ padding: "8px 16px", verticalAlign: "middle", height: '46px' }}>
                                                        <div
                                                            style={{ display: "flex", alignItems: "center", gap: 12 }}
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
                                                                onClick={(e) => e.stopPropagation()}
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
                                                                    <div>
                                                                        {inv.quotationNo}
                                                                    </div>
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

                                                    {/* amount */}
                                                    <td
                                                        style={{
                                                            padding: "8px 16px",
                                                            fontSize: 14,
                                                            color: "#0E101A",
                                                        }}
                                                    >
                                                        ₹{inv.grandTotal.toFixed(2)}
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
                                                    <td onClick={(e) => e.stopPropagation()}>
                                                        <div className="edit-delete-action d-flex align-items-center justify-content-center gap-2">
                                                            {/* <a
                                  className="p-2 d-flex align-items-center justify-content-between border rounded"
                                    onClick={() =>
                                      navigate(`/sales-invoice/${inv._id}`)
                                    }
                                >
                                  <TbEye className="feather-eye" />
                                </a> */}
                                                            <a
                                                                className="p-2 d-flex align-items-center justify-content-between border rounded"
                                                                data-bs-toggle="modal"
                                                                data-bs-target="#delete"
                                                            >
                                                                <TbTrash className="feather-trash-2" />
                                                            </a>
                                                            {/* <a
                                  className="p-2 d-flex align-items-center justify-content-between border rounded"
                                  onClick={() =>
                                    shareInvoice(
                                      inv._id,
                                      inv.customerId?.email,
                                      inv.customerId?.phone
                                    )
                                  }
                                  style={{
                                    opacity: shareLoadingId === inv._id ? 0.6 : 1,
                                    pointerEvents: shareLoadingId === inv._id ? "none" : "auto"
                                  }}
                                  title="Share via Email & WhatsApp"
                                >
                                  <GrShareOption />
                                </a> */}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        });
                                    }
                                })
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
        </div>
    );
}
export default Quotation;