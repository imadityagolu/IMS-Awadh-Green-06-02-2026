import React, { useEffect, useState, useRef } from "react";
import { FiSearch } from "react-icons/fi";
import { BsThreeDots } from "react-icons/bs";
import { Link, useNavigate } from "react-router-dom";
import Dollarimg from "../../../assets/images/dollar.png";
import Orderimg from "../../../assets/images/order.png";
import Purchaseimg from "../../../assets/images/purchaserupe.png";
import Dueamountimg from "../../../assets/images/dueamount.png";
import { HiOutlineArrowsUpDown } from "react-icons/hi2";
import { TbFileExport } from "react-icons/tb";
import ConfirmDeleteModal from "../../../components/ConfirmDelete";
import Pagination from "../../../components/Pagination";
import CreditNoteImg from "../../../assets/images/create-creditnote.png";
import DeleteICONImg from "../../../assets/images/delete.png";
import ViewDetailsImg from "../../../assets/images/view-details.png";
import DateFilterDropdown from "../../../components/DateFilterDropdown";
import api from "../../../pages/config/axiosInstance";
import { toast } from "react-toastify";
import { format } from "date-fns";
import jsPDF from 'jspdf';
import autoTable from "jspdf-autotable";
import { HiOutlineDotsHorizontal } from "react-icons/hi";

