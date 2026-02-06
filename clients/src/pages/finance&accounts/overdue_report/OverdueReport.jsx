import React, { useState, useEffect, useMemo } from "react";
import { IoIosSearch } from "react-icons/io";
import { TbFileExport } from "react-icons/tb";
import { MdArrowDropDown } from "react-icons/md";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { format } from "date-fns";
import api from "../../../pages/config/axiosInstance"; // Use the same api instance
import Pagination from "../../../components/Pagination"

const OverdueReport = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());
  const [allVisibleSelected, setAllVisibleSelected] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [activeRow, setActiveRow] = useState(null)
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

const fetchOverdueSales = async () => {
  setLoading(true);
  try {
    const response = await api.get("/api/invoices/overdue/list");

    if (response.data.success) {
      const data = response.data.invoices;

      const mapped = data.map(inv => ({
        ...inv,
        customerName: inv.customerId?.name || "N/A",
        daysOverdue: Math.max(0, Math.ceil((new Date() - new Date(inv.dueDate)) / (1000 * 60 * 60 *24))),
      }));

      setSales(mapped);
      setPagination(prev => ({
        ...prev,
        total: mapped.length,
        totalPages: Math.ceil(mapped.length / prev.limit),
      }));
    }
  } catch (err) {
    console.error(err);
    toast.error("Failed to load overdue invoices");
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchOverdueSales();
  }, []);

  // Filter sales based on search term
  const filteredSales = useMemo(() => {
    if (!search.trim()) return sales;
    
    const searchTerm = search.toLowerCase();
    return sales.filter(sale =>
      sale.customerName?.toLowerCase().includes(searchTerm) ||
      sale.invoiceNo?.toLowerCase().includes(searchTerm) ||
      sale.referenceNumber?.toLowerCase().includes(searchTerm)
    );
  }, [sales, search]);

  // Get current page sales
  const getCurrentPageSales = () => {
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    return filteredSales.slice(startIndex, endIndex);
  };

  // Handle search
  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Export to PDF
  const handleExportPDF = () => {
    const salesToExport = selectedRowIds.size > 0
      ? filteredSales.filter(sale => selectedRowIds.has(sale._id))
      : filteredSales;

    if (!salesToExport.length) {
      toast.warn("No overdue invoices to export");
      return;
    }

    try {
      const doc = new jsPDF("portrait", "mm", "a4");

      // Add header
      doc.setFontSize(20);
      doc.setTextColor(155, 155, 155);
      doc.text("Overdue Report", 105, 15, { align: "center" });

      // Draw line
      doc.setDrawColor(200, 200, 200);
      doc.line(10, 32, 200, 32);

      // Add table data
      const tableData = salesToExport.map((sale, index) => [
        index + 1,
        sale.customerName,
        sale.invoiceNo || sale.referenceNumber,
        sale.dueDate ? format(new Date(sale.dueDate), "dd/MM/yyyy") : "N/A",
        sale.daysOverdue,
        sale.status,
        `${sale.dueAmount?.toFixed(2)}`,
      ]);

      autoTable(doc, {
        startY: 35,
        head: [
          ["#", "Customer Name", "Invoice No.", "Due Date", "Days Overdue", "Status", "Amount Due"],
        ],
        body: tableData,
        theme: "grid",
        headStyles: {
          fillColor: [155, 155, 155],
          textColor: "white",
          fontSize: 10,
        },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 10, right: 10 },
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
          { align: "center" },
        );
      }

      doc.save(`overdue_report_${format(new Date(), "yyyy-MM-dd_HH-mm")}.pdf`);
      toast.success(`Exported ${salesToExport.length} overdue invoice(s) as PDF`);

      // Clear selection
      setSelectedRowIds(new Set());
      setShowExportDropdown(false);
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to generate PDF");
    }
  };


  // Toggle select all for CURRENT PAGE
  const toggleSelectAll = (e) => {
    const currentPageSales = getCurrentPageSales();
    const next = new Set(selectedRowIds);

    if (e.target.checked) {
      // Add only current page items
      currentPageSales.forEach(sale => next.add(sale._id));
    } else {
      // Remove only current page items
      currentPageSales.forEach(sale => next.delete(sale._id));
    }

    setSelectedRowIds(next);
  };

  // Toggle single selection
  const toggleSelectRow = (id) => {
    const next = new Set(selectedRowIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedRowIds(next);
  };

  // Handle page change
  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }));
  };

  // Handle items per page change
  const handleItemsPerPageChange = (limit) => {
    setPagination(prev => ({
      ...prev,
      limit: parseInt(limit),
      page: 1,
      totalPages: Math.ceil(prev.total / parseInt(limit)),
    }));
  };

  // Update allVisibleSelected for current page
  useEffect(() => {
    const currentPageSales = getCurrentPageSales();
    if (currentPageSales.length > 0) {
      const allSelected = currentPageSales.every(sale => selectedRowIds.has(sale._id));
      setAllVisibleSelected(allSelected);
    } else {
      setAllVisibleSelected(false);
    }
  }, [selectedRowIds, pagination.page, filteredSales]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExportDropdown && !event.target.closest('.export-dropdown-container')) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportDropdown]);

  // Get current page sales
  const currentPageSales = getCurrentPageSales();

  // Tabs configuration (similar to SalesReport)
  const tabs = [
    {
      label: "All",
      count: filteredSales.length,
      active: true,
    },
  ];

  return (
    <div style={{ padding: "16px", fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingBottom: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "11px",
            height: "33px",
          }}
        >
          <h2
            style={{
              margin: 0,
              color: "black",
              fontSize: "22px",
              fontWeight: 500,
              height: "33px",
            }}
          >
            Overdue Report
          </h2>
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          width: "100%",
          minHeight: "auto",
          maxHeight: "calc(100vh - 320px)",
          padding: "16px",
          background: "white",
          borderRadius: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {/* Tabs + Search Bar & Export */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            height: "33px",
          }}
        >
          {/* Tabs - Similar to SalesReport */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              padding: "2px",
              background: "#F3F8FB",
              borderRadius: "8px",
              flexWrap: "wrap",
              maxWidth: "50%",
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
                  borderRadius: "8px",
                  boxShadow: tab.active
                    ? "0px 1px 4px rgba(0, 0, 0, 0.10)"
                    : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "14px",
                  color: "#0E101A",
                }}
              >
                {tab.label}
                <span style={{ color: "#727681" }}>{tab.count}</span>
              </div>
            ))}
          </div>

          {/* Search Bar and Export Button - Aligned like SalesReport */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              width: "50%",
              height: "33px",
              justifyContent: "flex-end",
            }}
          >
            {/* Search Bar - Similar styling to SalesReport */}
            <div
              style={{
                position: "relative",
                display: "flex",
                borderRadius: "8px",
                alignItems: "center",
                background: "#FCFCFC",
                border: "1px solid #EAEAEA",
                gap: "8px",
                color: "rgba(19.75, 25.29, 61.30, 0.40)",
                height: "33px",
                flex: 1,
                maxWidth: "400px",
                padding: "0 10px",
              }}
            >
              <IoIosSearch style={{ fontSize: "20px" }} />
              <input
                type="text"
                placeholder="Search by customer name or invoice number"
                value={search}
                onChange={handleSearch}
                style={{
                  width: "100%",
                  border: "none",
                  outline: "none",
                  fontSize: "14px",
                  background: "transparent",
                  color: "#0E101A",
                  padding: "8px 0",
                }}
              />
            </div>

            {/* Export Button with Dropdown - Similar to SalesReport but with dropdown */}
            <div className="export-dropdown-container" style={{ position: "relative" }}>
              <button
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  background: "#FCFCFC",
                  borderRadius: "8px",
                  border: "1px solid #EAEAEA",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 400,
                  color: "#0E101A",
                  height: "33px",
                  minWidth: "120px",
                }}
                 onClick={handleExportPDF}
              >
                <TbFileExport style={{ fontSize: "18px", color: "#6B7280" }} />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div
          style={{
            overflowY: "auto",
            maxHeight: "510px",
            borderRadius: "8px",
            border: "1px solid #EAEAEA",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead
              style={{
                position: "sticky",
                top: 0,
                zIndex: 10,
                height: "38px",
                background: "#F3F8FB",
              }}
            >
              <tr>
                <th
                  style={{
                    textAlign: "left",
                    padding: "8px 16px",
                    color: "#727681",
                    fontSize: "14px",
                    width: "80px",
                    fontWeight: 400,
                    borderBottom: "1px solid #EAEAEA",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: "12px" }}
                  >
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAll}
                      style={{ width: "18px", height: "18px", cursor: "pointer" }}
                    />
                    Customer
                  </div>
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "8px 16px",
                    color: "#727681",
                    fontSize: "14px",
                    width: "150px",
                    fontWeight: 400,
                    borderBottom: "1px solid #EAEAEA",
                  }}
                >
                  Invoice No.
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "8px 16px",
                    color: "#727681",
                    fontSize: "14px",
                    width: "120px",
                    fontWeight: 400,
                    borderBottom: "1px solid #EAEAEA",
                  }}
                >
                  Due Date
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "8px 16px",
                    color: "#727681",
                    fontSize: "14px",
                    width: "100px",
                    fontWeight: 400,
                    borderBottom: "1px solid #EAEAEA",
                  }}
                >
                  Days Overdue
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "8px 16px",
                    color: "#727681",
                    fontSize: "14px",
                    width: "100px",
                    fontWeight: 400,
                    borderBottom: "1px solid #EAEAEA",
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "8px 16px",
                    color: "#727681",
                    fontSize: "14px",
                    width: "120px",
                    fontWeight: 400,
                    borderBottom: "1px solid #EAEAEA",
                  }}
                >
                  Amount Due
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>
                    <div style={{ 
                      width: "24px", 
                      height: "24px", 
                      border: "2px solid #3B82F6", 
                      borderTop: "2px solid transparent",
                      borderRadius: "50%", 
                      animation: "spin 1s linear infinite",
                      margin: "0 auto"
                    }} />
                    <span style={{ marginTop: "8px", display: "block", color: "#6B7280" }}>
                      Loading...
                    </span>
                  </td>
                </tr>
              ) : currentPageSales.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "20px", color: "#6B7280" }}>
                    {search ? "No overdue invoices found matching your search" : "No overdue invoices found"}
                  </td>
                </tr>
              ) : (
                currentPageSales.map((sale, index) => (
                  <tr 
                  className={`table-hover ${activeRow === index ? "active-row" : ""}`}
                    key={sale._id} 
                    style={{ 
                      borderBottom: "1px solid #F3F4F6",
                      backgroundColor: index % 2 === 0 ? "#FFFFFF" : "",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#F3F8FB";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = index % 2 === 0 ? "#FFFFFF" : "#F9FAFB";
                    }}
                  >
                    {/* Customer Name */}
                    <td
                      style={{
                        padding: "12px 16px",
                        verticalAlign: "middle",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedRowIds.has(sale._id)}
                          onChange={() => toggleSelectRow(sale._id)}
                          style={{ width: "18px", height: "18px", cursor: "pointer" }}
                        />
                        <div
                          style={{
                            fontSize: "14px",
                            color: "#0E101A",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: "200px",
                          }}
                        >
                          {sale.customerName}
                        </div>
                      </div>
                    </td>

                    {/* Invoice No */}
                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: "14px",
                        color: "#0E101A",
                      }}
                    >
                      {sale.invoiceNo || sale.referenceNumber || "N/A"}
                    </td>

                    {/* Due Date */}
                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: "14px",
                        color: "#0E101A",
                      }}
                    >
                      {sale.dueDate ? format(new Date(sale.dueDate), "dd/MM/yyyy") : "N/A"}
                    </td>

                    {/* Days Overdue */}
                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: "14px",
                        color: "#0E101A",
                      }}
                    >
                      <span
                        style={{
                          padding: "4px 12px",
                          borderRadius: "12px",
                          backgroundColor: "#FCE4E6",
                          color: "#DC2626",
                          fontSize: "12px",
                          fontWeight: 500,
                          display: "inline-block",
                        }}
                      >
                        {sale.daysOverdue} days
                      </span>
                    </td>

                    {/* Status */}
                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: "14px",
                        color: "#0E101A",
                      }}
                    >
                      <span
                        style={{
                          padding: "4px 12px",
                          borderRadius: "12px",
                          backgroundColor: 
                            sale.status === "paid" ? "#DCFCE7" :
                            sale.status === "partial" ? "#FEF9C3" : "#FCE4E6",
                          color: 
                            sale.status === "paid" ? "#166534" :
                            sale.status === "partial" ? "#854D0E" : "#DC2626",
                          fontSize: "12px",
                          fontWeight: 500,
                          textTransform: "capitalize",
                          display: "inline-block",
                        }}
                      >
                        {sale.status || "overdue"}
                      </span>
                    </td>

                    {/* Amount Due */}
                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: "14px",
                        color: "#0E101A",
                        fontWeight: 600,
                      }}
                    >
                      ₹{sale.dueAmount?.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
                <div className="page-redirect-btn px-2">
                  <Pagination
                    currentPage={pagination.page}
                    total={pagination.total}
                    itemsPerPage={pagination.limit}
                    onPageChange={(page) =>
                      setPagination((prev) => ({ ...prev, page }))
                    }
                    onItemsPerPageChange={(val) =>
                      setPagination((prev) => ({ ...prev, limit: val, page: 1 }))
                    }
                  />
                </div>
      </div>

      {/* Add CSS for spinner animation */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default OverdueReport;