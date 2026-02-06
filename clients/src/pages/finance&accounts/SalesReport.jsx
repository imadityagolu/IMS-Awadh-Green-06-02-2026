import React, { useEffect, useState, useRef } from "react";
import { IoIosSearch } from "react-icons/io";
import { FaBarcode } from "react-icons/fa6";
import { TbFileExport } from "react-icons/tb";
import Pagination from "../../components/Pagination";
import Barcode from "../../assets/images/barcode.jpg";
import api from "../../pages/config/axiosInstance";
import { toast } from "react-toastify";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import JsBarcode from "jsbarcode";

function SalesReport() {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewBarcode, setViewBarcode] = useState(false);
  const [selectedBarcode, setSelectedBarcode] = useState(null);
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());
  const [allVisibleSelected, setAllVisibleSelected] = useState(false);
  const [productInventory, setProductInventory] = useState({}); // Store product inventory
  const [activeRow, setActiveRow] = useState(null);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Store aggregated products
  const [aggregatedProducts, setAggregatedProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);

  // Fetch product inventory
  const fetchProductInventory = async () => {
    try {
      const response = await api.get("/api/products");

      const inventoryMap = {};

      response.data.products.forEach((product) => {
        inventoryMap[product._id] = product.stockQuantity;

        if (product.itemBarcode) {
          inventoryMap[product.itemBarcode] = product.stockQuantity;
        }

        if (product.productName) {
          inventoryMap[product.productName] = product.stockQuantity;
        }
      });

      setProductInventory(inventoryMap);
    } catch (error) {
      // console.error("Error fetching inventory:", error);
    }
  };

  // Calculate product statistics from sales data with search filtering
  const calculateProductStats = (sales, searchTerm = "") => {
    const productMap = new Map();
    let totalRevenue = 0;
    let totalUnitsSold = 0;

    sales.forEach((sale) => {
      totalRevenue += sale.totalAmount || 0;

      if (sale.items && sale.items.length > 0) {
        sale.items.forEach((item) => {
          const productId = item.productId || item.productName;
          const productName = item.productName?.toLowerCase() || "";
          const productCode = item.itemBarcode || productId;

          // Filter by search term if provided
          if (
            searchTerm &&
            !productName.includes(searchTerm.toLowerCase()) &&
            !productCode.toLowerCase().includes(searchTerm.toLowerCase())
          ) {
            return; // Skip if doesn't match search
          }

          if (!productMap.has(productId)) {
            productMap.set(productId, {
              id: productId,
              name: item.productName,
              code: productCode,
              unitSold: 0,
              revenue: 0,
              availableQty:
                productInventory[item.productId] ??
                productInventory[item.itemBarcode] ??
                productInventory[item.productName] ??
                0,

              unitPrice: item.unitPrice || 0,
            });
          }

          const product = productMap.get(productId);
          const qty = parseInt(item.qty) || 0;
          product.unitSold += qty;
          product.revenue += item.total || (item.unitPrice || 0) * qty;
          totalUnitsSold += qty;
        });
      }
    });

    // Convert to array and sort by unitSold (descending)
    const productsArray = Array.from(productMap.values()).sort(
      (a, b) => b.unitSold - a.unitSold,
    );

    return {
      products: productsArray,
      totalProducts: productsArray.length,
      totalRevenue,
      totalUnitsSold,
    };
  };

  // Fetch sales data - get ALL sales without pagination for aggregation
  const fetchAllSalesData = async () => {
    setLoading(true);
    try {
      // First fetch product inventory
      await fetchProductInventory();

      // Fetch ALL sales data without pagination for aggregation
      const params = {
        page: 1,
        limit: 1000, // Large limit to get all data
        search: "", // We'll handle search client-side for products
      };

      const response = await api.get("/api/invoices/sales/list", { params });

      if (response.data.success) {
        const sales = response.data.data.sales;
        setSalesData(sales);

        // Calculate initial product statistics
        const productStats = calculateProductStats(sales, search, productInventory);
        setAggregatedProducts(productStats.products);
        setFilteredProducts(productStats.products);

        // Set pagination for the filtered products
        const totalFiltered = productStats.products.length;
        setPagination((prev) => ({
          ...prev,
          page: 1,
          total: totalFiltered,
          totalPages: Math.ceil(totalFiltered / prev.limit),
        }));
      }
    } catch (error) {
      // console.error("Error fetching sales data:", error);
      toast.error("Failed to load sales report");
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = (e) => {
    const searchTerm = e.target.value;
    setSearch(searchTerm);

    if (!searchTerm) {
      // Reset to all products
      setFilteredProducts(aggregatedProducts);
      const total = aggregatedProducts.length;
      setPagination((prev) => ({
        ...prev,
        page: 1,
        total: total,
        totalPages: Math.ceil(total / prev.limit),
      }));
    } else {
      // Filter products based on search term
      const filtered = aggregatedProducts.filter(
        (product) =>
          product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.code?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredProducts(filtered);
      const total = filtered.length;
      setPagination((prev) => ({
        ...prev,
        page: 1,
        total: total,
        totalPages: Math.ceil(total / prev.limit),
      }));
    }
  };

  // Get current page products
  const getCurrentPageProducts = () => {
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    return filteredProducts.slice(startIndex, endIndex);
  };

  // Export to PDF
  const handleExport = () => {
    const productsToExport =
      selectedRowIds.size > 0
        ? filteredProducts.filter((product) => selectedRowIds.has(product.code))
        : filteredProducts;

    if (!productsToExport.length) {
      toast.warn("No products to export");
      return;
    }

    try {
      const doc = new jsPDF("portrait", "mm", "a4");

      // Add header
      doc.setFontSize(20);
      doc.setTextColor(155, 155, 155);
      doc.text("Sales Product Report", 105, 15, { align: "center" });

      // Draw line
      doc.setDrawColor(200, 200, 200);
      doc.line(10, 32, 200, 32);


      // Add table data
      const tableData = productsToExport.map((row, index) => [
        index + 1,
        row.name,
        row.code,
        row.unitSold,
        `${row.revenue?.toFixed(2)}`,
        row.openingQuantity ?? row.availableQty ?? 0,
      ]);

      autoTable(doc, {
        startY: 35,
        head: [
          [
            "#",
            "Product Name",
            "Item Code",
            "Units Sold",
            "Sales Revenue",
            "Available Qty(Current Stock)",
          ],
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

      doc.save(
        `sales_product_report_${format(new Date(), "yyyy-MM-dd_HH-mm")}.pdf`,
      );
      toast.success(`Exported ${productsToExport.length} product(s) as PDF`);

      // Clear selection
      setSelectedRowIds(new Set());
      setAllVisibleSelected(false);
    } catch (error) {
      // console.error("PDF export error:", error);
      toast.error("Failed to generate PDF");
    }
  };

  // Toggle select all for CURRENT PAGE
  const toggleSelectAll = (e) => {
    const currentPageProducts = getCurrentPageProducts();
    const next = new Set(selectedRowIds);

    if (e.target.checked) {
      // Add only current page items
      currentPageProducts.forEach((product) => next.add(product.code));
    } else {
      // Remove only current page items
      currentPageProducts.forEach((product) => next.delete(product.code));
    }

    setSelectedRowIds(next);
  };

  // Toggle single selection
  const toggleSelectRow = (code) => {
    const next = new Set(selectedRowIds);
    next.has(code) ? next.delete(code) : next.add(code);
    setSelectedRowIds(next);
  };

  // Show barcode modal
  const showBarcode = (product) => {
    setSelectedBarcode(product);
    setViewBarcode(true);
  };

  // Close barcode modal
  const closeBarcode = () => {
    setViewBarcode(false);
    setSelectedBarcode(null);
  };

  // Recalculate when product inventory updates
  useEffect(() => {
    if (salesData.length > 0 && Object.keys(productInventory).length > 0) {
      const productStats = calculateProductStats(salesData, search, productInventory);
      setAggregatedProducts(productStats.products);
      setFilteredProducts(productStats.products);

      const total = productStats.products.length;
      setPagination((prev) => ({
        ...prev,
        page: 1,
        total: total,
        totalPages: Math.ceil(total / prev.limit),
      }));
    }
  }, [productInventory, salesData, search]);

  // Initial data fetch
  useEffect(() => {
    fetchAllSalesData();
  }, []);

  // Update allVisibleSelected for current page
  useEffect(() => {
    const currentPageProducts = getCurrentPageProducts();
    if (currentPageProducts.length > 0) {
      const allSelected = currentPageProducts.every((product) =>
        selectedRowIds.has(product.code),
      );
      setAllVisibleSelected(allSelected);
    } else {
      setAllVisibleSelected(false);
    }
  }, [selectedRowIds, pagination.page, filteredProducts]);

  // Close barcode when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (viewBarcode && !event.target.closest(".barcode-modal")) {
        closeBarcode();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [viewBarcode]);

  // Get current page products
  const currentPageProducts = getCurrentPageProducts();

  const tabs = [
    {
      label: "All",
      count: filteredProducts.length,
      active: true,
    },
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
            Sales Report
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
                    Product Name
                  </div>
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    width: 200,
                    fontWeight: "400",
                  }}
                >
                  Item Code
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    width: 123,
                    fontWeight: "400",
                  }}
                >
                  Unit Sold
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    width: 112,
                    fontWeight: "400",
                  }}
                >
                  Sales Revenue
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    width: 100,
                    fontWeight: "400",
                  }}
                >
                  Available Qty(Current Stock)
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
              ) : currentPageProducts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center text-muted py-3">
                    No products found
                  </td>
                </tr>
              ) : (
                <>
                  {/* {console.log("Rendering products:", currentPageProducts)}, */}
                </>,
                currentPageProducts.map((product, index) => (
                  <tr
                    className={`table-hover ${activeRow === index ? "active-row" : ""}`}
                    key={index} style={{ borderBottom: "1px solid #FCFCFC" }}>
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
                          checked={selectedRowIds.has(product.code)}
                          onChange={() => toggleSelectRow(product.code)}
                          style={{ width: 18, height: 18 }}
                        />
                        <div
                          style={{
                            fontSize: 14,
                            color: "#0E101A",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {product.name}
                        </div>
                      </div>
                    </td>

                    {/* Item Code */}
                    <td
                      style={{
                        padding: "8px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          cursor: "pointer",
                        }}
                        onClick={() => showBarcode(product)}
                      >
                        {product.code}
                        <FaBarcode className="fs-6 text-secondary" />
                      </div>
                    </td>

                    {/* Unit Sold */}
                    <td
                      style={{
                        padding: "8px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                      }}
                    >
                      {product.unitSold}
                    </td>

                    {/* Sales Revenue */}
                    <td
                      style={{
                        padding: "8px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                      }}
                    >
                      ₹{product.revenue?.toFixed(2)}
                    </td>

                    {/* Available Quantity */}
                    <td
                      style={{
                        padding: "8px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                      }}
                    >
                      {product.availableQty}
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
                  <span>{selectedBarcode.name} /</span>
                  <span>₹{selectedBarcode.unitPrice}/-</span>
                </div>
                {/* <img src={Barcode} alt="Barcode" style={{ width: "100%" }} />
                <div style={{ textAlign: "center", color: "#666" }}>
                  {selectedBarcode.code}
                </div> */}
                <div className="d-flex justify-content-center align-items-center">
                  <svg id={`barcode-svg-${selectedBarcode.code}`}></svg>
                </div>
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

export default SalesReport;