const Sales = () => {
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgSelling: 0,
    duePayments: 0
  });
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [expandedRow, setExpandedRow] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());
  const [allVisibleSelected, setAllVisibleSelected] = useState(false);

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

  const [tabCounts, setTabCounts] = useState({
    all: 0,
    recent: 0,
    paid: 0,
    due: 0
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const menuRef = useRef(null);

  // FIX 1: Update allVisibleSelected when selectedRowIds or sales change
  // Currently you have:
  useEffect(() => {
    if (sales.length > 0) {
      const allSelected = sales.every(sale => selectedRowIds.has(sale._id));
      setAllVisibleSelected(allSelected);
    } else {
      setAllVisibleSelected(false);
    }
  }, [selectedRowIds, sales]);

  const statsTop = [
    {
      title: "Total Revenue",
      value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`,
      currency: "",
      image: Dollarimg,
      link: ""
    },
    {
      title: "Total Order",
      value: stats.totalOrders.toLocaleString('en-IN'),
      image: Orderimg,
      currency: "",
      link: "/m/total-orders"
    },
    {
      title: "Average Selling",
      value: `₹${stats.avgSelling.toLocaleString('en-IN')}`,
      currency: "",
      image: Purchaseimg,
      link: ""
    },
    {
      title: "Due Payments",
      value: `₹${stats.duePayments.toLocaleString('en-IN')}`,
      currency: "",
      image: Dueamountimg,
      link: ""
    },
  ];

  const tabsData = [
    { label: "All", count: tabCounts.all },
    { label: "Recent", count: tabCounts.recent },
    { label: "Paid", count: tabCounts.paid },
    { label: "Due", count: tabCounts.due }
  ];

  const statusStyles = {
    paid: { bg: "#D4F7C7", color: "#01774B", dot: false },
    draft: { bg: "#F7F7C7", color: "#746E00", dot: false },
    partial: { bg: "#C7E6F7", color: "#005B74", dot: false },
    overdue: { bg: "#F7C7C9", color: "#A80205", dot: false },
    sent: { bg: "#E8C7F7", color: "#5A0074", dot: false },
    cancelled: { bg: "#C7C7C7", color: "#3D3D3D", dot: false }
  };

  const menuItems = (invoice) => [
    {
      label: "View Details",
      icon: <img src={ViewDetailsImg} size={18} />,
      action: "details",
      onClick: () => navigate(`/sales-invoice/${invoice._id}`, {
         state: { from: "/online-orders" }
      })
    },
    {
      label: "Create Credit Notes",
      icon: <img src={CreditNoteImg} size={18} />,
      action: "credit_note",
      onClick: () => navigate('/credit-note', {
        state:{ from: "/online-orders"}
      })
    },
    {
      label: "Delete",
      icon: <img src={DeleteICONImg} size={18} />,
      action: "delete",
      onClick: () => {
        setSelectedInvoice(invoice);
        setShowDeleteModal(true);
      }
    }
  ];

  // navigate(`/sales-invoice/${id}`, {
  //   state:{from: "/online-sales"}
  // });

  // Fetch sales data
  const fetchSalesList = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search,
        status: activeTab === "All" ? undefined :
          activeTab === "Recent" ? "recent" : // Add this
            activeTab.toLowerCase(),
        startDate: dateRange.start ? format(dateRange.start, 'yyyy-MM-dd') + 'T00:00:00.000Z' : undefined,
        endDate: dateRange.end ? format(dateRange.end, 'yyyy-MM-dd') + 'T23:59:59.999Z' : undefined,
      };

      const response = await api.get('/api/invoices/sales/list', { params });
      // console.log('responsedataww', response.data)

      if (response.data.success) {
        setSales(response.data.data.sales);
        const p = response.data.data.pagination;

        setPagination(prev => ({
          ...prev,
          page: p.page,
          limit: p.limit,
          total: p.total,
          totalPages: p.totalPages
        }));


        // Update stats
        if (response.data.data.stats) {
          const s = response.data.data.stats;
          setStats({
            totalRevenue: s.totalRevenue || 0,
            totalOrders: s.totalOrders || 0,
            avgSelling: s.avgOrderValue || 0,
            duePayments: s.totalDue || 0
          });
        }

        // Calculate accurate tab counts
        // These should come from backend, but calculate from current data
        const allCount = response.data.data.pagination?.total || 0;
        const recentCount = activeTab === "Recent" ? allCount :
          response.data.data.sales.filter(s => {
            const invoiceDate = new Date(s.invoiceDate);
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            return invoiceDate >= sevenDaysAgo;
          }).length;

        const paidCount = activeTab === "Paid" ? allCount :
          response.data.data.sales.filter(s => s.status === "paid").length;

        const dueCount = activeTab === "Due" ? allCount :
          response.data.data.sales.filter(s => (s.dueAmount || 0) > 0).length;

        setTabCounts({
          all: allCount,
          recent: recentCount,
          paid: paidCount,
          due: dueCount
        });
      }
    } catch (error) {
      // console.error('Error fetching sales list:', error);
      toast.error('Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete invoice
  const handleDeleteInvoice = async () => {
    if (!selectedInvoice) return;

    try {
      await api.delete(`/api/invoices/${selectedInvoice._id}`);
      toast.success('Invoice deleted successfully');
      fetchSalesList(); // Refresh list
    } catch (error) {
      // console.error('Error deleting invoice:', error);
      toast.error('Failed to delete invoice');
    } finally {
      setShowDeleteModal(false);
      setSelectedInvoice(null);
    }
  };

  // PDF Export function
  const handleExport = () => {
    const rows = selectedRowIds.size > 0
      ? sales.filter(s => selectedRowIds.has(s._id))
      : sales;

    if (!rows.length) {
      toast.warn("No invoices to export");
      return;
    }

    try {
      // Create PDF document
      const doc = new jsPDF('portrait', 'mm', 'a4');

      // Add header
      doc.setFontSize(20);
      doc.setTextColor(31, 127, 255); // Blue color
      doc.text('Sales Report', 105, 15, { align: 'center' });

      // Add date and info
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy hh:mm a')}`, 105, 22, { align: 'center' });
      doc.text(`Total Invoices: ${rows.length}`, 105, 27, { align: 'center' });

      // Draw line
      doc.setDrawColor(200, 200, 200);
      doc.line(10, 32, 200, 32);

      // Add table data
      const tableData = rows.map((row, index) => [
        index + 1,
        row.invoiceNo,
        row.customer,
        row.soldItems,
        `₹${row.totalAmount?.toFixed(2)}`,
        row.status?.toUpperCase(),
        `₹${row.dueAmount?.toFixed(2)}`,
        format(new Date(row.invoiceDate), 'dd MMM yyyy')
      ]);

      autoTable(doc, {
        startY: 35,
        head: [['#', 'Invoice No', 'Customer', 'Items', 'Total', 'Status', 'Due', 'Date']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [31, 127, 255],
          textColor: [255, 255, 255],
          fontSize: 10
        },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 10, right: 10 }
      });


      // Add footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }

      // Save PDF
      doc.save(`sales_report_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`);

      toast.success(`Exported ${rows.length} invoice(s) as PDF`);

      // Clear selection
      setSelectedRowIds(new Set());
      setAllVisibleSelected(false);

    } catch (error) {
      // console.error('PDF export error:', error);
      toast.error('Failed to generate PDF');
    }
  };

  // Handle date range change
  const handleDateChange = (dates) => {
    // console.log("DatePicker output:", dates);
    setDateRange({
      start: dates.startDate,
      end: dates.endDate
    });
  };

  useEffect(() => {
    fetchSalesList();
  }, [activeTab, search, pagination.page, pagination.limit, dateRange.start, dateRange.end]);

  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
    // Clear selection when filters change
    setSelectedRowIds(new Set());
  }, [activeTab, search, dateRange.start, dateRange.end]);

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

  return (
    <div className="container-fluid p-4" style={{ overflow: "auto", height: "100vh" }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
        <div className="d-flex align-items-center justify-content-center gap-3">
          <h3 style={{
            fontSize: "22px",
            color: "#0E101A",
            fontFamily: '"Inter", sans-serif',
            fontWeight: 500,
            lineHeight: "120%",
          }}>
            Sales Order
          </h3>
        </div>
        <div className="d-flex align-items-center gap-3" style={{ cursor: "pointer" }}>
          {/* <DateFilterDropdown onChange={handleDateChange} /> */}
          <DateFilterDropdown
            onChange={handleDateChange}
            selectedDateRange={dateRange}
            setSelectedDateRange={setDateRange}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-3">
        {statsTop.map((stat, idx) => (
          <Link to={stat.link} key={idx} className="col-12 col-sm-6 col-lg-3" style={{ textDecoration: "none" }}>
            <div className="d-flex justify-content-between align-items-center bg-white position-relative"
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
              <span style={{
                position: "absolute",
                left: 0,
                top: "50%",
                transform: "translateY(-50%)",
                width: "4px",
                height: "70%",
                backgroundColor: "#1F7FFF",
                borderRadius: "1px 10px 1px 10px",
              }}></span>

              <div className="d-flex align-items-center" style={{ gap: "24px" }}>
                <div className="d-flex flex-column" style={{ gap: "11px" }}>
                  <h6 className="mb-0" style={{
                    fontSize: "14px",
                    color: "#727681",
                    fontWeight: "500",
                  }}>
                    {stat.title}
                  </h6>
                  <div className="d-flex align-items-end gap-2">
                    <h5 className="mb-0" style={{
                      fontSize: "22px",
                      color: "#0E101A",
                      fontWeight: "600",
                    }}>
                      {stat.value}
                    </h5>
                    {stat.currency && (
                      <span style={{ fontSize: "14px", color: "#0E101A" }}>
                        {stat.currency}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-center align-items-center rounded-circle"
                style={{
                  width: "50px",
                  height: "50px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5F0FF",
                  flexShrink: 0,
                }}
              >
                <img src={stat.image} alt={stat.title} style={{
                  width: "36px",
                  height: "36px",
                  objectFit: "contain",
                }} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Main Content */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "16px",
        padding: "16px",
        overflowX: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}>
        {/* Tabs and Search */}
        <div className="d-flex"
          style={{
            gap: "20px",
            justifyContent: "space-between",
            width: "100%",
          }}>
          <div className="col-md-6 d-flex align-items-center" style={{ width: "50%" }}>
            <div style={{
              background: "#F3F8FB",
              padding: 2,
              borderRadius: 8,
              display: "flex",
              gap: 8,
              overflowX: "auto",
            }}>
              {tabsData.map((tab) => {
                const active = activeTab === tab.label;
                return (
                  <div key={tab.label} onClick={() => setActiveTab(tab.label)}
                    role="button" style={{
                      padding: "6px 12px",
                      borderRadius: 8,
                      background: active ? "#fff" : "transparent",
                      boxShadow: active ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      cursor: "pointer",
                      width:"fit-content",
                      whiteSpace: "nowrap",
                    }}>
                    <div style={{ fontSize: 14, color: "#0E101A" }}>{tab.label}</div>
                    <div style={{ color: "#727681", fontSize: 14 }}>{tab.count}</div>
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
                placeholder="Search by customer"
                value={search} onChange={(e) => setSearch(e.target.value)}
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

            <button
              onClick={handleExport}
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
                cursor: 'pointer'
              }}>
              <TbFileExport className="fs-5" style={{color:"#6C748C", marginRight: "10px" }} />
              Export
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="" style={{ overflow: "auto", maxHeight: "calc(100vh - 485px)" }}>
          <table
            style={{
              width: "100%",
              borderSpacing: "0 0px",
              fontFamily: "Inter",
            }}
          >
            <thead style={{ position: "sticky", top: 0, zIndex: 9 }}>
              <tr style={{ backgroundColor: "#F3F8FB", textAlign: "left" }}>
                <th
                  style={{
                    padding: "0px 0px",
                    color: "#727681",
                    fontSize: "14px",
                    fontWeight: 400,
                    fontFamily: '"Inter", sans-serif',
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0px", justifyContent: 'center' }}>
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={(e) => {
                        const next = new Set(selectedRowIds);
                        if (e.target.checked) {
                          // Add only current page items
                          sales.forEach(s => next.add(s._id));
                        } else {
                          // Remove only current page items
                          sales.forEach(s => next.delete(s._id));
                        }
                        setSelectedRowIds(next);
                      }}
                    />
                  </div>
                </th>
                <th style={{
                  padding: "12px 16px",
                  color: "#727681",
                  fontSize: "14px",
                  fontWeight: 400,
                  fontFamily: '"Inter", sans-serif',
                }}>
                  Invoice No.
                  <HiOutlineArrowsUpDown style={{ marginLeft: "10px" }} />
                </th>
                <th style={{
                  padding: "12px 16px",
                  color: "#727681",
                  fontSize: "14px",
                  fontWeight: 400,
                  fontFamily: '"Inter", sans-serif',
                }}>
                  Customer Name
                </th>
                <th style={{
                  padding: "12px 16px",
                  color: "#727681",
                  fontSize: "14px",
                  fontWeight: 400,
                  fontFamily: '"Inter", sans-serif',
                }}>
                  Sold Items
                </th>
                <th style={{
                  padding: "12px 16px",
                  color: "#727681",
                  fontSize: "14px",
                  fontWeight: 400,
                  fontFamily: '"Inter", sans-serif',
                }}>
                  Total Amount
                </th>
                <th style={{
                  padding: "12px 16px",
                  color: "#727681",
                  fontSize: "14px",
                  fontWeight: 400,
                  fontFamily: '"Inter", sans-serif',
                }}>
                  Payment Status
                </th>
                <th style={{
                  padding: "12px 16px",
                  color: "#727681",
                  fontSize: "14px",
                  fontWeight: 400,
                  fontFamily: '"Inter", sans-serif',
                }}>
                  Due Amount
                </th>
                <th className="text-center" style={{
                  padding: "12px 16px",
                  color: "#727681",
                  fontSize: "14px",
                  fontWeight: 400,
                  fontFamily: '"Inter", sans-serif',
                }}>
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
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center text-muted py-3">
                    No Record Found
                  </td>
                </tr>
              ) : (
                sales.map((sale, idx) => {
                  const statusStyle = statusStyles[sale.status?.toLowerCase()] || statusStyles.draft;

                  return (
                    <React.Fragment key={sale._id}>
                      <tr onClick={(e) => {e.stopPropagation(); setExpandedRow(expandedRow === idx ? null : idx)}}
                        className={`table-hover ${activeRow === idx ? "active-row" : ""}`}
                        style={{
                          borderBottom: "1px solid #EAEAEA",
                          cursor: 'pointer',
                        }}>
                        <td onClick={(e) => e.stopPropagation()}
                          style={{ padding: "6px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: 'center' }}>
                            <input
                              type="checkbox"
                              checked={selectedRowIds.has(sale._id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                const next = new Set(selectedRowIds);
                                next.has(sale._id) ? next.delete(sale._id) : next.add(sale._id);
                                setSelectedRowIds(next);
                              }}
                            />
                          </div>
                        </td>
                        <td style={{ color: "#0E101A", padding: "6px 16px" }}>{sale.invoiceNo}</td>
                        <td style={{ color: "#0E101A", padding: "6px 16px" }}>{sale.customer}</td>
                        <td style={{ color: "#0E101A", padding: "6px 16px" }}>{sale.soldItems}</td>
                        <td style={{ color: "#0E101A", padding: "6px 16px" }}>₹{sale.totalAmount?.toFixed(2)}</td>
                        <td style={{ color: "#0E101A", padding: "6px 16px" }}>
                          <div style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "2px 16px",
                            borderRadius: 50,
                            background: statusStyle.bg,
                            color: statusStyle.color,
                            fontSize: 14,
                            whiteSpace: "nowrap",
                            fontWeight: 400,
                            fontFamily: '"inter" sans-serif"',
                          }}>
                            {sale.status?.charAt(0).toUpperCase() + sale.status?.slice(1)}
                          </div>
                        </td>
                        <td style={{ color: "#0E101A", padding: "6px 16px" }}>₹{sale.dueAmount?.toFixed(2)}</td>
                        <td
                          style={{
                            padding: "4px 16px",
                            position: "relative",
                            overflow: "visible",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                          }}>
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
                                  ? dropdownPos.y - 150
                                  : dropdownPos.y,
                                left: dropdownPos.x - 120,
                                zIndex: 999999,
                              }}
                            >
                              <div ref={menuRef} style={{
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
                              onClick={(e) => e.stopPropagation()}
                              >
                                {menuItems(sale).map((item) => (
                                  <div key={item.action} onClick={(e) => {
                                    e.stopPropagation();
                                    item.onClick();
                                    setOpenMenu(null);
                                  }} style={{
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
                                    color: item.action === "delete" ? "#dc3545" : "#344054",
                                  }} onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = "#e3f2fd";
                                  }} onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = "transparent";
                                  }}>
                                    <span style={{ fontSize: "18px" }}>{item.icon}</span>
                                    <span>{item.label}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>

                      {/* FIX 5: Expanded Row with correct colSpan */}
                      {expandedRow === idx && (
                        <tr>
                          <td colSpan="8" style={{ padding: 0, border: "none" }}>
                            <div style={{
                              maxHeight: expandedRow === idx ? "1000px" : "0px",
                              overflow: "hidden",
                              transition: "max-height 0.4s ease, padding 0.4s ease",
                              padding: expandedRow === idx ? "16px" : "0 16px",
                              backgroundColor: "#fff",
                            }}>
                              <div style={{ paddingBottom: "8px" }}>
                                <h6 style={{
                                  fontSize: "14px",
                                  fontWeight: 600,
                                  color: "#0E101A",
                                  margin: 0,
                                }}>
                                  Product Details for Invoice: {sale.invoiceNo}
                                </h6>
                              </div>

                              <div style={{ overflowX: "auto" }}>
                                <table className="table mb-0" style={{
                                  width: "100%",
                                  borderCollapse: "separate",
                                  borderSpacing: 0,
                                  fontSize: "14px",
                                  fontFamily: "Inter, sans-serif",
                                }}>
                                  <thead>
                                    <tr style={{ backgroundColor: "#F3F8FB" }}>
                                      {["Product Name", "Item BarCode", "Qty", "Category", "Unit Price", "Total"].map((h) => (
                                        <th key={h} style={{
                                          padding: "10px 16px",
                                          color: "#727681",
                                          fontWeight: 400,
                                          textAlign: "left",
                                        }}>{h}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {/* {console.log("Sale itemsdd:", sale.items)} */}
                                    {sale.items?.map((item, i) => (
                                      <tr key={i}>
                                        <td style={{ padding: "10px 16px", color: "#0E101A" }}>
                                          {item.productName}
                                        </td>
                                        <td style={{ padding: "10px 16px", color: "#0E101A" }}>
                                          {item.itemBarcode || "-"}
                                        </td>
                                        <td style={{ padding: "10px 16px", color: "#0E101A" }}>
                                          {item.qty}
                                        </td>
                                        <td style={{ padding: "10px 16px", color: "#0E101A" }}>
                                          {item.category}
                                        </td>
                                        <td style={{ padding: "10px 16px", color: "#0E101A" }}>
                                          ₹{item.unitPrice?.toFixed(2)}
                                        </td>
                                        <td style={{ padding: "10px 16px", color: "#0E101A" }}>
                                          ₹{item.total?.toFixed(2)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                }))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="page-redirect-btn px-2">
          <Pagination
            currentPage={pagination.page}
            total={pagination.totalPages * pagination.limit}
            itemsPerPage={pagination.limit}
            onPageChange={(page) =>
              setPagination(prev => ({ ...prev, page }))
            }
            onItemsPerPageChange={(val) =>
              setPagination(prev => ({ ...prev, limit: val, page: 1 }))
            }
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
        onConfirm={handleDeleteInvoice}
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice ${selectedInvoice?.invoiceNo}? This action cannot be undone.`}
      />

    </div>
  );
};

export default Sales;