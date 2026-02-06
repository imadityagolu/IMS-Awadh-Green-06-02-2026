import React, { useEffect, useState, useRef } from "react";
import { IoIosSearch } from "react-icons/io";
import { FaBarcode } from "react-icons/fa6";
import { TbFileExport } from "react-icons/tb";
import Pagination from "../../components/Pagination";
import Barcode from "../../assets/images/barcode.jpg";
import api from "../../pages/config/axiosInstance";
import { toast } from "react-toastify";
import { format, parseISO } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import JsBarcode from "jsbarcode";

function InventoryReport() {
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewBarcode, setViewBarcode] = useState(false);
  const [selectedBarcode, setSelectedBarcode] = useState(null);
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());
  const [allVisibleSelected, setAllVisibleSelected] = useState(false);
  const [activeRow, setActiveRow] = useState(null);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [activeTab, setActiveTab] = useState("All");
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    in: 0,
    out: 0
  });

  // Fetch and combine data from multiple sources
  const fetchInventoryData = async () => {
    setLoading(true);
    try {
      // Fetch data from multiple sources in parallel
      const [salesRes, purchasesRes, productsRes] = await Promise.all([
        api.get("/api/invoices/sales/list", { params: { page: 1, limit: 1000 } }),
        api.get("/api/purchase-orders", { params: { page: 1, limit: 1000 } }),
        api.get("/api/products", { params: { page: 1, limit: 1000 } })
      ]);

      // Get product mapping for quick lookup
      const productMap = {};
      const products = productsRes.data.products || productsRes.data || [];
      products.forEach(product => {
        if (product._id) {
          productMap[product._id] = {
            name: product.productName,
            category: product.category?.categoryName || "Uncategorized",
            barcode: product.itemBarcode,
            price: product.sellingPrice
          };
        }
      });

      // Process sales data (Stock Out)
      const salesData = salesRes.data.data?.sales || salesRes.data.sales || [];
      const salesTransactions = [];

      salesData.forEach(sale => {
        if (sale.items && sale.items.length > 0) {
          sale.items.forEach((item, idx) => {
            const pId = item.productId;
            const product = (pId && productMap[pId]) || {};

            const transaction = {
              id: `${sale._id}-${pId || idx}`,
              productName: product.name || item.productName || item.itemName || "Unknown Product",
              category: product.category || item.category || "Uncategorized",
              itemBarcode: product.barcode || item.itemBarcode,
              // Use invoiceDate for date and time
              date: sale.invoiceDate || sale.createdAt,
              time: sale.invoiceDate || sale.createdAt,
              quantity: Math.abs(parseInt(item.qty) || 0),
              status: "Out", // Sales = Stock Out
              source: "Sales",
              referenceId: sale.invoiceNo || sale._id,
              price: item.unitPrice || product.price || 0,
              transactionDate: sale.invoiceDate, // Store original date
              transactionTime: sale.invoiceDate, // Store original time
            };
            salesTransactions.push(transaction);
          });
        }
      });

      // Process purchase data (Stock In)
      const purchaseData = purchasesRes.data.invoices || purchasesRes.data.purchases || [];
      const purchaseTransactions = [];

      purchaseData.forEach(purchase => {
        if (purchase.items && purchase.items.length > 0) {
          purchase.items.forEach((item, idx) => {
            // item.productId might be populated object or just ID
            const pId = item.productId?._id || item.productId;
            const productDetailsFromItem = typeof item.productId === 'object' ? item.productId : {};
            const product = (pId && productMap[pId]) || {};

            const transaction = {
              id: `${purchase._id}-${pId || idx}`,
              productName: product.name || productDetailsFromItem.productName || item.itemName || "Unknown Product",
              category: product.category || productDetailsFromItem.category?.categoryName || "Uncategorized",
              itemBarcode: product.barcode || productDetailsFromItem.itemBarcode || item.itemBarcode,
              // Use invoiceDate for date and time
              date: purchase.invoiceDate || purchase.createdAt,
              time: purchase.invoiceDate || purchase.createdAt,
              quantity: Math.abs(parseInt(item.qty) || 0),
              status: "In", // Purchases = Stock In
              source: "Purchase",
              referenceId: purchase.invoiceNo || purchase._id,
              price: item.unitPrice || product.price || 0,
              transactionDate: purchase.invoiceDate, // Store original date
              transactionTime: purchase.invoiceDate, // Store original time
            };
            purchaseTransactions.push(transaction);
          });
        }
      });

      // Combine all transactions
      let allTransactions = [...purchaseTransactions, ...salesTransactions];

      // Sort by transaction date (newest first)
      allTransactions.sort((a, b) => {
        const dateA = new Date(a.transactionDate || a.date);
        const dateB = new Date(b.transactionDate || b.date);
        return dateB - dateA; // Newest first
      });

      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase();
        allTransactions = allTransactions.filter(transaction =>
          transaction.productName?.toLowerCase().includes(searchLower) ||
          transaction.category?.toLowerCase().includes(searchLower) ||
          transaction.itemBarcode?.toLowerCase().includes(searchLower) ||
          transaction.referenceId?.toLowerCase().includes(searchLower)
        );
      }

      // Apply status filter
      if (activeTab !== "All") {
        const status = activeTab === "Stock In" ? "In" : "Out";
        allTransactions = allTransactions.filter(transaction => transaction.status === status);
      }

      // Calculate counts
      const allCount = [...purchaseTransactions, ...salesTransactions].length;
      const inCount = purchaseTransactions.length;
      const outCount = salesTransactions.length;

      setStatusCounts({
        all: allCount,
        in: inCount,
        out: outCount
      });

      // Apply pagination
      const total = allTransactions.length;
      const startIndex = (pagination.page - 1) * pagination.limit;
      const endIndex = startIndex + pagination.limit;
      const paginatedData = allTransactions.slice(startIndex, endIndex);

      setInventoryData(paginatedData);
      setPagination(prev => ({
        ...prev,
        total: total,
        totalPages: Math.ceil(total / prev.limit)
      }));

    } catch (error) {
      // console.error("Error fetching inventory data:", error);
      toast.error("Failed to load inventory report");
      setInventoryData([]);
      setStatusCounts({ all: 0, in: 0, out: 0 });
    } finally {
      setLoading(false);
    }
  };

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination(prev => ({ ...prev, page: 1 }));
      fetchInventoryData();
    }, 300);

    return () => clearTimeout(timer);
  }, [search, activeTab]);

  // Fetch data on component mount and page change
  useEffect(() => {
    fetchInventoryData();
  }, [pagination.page]);

  // Handle search input
  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  // Export to PDF
  const handleExport = () => {
    const dataToExport = selectedRowIds.size > 0
      ? inventoryData.filter((item) => selectedRowIds.has(item.id))
      : inventoryData;

    if (!dataToExport.length) {
      toast.warn("No data to export");
      return;
    }

    try {
      const doc = new jsPDF("portrait", "mm", "a4");

      // Add header
      doc.setFontSize(20);
      doc.setTextColor(155, 155, 155);
      doc.text("Inventory Report", 105, 15, { align: "center" });

      // Add date and info
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${format(new Date(), "dd MMM yyyy hh:mm a")}`, 105, 22, { align: "center" });
      doc.text(`Total Records: ${dataToExport.length}`, 105, 27, { align: "center" });

      // Draw line
      doc.setDrawColor(200, 200, 200);
      doc.line(10, 32, 200, 32);

      // Add table data
      const tableData = dataToExport.map((item, index) => [
        index + 1,
        item.productName || "N/A",
        item.category || "N/A",
        formatDate(item.transactionDate || item.date),
        formatTime(item.transactionTime || item.time),
        `${item.quantity} Stock ${item.status}`,
        item.source
      ]);

      autoTable(doc, {
        startY: 35,
        head: [
          ["#", "Product", "Category", "Date", "Time", "Movement", "Source"]
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
          { align: "center" }
        );
      }

      doc.save(`inventory_report_${format(new Date(), "yyyy-MM-dd_HH-mm")}.pdf`);
      toast.success(`Exported ${dataToExport.length} record(s) as PDF`);

      // Clear selection
      setSelectedRowIds(new Set());
      setAllVisibleSelected(false);
    } catch (error) {
      // console.error("PDF export error:", error);
      toast.error("Failed to generate PDF");
    }
  };

  // Toggle select all for current page
  const toggleSelectAll = (e) => {
    const next = new Set(selectedRowIds);
    if (e.target.checked) {
      inventoryData.forEach(item => {
        if (item.id) next.add(item.id);
      });
    } else {
      inventoryData.forEach(item => {
        if (item.id) next.delete(item.id);
      });
    }
    setSelectedRowIds(next);
  };

  // Toggle single selection
  const toggleSelectRow = (id) => {
    const next = new Set(selectedRowIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedRowIds(next);
  };

  // Show barcode modal
  const showBarcode = (item) => {
    if (item?.itemBarcode) {
      setSelectedBarcode(item);
      setViewBarcode(true);
    }
  };

  // Close barcode modal
  const closeBarcode = () => {
    setViewBarcode(false);
    setSelectedBarcode(null);
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Format date - Use invoiceDate
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      // Try parsing ISO string
      return format(parseISO(dateString), "dd/MM/yyyy");
    } catch (error) {
      try {
        // Try as regular date
        return format(new Date(dateString), "dd/MM/yyyy");
      } catch {
        return "Invalid Date";
      }
    }
  };

  // Format time - Use invoiceDate
  const formatTime = (dateString) => {
    if (!dateString) return "N/A";
    try {
      // Try parsing ISO string
      return format(parseISO(dateString), "hh:mm a");
    } catch (error) {
      try {
        // Try as regular date
        return format(new Date(dateString), "hh:mm a");
      } catch {
        return "Invalid Time";
      }
    }
  };

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (viewBarcode && !event.target.closest(".barcode-modal")) {
        closeBarcode();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [viewBarcode]);

  // Update allVisibleSelected for current page
  useEffect(() => {
    if (inventoryData.length > 0) {
      const allSelected = inventoryData.every(item => item.id && selectedRowIds.has(item.id));
      setAllVisibleSelected(allSelected);
    } else {
      setAllVisibleSelected(false);
    }
  }, [selectedRowIds, inventoryData]);

  // Generate barcode when modal opens
  useEffect(() => {
    if (viewBarcode && selectedBarcode?.itemBarcode) {
      try {
        JsBarcode(`#barcode-svg-${selectedBarcode.itemBarcode}`, selectedBarcode.itemBarcode, {
          format: "CODE128",
          width: 2,
          height: 100,
          displayValue: true,
        });
      } catch (error) {
        // console.error("Barcode generation error:", error);
      }
    }
  }, [viewBarcode, selectedBarcode]);

  const tabs = [
    { label: "All", count: statusCounts.all, active: activeTab === "All" },
    { label: "Stock In", count: statusCounts.in, active: activeTab === "Stock In" },
    { label: "Stock Out", count: statusCounts.out, active: activeTab === "Stock Out" },
  ];

  // Handle Barcode rendering for list view popup
  useEffect(() => {
    if (viewBarcode && selectedBarcode && selectedBarcode.code) {
      setTimeout(() => {
        const element = document.getElementById(`barcode-svg-${selectedBarcode.code}`);
        if (element) {
          try {
            let format = "CODE128";
            // if (/^\d{12,13}$/.test(selectedBarcode.code)) format = "EAN13";
            JsBarcode(element, selectedBarcode.code, {
              format: format,
              lineColor: "#000",
              width: 2,
              height: 100,
              displayValue: true,
            });
          } catch (e) {
            // Fallback or retry
            try {
              JsBarcode(element, selectedBarcode.code, {
                format: "CODE128",
                lineColor: "#000",
                width: 2,
                height: 100,
                displayValue: true,
              });
            } catch (err) {
              // console.error("Barcode generation failed", err);
            }
          }
        }
      }, 100);
    }
  }, [viewBarcode, selectedBarcode]);

  return (
    <div className="px-4 py-4">
      {/* Header */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0px 0px 16px 0px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 11,
            height: "33px",
          }}
        >
          <h2
            style={{
              margin: 0,
              color: "black",
              fontSize: 22,
              fontFamily: "Inter, sans-serif",
              fontWeight: 500,
              height: "33px",
            }}
          >
            Inventory Report
          </h2>
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          width: "100%",
          minHeight: "auto",
          maxHeight: "calc(100vh - 320px)",
          padding: 16,
          background: "white",
          borderRadius: 16,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          fontFamily: "Inter, sans-serif",
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
          {/* Tabs */}
          <div
            style={{
              display: "flex",
              gap: 8,
              padding: 2,
              background: "#F3F8FB",
              borderRadius: 8,
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
                  borderRadius: 8,
                  boxShadow: tab.active
                    ? "0px 1px 4px rgba(0, 0, 0, 0.10)"
                    : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 14,
                  color: "#0E101A",
                  cursor: "pointer",
                }}
                onClick={() => handleTabChange(tab.label)}
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
              width: "50%",
              height: "33px",
            }}
          >
            {/* Search Bar */}
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
              <IoIosSearch style={{ fontSize: "25px" }} />
              <input
                type="text"
                placeholder="Search by product name or code"
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
          style={{
            overflowY: "auto",
            maxHeight: "510px",
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
              }}
            >
              <tr style={{ background: "#F3F8FB" }}>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    width: 80,
                    fontWeight: "400",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAll}
                      style={{ width: 18, height: 18 }}
                    />
                    Product Name & Item Code
                  </div>
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    width: 150,
                    fontWeight: "400",
                  }}
                >
                  Category
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    width: 120,
                    fontWeight: "400",
                  }}
                >
                  Date
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    width: 120,
                    fontWeight: "400",
                  }}
                >
                  Time
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    width: 150,
                    fontWeight: "400",
                  }}
                >
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : inventoryData.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center text-muted py-3">
                    No inventory records found
                  </td>
                </tr>
              ) : (
                inventoryData.map((item, index) => (
                  <tr
                    key={item.id || index}
                    className={`table-hover ${activeRow === index ? "active-row" : ""}`}
                    style={{ borderBottom: "1px solid #FCFCFC" }}
                  >
                    {/* Product Name */}
                    <td
                      style={{
                        padding: "8px 16px",
                        verticalAlign: "middle",
                        height: "46px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedRowIds.has(item.id)}
                          onChange={() => toggleSelectRow(item.id)}
                          style={{ width: 18, height: 18 }}
                        />
                        <div
                          style={{
                            fontSize: 14,
                            color: "#0E101A",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.productName || "N/A"}
                          {item.itemBarcode && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                cursor: "pointer",
                                fontSize: 12,
                                color: "#666",
                                marginTop: 2,
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                showBarcode(item);
                              }}
                            >
                              {item.itemBarcode}
                              <FaBarcode className="fs-6 text-secondary" />
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td
                      style={{
                        padding: "8px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                      }}
                    >
                      {item.category || "N/A"}
                    </td>

                    {/* Date - Using transactionDate (invoiceDate) */}
                    <td
                      style={{
                        padding: "8px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                      }}
                    >
                      {formatDate(item.transactionDate || item.date)}
                    </td>

                    {/* Time - Using transactionTime (invoiceDate) */}
                    <td
                      style={{
                        padding: "8px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                      }}
                    >
                      {formatTime(item.transactionTime || item.time)}
                    </td>

                    {/* Status */}
                    <td
                      style={{
                        padding: "8px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                      }}
                    >
                      <span
                        style={{
                          color: item.status === "In" ? "green" : "red",
                          fontWeight: "600",
                        }}
                      >
                        {item.quantity} Stock {item.status}
                      </span>
                      <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                        Source: {item.source} ({item.referenceId})
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Barcode Modal */}
        {viewBarcode && selectedBarcode && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 999999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              className="barcode-modal"
              style={{
                width: "70%",
                backgroundColor: "#f5f4f4ff",
                borderRadius: 16,
                padding: 24,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: "400px",
                  height: "auto",
                  backgroundColor: "white",
                  boxShadow: "10px 10px 40px rgba(0,0,0,0.10)",
                  borderRadius: 16,
                  padding: 16,
                  border: "2px solid #dbdbdbff",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", gap: "10px" }}>
                  <span>{selectedBarcode.productName} /</span>
                  <span>₹{selectedBarcode.price || "0"}/-</span>
                </div>
                {selectedBarcode.itemBarcode ? (
                  <>
                    {/* <img src={Barcode} alt="Barcode" style={{ width: "100%" }} />
                    <div style={{ textAlign: "center", color: "#666" }}>
                      {selectedBarcode.itemBarcode}
                    </div> */}
                    <div className="d-flex justify-content-center align-items-center">
                      <svg id={`barcode-svg-${selectedBarcode.itemBarcode}`}></svg>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: "center", color: "#666", padding: "20px" }}>
                    No barcode available
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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
    </div>
  );
}

export default InventoryReport;