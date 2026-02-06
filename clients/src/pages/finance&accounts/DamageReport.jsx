import React, { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import api from "../../pages/config/axiosInstance";
import Pagination from "../../components/Pagination";
import ViewDamageModal from "../../components/features/inventory/Damage&Return/ViewDamageModal";
import { IoIosSearch, IoIosArrowDown } from "react-icons/io";
import { FiEdit } from "react-icons/fi";
import { RiListView, RiDeleteBinLine } from "react-icons/ri";
import { HiOutlineDocumentDuplicate } from "react-icons/hi";
import { RiInboxArchiveFill, RiInboxUnarchiveFill } from "react-icons/ri";
import { LuReceiptText } from "react-icons/lu";
import { LuPackageSearch } from "react-icons/lu";
import { LuRefreshCcwDot } from "react-icons/lu";
import {
  MdOutlineKeyboardArrowRight,
  MdOutlineKeyboardArrowLeft,
  MdOutlineKeyboardDoubleArrowRight,
  MdOutlineKeyboardDoubleArrowLeft,
} from "react-icons/md";

function DamageReport() {
  const [viewOptions, setViewOptions] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ x: 0, y: 0 });
  const [openUpwards, setOpenUpwards] = useState(false);
  const [showDamageReportModel, setDamageReportModel] = useState(false);
  const [reports, setReports] = useState([]);

  const [rdata, setRData] = useState([]);

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [viewDamageReportModel, setViewDamageReportModel] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);  // For pre-fill
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [editDamageReportModel, setEditDamageReportModel] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

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

  const handleDamageReportModel = () => {
    setDamageReportModel(true);
  };

  const handleDamageReportViewModel = (product) => {
    setSelectedProduct(product);
    setViewDamageReportModel(true);
  };

  const handleEditDamageReportModel = (product) => {
    setSelectedProduct(product);
    setEditDamageReportModel(true);
  };

  const handleDeleteDamageReport = async (item) => {
    try {
      if (!item?._id) return;
      await api.delete(`/api/damage-return/${item._id}`);
      setViewOptions(null);
      fetchRecords();
    } catch (err) {
      // optionally handle error UI
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/api/category/categories");
      setCategories(res.data);
    } catch (error) {
      // console.error("Error fetching categories:", error);
    }
  };
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
      };
      const allDataRes = await api.get("/api/damage-return");
      const allData = allDataRes.data || {};
      setRData(allData.items || []);

      if (selectedCategory) params.category = selectedCategory;
      if (searchQuery && searchQuery.trim()) params.search = searchQuery.trim();
      const res = await api.get("/api/damage-return", { params });
      const data = res.data || {};
      setRecords(Array.isArray(data.items) ? data.items : []);
      setTotalRecords(Number(data.total) || 0);
    } catch (err) {
      setRecords([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchRecords();
    (window).onDamageCreated = fetchRecords;
    return () => {
      delete (window).onDamageCreated;
    };
  }, []);
  useEffect(() => {
    fetchRecords();
  }, [selectedCategory, searchQuery, currentPage, itemsPerPage]);

  const dropdownButtonRefs = useRef([]);
  const dropdownModelRef = useRef(null);
  const addButtonRef = useRef(null);

  useEffect(() => {
    if (viewOptions === null) return;
    const handleClickOutside = (event) => {
      const isClickInsideModel = dropdownModelRef.current && dropdownModelRef.current.contains(event.target);
      const isClickInsideButton = dropdownButtonRefs.current[viewOptions] && dropdownButtonRefs.current[viewOptions].contains(event.target);
      if (!isClickInsideModel && !isClickInsideButton) {
        setViewOptions(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [viewOptions]);

  const handleDelete = (id) => {
    setDeleteTargetId(id?._id);
    setShowDeleteModal(true);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteTargetId(null);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await api.delete(`/api/damage-return/${deleteTargetId}`);
      setShowDeleteModal(false);
      setDeleteTargetId(null);
      await fetchRecords();
    } catch (err) {
      setShowDeleteModal(false);
      // console.error("Delete product error:", err);
    }
  };

  return (
    <div className="p-4">
      <div>
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
            }}
          >
            <h2
              style={{
                margin: 0,
                color: "black",
                fontSize: 22,
                fontFamily: "Inter, sans-serif",
                fontWeight: 500,
                lineHeight: "26.4px",
              }}
            >
              Damage Report
            </h2>
          </div>

          {/* Right: Action Buttons */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
          </div>
        </div>

        {/* main content */}
        <div
          style={{
            width: "100%",
            minHeight: "auto",
            maxHeight: "calc(100vh - 150px)",
            padding: 16,
            background: "white",
            borderRadius: 16,
            display: "flex",
            flexDirection: "column",
            gap: 16,
            fontFamily: "Inter, sans-serif",
            // overflowY:'auto',
          }}
        >
          {/* Search Bar & export import */}
          <div className="d-flex justify-content-start gap-2 align-items-center">
            <div
              className=""
              style={{
                padding: "0px 15px 0px 4px",
                border: "1px solid #dfddddff",
                borderRadius: "8px",
                color: "grey",
                background: "#FCFCFC",
                cursor: "pointer",
              }}
            >
              <select
                className=""
                name=""
                id=""
                style={{
                  border: "none",
                  padding: "8px 12px",
                  fontFamily: "Inter",
                  background: "#FCFCFC",
                  color: "grey",
                  outline: "none",
                  cursor: "pointer",
                }}
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.categoryName}
                  </option>
                ))}
              </select>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  width: "400px",
                  position: "relative",
                  padding: "8px 15px",
                  display: "flex",
                  borderRadius: 8,
                  alignItems: "center",
                  background: "#FCFCFC",
                  border: "1px solid #EAEAEA",
                  gap: "5px",
                  color: "rgba(19.75, 25.29, 61.30, 0.40)",
                }}
              >
                <IoIosSearch className="fs-5" />
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
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <div
                style={{
                  display: "inline-flex",
                  justifyContent: "flex-start",
                  alignItems: "center",
                  gap: 16,
                }}
              ></div>
            </div>
          </div>

          {/* Table */}
          <div className="table-responsive" style={{
            overflowY: "auto",
            maxHeight: '500px',
          }}>
            <table
              className="table-responsive"
              style={{
                width: "100%",
                borderCollapse: "collapse",
                overflowX: "auto",
              }}
            >
              {/* Header */}
              <thead style={{
                position: "sticky",
                top: 0,
                zIndex: 10,
                height: '38px'
              }}>
                <tr style={{ background: "#F3F8FB" }}>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "4px 16px",
                      color: "#727681",
                      fontSize: 14,
                      width: 80,
                      fontWeight: '400'
                    }}
                  ><div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {/* <input type="checkbox" style={{ width: 18, height: 18 }} /> */}
                      Product Name
                    </div>
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
                    Category
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
                    Quantity
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
                    Remark
                  </th>
                </tr>
              </thead>

              <tbody style={{ overflowY: 'auto', }}>
                {records.length === 0 ? (
                  <tr style={{ borderBottom: "1px solid #FCFCFC", height: '46px' }}>
                    <td
                      colSpan={5}
                      style={{
                        padding: '8px 16px',
                        verticalAlign: 'middle',
                        textAlign: 'center',
                        fontSize: 14,
                        color: '#6C748C',
                      }}
                    >
                      No Record Found
                    </td>
                  </tr>
                ) : (
                  records.map((rec, index) => (
                    <tr key={index}
                      style={{
                        borderBottom: "1px solid #EAEAEA",
                        height: "46px",
                      }}
                      className={`table-hover ${activeRow === index ? "active-row" : ""}`}
                    >
                      {/* Product Name & Category */}
                      <td style={{ padding: '8px 16px', verticalAlign: 'middle', cursor: 'pointer' }}
                        onClick={(e) => {  // FIXED: Add stopPropagation
                          handleDamageReportViewModel(rec);
                        }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {/* <input type="checkbox" style={{ width: 18, height: 18 }} onClick={(e) => e.stopPropagation()} /> */}
                          {/* <a className="avatar avatar-md">
                            {rec?.product?.images?.[0] ? (
                              <img src={rec.product.images[0].url} alt={rec.product.productName} className="media-image" />
                            ) : (
                              <div className="avatar-content">
                                <span className="avatar-letter" style={{
                                  color: "#666",
                                  background: "#eee",
                                  padding: '8px 12px',
                                  borderRadius: 4
                                }}>{rec.product.productName.charAt(0).toUpperCase()}</span>
                              </div>
                            )}
                          </a> */}
                          <div onClick={(e) => {  // FIXED: Add stopPropagation
                            e.stopPropagation();
                            handleDamageReportViewModel(rec);
                          }}>
                            <div style={{ fontSize: 14, color: '#0E101A', whiteSpace: 'nowrap', display: 'flex', gap: '5px', justifyContent: 'center', alignItems: 'center' }}>
                              <div>{rec?.product?.productName || "-"}</div>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* category */}
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                          cursor: 'pointer',
                        }}
                        onClick={(e) => {  // FIXED: Add stopPropagation
                          e.stopPropagation();
                          handleDamageReportViewModel(rec);
                        }}
                      >
                        {rec?.category?.categoryName || "-"}
                      </td>

                      {/* quantity */}
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                          cursor: 'pointer',
                        }}
                        onClick={(e) => {  // FIXED: Add stopPropagation
                          e.stopPropagation();
                          handleDamageReportViewModel(rec);
                        }}
                      >
                        {rec?.quantity ?? 0}
                      </td>

                      {/* remark */}
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                          cursor: 'pointer',
                        }}
                        onClick={(e) => {  // FIXED: Add stopPropagation
                          e.stopPropagation();
                          handleDamageReportViewModel(rec);
                        }}
                        title={rec?.remarks || "-"}
                      >
                        {rec?.remarks.length > 30 ? rec?.remarks.slice(0, 30) + "..." : rec?.remarks || "-"}
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
              currentPage={currentPage}
              total={totalRecords}
              itemsPerPage={itemsPerPage}
              onPageChange={(page) => setCurrentPage(page)}
              onItemsPerPageChange={(n) => {
                setItemsPerPage(n);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {viewDamageReportModel && (
        <ViewDamageModal
          closeModal={() => setViewDamageReportModel(false)}
          selectedProduct={selectedProduct}
        />
      )}

    </div>
  );
}

export default DamageReport;