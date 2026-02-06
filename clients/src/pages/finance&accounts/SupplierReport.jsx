import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import api from "../../pages/config/axiosInstance";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import JsBarcode from "jsbarcode";

import { IoIosSearch, IoIosArrowDown } from "react-icons/io";
import { FaArrowLeft, FaBarcode, FaFileImport } from "react-icons/fa6";
import { MdOutlineViewSidebar, MdAddShoppingCart } from "react-icons/md";
import { TbFileImport, TbFileExport } from "react-icons/tb";
import { TiTick } from "react-icons/ti";

import SupplierLogo from '../../assets/images/SupplierLogo.png';
import Pagination from "../../components/Pagination";
import Barcode from "../../assets/images/barcode.jpg";

function SupplierReport() {
  const navigate = useNavigate();
  const location = useLocation();
  const [viewBarcode, setViewBarcode] = useState(null);
  const [viewOptions, setViewOptions] = useState([]);

  const buttonRefs = useRef([]);
  const modelRef = useRef(null); // reference to modal area

  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierData, setSupplierData] = useState([]);
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());

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
  }, [viewBarcode, viewOptions]);

  const tabs = [{ label: "All", count: 156, active: true }];

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/suppliers");
      setSuppliers(res.data.suppliers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSupplierStatistics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(itemsPerPage),
        search: String(searchTerm || "")
      }).toString();
      const res = await api.get(`/api/purchase-orders/supplier/${selectedSupplier}?${params}`);
      // console.log("Supplier statistics:", res.data);
      const data = res?.data;
      const list = Array.isArray(data?.invoices)
        ? data.invoices
        : Array.isArray(data?.data)
          ? data.data
          : [];
      setSupplierData(list);
      setTotalInvoices(Number(data?.pagination?.total || list.length || 0));
    } catch (err) {
      toast.error("Failed to load supplier statistics");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (selectedSupplier) {
      fetchSupplierStatistics();
    }
  }, [selectedSupplier, page, itemsPerPage, searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const handleSelectRow = (id) => {
    const newSelected = new Set(selectedRowIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRowIds(newSelected);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRowIds(new Set(supplierData.map((item) => item._id)));
    } else {
      setSelectedRowIds(new Set());
    }
  };

  useEffect(() => {
    setSelectedRowIds(new Set());
  }, [supplierData]);

  const handlePdf = () => {
    const doc = new jsPDF();
    doc.text("Supplier Data", 14, 15);
    const tableColumns = [
      "Products Name",
      "Category",
      "Item Code",
      "Unit Purchased",
      "Total Cost",
      "Available Quantity",
      "Status",
    ];

    const visibleRows = selectedRowIds.size > 0
      ? supplierData.filter((e) => selectedRowIds.has(e._id))
      : supplierData;

    const tableRows = visibleRows.map((e) => [
      e.items?.[0]?.itemName,
      e.items?.[0]?.productId?.category?.categoryName,
      e.items?.[0]?.productId?.itemBarcode,
      e.items?.[0]?.qty,
      e.grandTotal,
      e.items?.[0]?.productId?.stockQuantity,
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

    doc.save("suppliers.pdf");
  };

  // Handle Barcode rendering for list view popup
  useEffect(() => {
    if (viewBarcode !== false && supplierData[viewBarcode]) {
      const order = supplierData[viewBarcode];
      const itemBarcode = order.items?.[0]?.productId?.itemBarcode;

      if (itemBarcode) {
        setTimeout(() => {
          const element = document.getElementById(`barcode-svg-${viewBarcode}`);
          if (element) {
            try {
              let format = "CODE128";
              // if (/^\d{12,13}$/.test(itemBarcode)) format = "EAN13";
              JsBarcode(element, itemBarcode, {
                format: format,
                lineColor: "#000",
                width: 2,
                height: 100,
                displayValue: true,
              });
            } catch (e) {
              // Fallback or retry
              try {
                JsBarcode(element, itemBarcode, {
                  format: "CODE128",
                  lineColor: "#000",
                  width: 2,
                  height: 100,
                  displayValue: true,
                });
              } catch (err) { }
            }
          }
        }, 100);
      }
    }
  }, [viewBarcode, supplierData]);

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
            Supplier Report
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
              <IoIosSearch className="fs-4" />
              <input
                type="search"
                placeholder="Search"
                style={{
                  width: "100%",
                  border: "none",
                  outline: "none",
                  fontSize: 14,
                  background: "#FCFCFC",
                  color: "rgba(19.75, 25.29, 61.30, 0.40)",
                }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                height: "33px",
                color: "#0E101A",
              }}
            >
              <TbFileExport className="fs-5 text-secondary" />
              Export
            </button>
          </div>
        </div>

        {/* select supplier + text & logo */}
        <div style={{}}>
          {/* select supplier*/}
          <div
            style={{
              display: "inline-flex",
              justifyContent: "start",
              alignItems: "center",
              gap: 16,
              width: '34%',
              height: "33px",
            }}
          >
            <div
              style={{
                width: "100%",
                position: "relative",
                padding: "5px 10px 5px 10px",
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
              <select
                value={selectedSupplier || ""}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                placeholder="Search"
                style={{
                  width: "100%",
                  border: "none",
                  outline: "none",
                  fontSize: 14,
                  background: "#FCFCFC",
                }}
              >
                <option value="">Select Supplier</option>
                {suppliers.map((supplier, index) => (
                  <option key={index} value={supplier._id}>{supplier.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* if supplier is not selected */}
        {!selectedSupplier && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: '575px',
            }}>
            {/* Text Content */}
            <div className="d-flex flex-column"
              style={{
                textAlign: "center",
                maxWidth: "680px",
                padding: "0 20px",
              }}
            >
              <span
                style={{
                  fontSize: "32px",
                  fontWeight: "400",
                  color: "#1a1a1a",
                }}
              >
                Supplier Report
              </span>
              <span
                style={{
                  fontSize: "16px",
                  fontWeight: '400',
                  color: "#727681",
                  lineHeight: "1",
                  marginTop: '10px',
                  marginBottom: "30px",
                }}
              >
                Select Supplier to generate report.
              </span>
            </div>
            <div style={{ width: '301px', height: '255px' }}>
              <img src={SupplierLogo} alt="Supplier Logo" style={{ width: '100%', objectFit: 'contain' }} />
            </div>
          </div>
        )}

        {/* after supplier is selected */}
        {selectedSupplier && (
          <div>
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
                          style={{ width: 18, height: 18 }}
                          onChange={handleSelectAll}
                          checked={supplierData.length > 0 && supplierData.every((item) => selectedRowIds.has(item._id))}
                        />
                        Product Name & Category
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
                      Unit Purchased
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
                      Total Cost
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
                      Available Qty
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
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {supplierData.map((product, index) => (
                    <tr key={index}
                      style={{
                        borderBottom: "1px solid #EAEAEA",
                        height: "46px",
                      }}
                      className={`table-hover ${activeRow === index ? "active-row" : ""}`}
                      onClick={() =>
                        navigate(
                          `/product/view/${product.items?.[0]?.productId?._id}`, { state: { from: location.pathname } }
                        )
                      }
                    >
                      {/* Product Name */}
                      <td style={{
                        padding: "8px 16px", verticalAlign: "middle", height: '46px',
                        cursor: 'pointer'
                      }}>
                        <div
                          style={{ display: "flex", alignItems: "center", gap: 12 }}
                        >
                          <input
                            type="checkbox"
                            style={{ width: 18, height: 18 }}
                            checked={selectedRowIds.has(product._id)}
                            onChange={() => handleSelectRow(product._id)}
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
                                cursor: 'pointer',
                              }}
                            >
                              <div>{product.items?.[0]?.itemName || "N/A"}</div>
                              <span
                                style={{
                                  display: "inline-block",
                                  padding: "4px 8px",
                                  background: "#FFE0FC",
                                  color: "#AE009B",
                                  borderRadius: 36,
                                  fontSize: 12,
                                  marginTop: 4,
                                }}
                              >
                                {product.items?.[0]?.productId?.category?.categoryName || "N/A"}
                              </span>
                            </div>
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
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            cursor: "pointer",
                            position: "relative",
                          }}
                          onClick={() =>
                            setViewBarcode(viewBarcode === index ? false : index)
                          }
                          ref={(el) => (buttonRefs.current[index] = el)}
                        >
                          {product.items?.[0]?.productId?.itemBarcode || "N/A"}
                          <FaBarcode className="fs-6 text-secondary" />
                        </div>
                        {viewBarcode === index && (
                          <>
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
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div
                                ref={modelRef}
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
                                    width: "300px",
                                    height: "auto",
                                    backgroundColor: "white",
                                    outfit: "contain",
                                    boxShadow: "10px 10px 40px rgba(0,0,0,0.10)",
                                    borderRadius: 16,
                                    padding: 16,
                                    border: "2px solid #dbdbdbff",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 8,
                                  }}
                                >
                                  <span>
                                    {product.items?.[0]?.itemName || "N/A"} / ₹{product.items?.[0]?.productId?.purchasePrice + "/-" || "N/A"}
                                  </span>
                                  <div className="d-flex justify-content-center align-items-center">
                                    <svg id={`barcode-svg-${index}`}></svg>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </td>

                      {/* unit purchased */}
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                          cursor: 'pointer'
                        }}
                      >
                        {product.items?.[0]?.qty || "N/A"}
                      </td>

                      {/* total cost */}
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                          cursor: 'pointer'
                        }}
                      >
                        ₹{product.grandTotal}/-
                      </td>

                      {/* available quantity */}
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                          cursor: 'pointer'
                        }}
                      >
                        {Array.isArray(product.items)
                          ? product.items
                            .map((it) =>
                              it?.productId?.stockQuantity ?? "N/A"
                            )
                            .join(", ")
                          : "N/A"}
                      </td>

                      {/* status */}
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                          cursor: 'pointer'
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 8px",
                            background: product.status === "received" ? "#D4F7C7" : product.status === "Pending" ? "#FFF2D5" : "#F7C7C9",
                            color: product.status === "received" ? "#379c13ff" : product.status === "Pending" ? "#CF4F00" : "#A80205",
                            borderRadius: 36,
                            fontSize: 12,
                            marginTop: 4,
                          }}
                        >
                          {product.status === "received" ? <TiTick /> : product.status === "Pending" ? "!" : "x"} {(product.status).toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {supplierData.length === 0 && <tr>
                    <td colSpan="9" className="text-center p-3">
                      <span className="" style={{}}>No Record Found</span>
                    </td>
                  </tr>}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="page-redirect-btn px-2">
              <Pagination
                currentPage={page}
                total={totalInvoices}
                itemsPerPage={itemsPerPage}
                onPageChange={(p) => setPage(p)}
                onItemsPerPageChange={(n) => { setItemsPerPage(n); setPage(1); }}
              />
            </div>
          </div>
        )}

      </div>

    </div>
  )
}

export default SupplierReport
