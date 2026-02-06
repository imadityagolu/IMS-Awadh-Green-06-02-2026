import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { FaFileExcel, FaFilePdf } from 'react-icons/fa';
import { CiCirclePlus } from 'react-icons/ci';
import { TbEdit, TbTrash } from 'react-icons/tb';
import AddHsnModals from '../../../../pages/Modal/hsn/AddHsnModals';
import { toast } from 'react-toastify';
import BASE_URL from '../../../../pages/config/config';
import * as XLSX from "xlsx";
import { GrFormPrevious } from "react-icons/gr";
import { MdNavigateNext } from "react-icons/md";
import DeleteAlert from "../../../../utils/sweetAlert/DeleteAlert";
import { sanitizeInput } from "../../../../utils/sanitize";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { hasPermission } from '../../../../utils/permission/hasPermission';
import api from "../../../../pages/config/axiosInstance"

import { Link, NavLink } from "react-router-dom";
import { IoIosSearch, IoIosArrowDown } from "react-icons/io";
import { FaArrowLeft, FaBarcode, FaFileImport } from "react-icons/fa6";
import { MdOutlineViewSidebar, MdAddShoppingCart } from "react-icons/md";
import { TbFileImport, TbFileExport } from "react-icons/tb";
import Pagination from "../../../../components/Pagination";
import DeleteModal from "../../../ConfirmDelete";
import edit from "../../../../assets/images/edit.png";
import deletebtn from "../../../../assets/images/delete.png";

const HSNList = () => {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [modalData, setModalData] = useState({ hsnCode: '', description: '', id: null });
  const [showModal, setShowModal] = useState(false);
  const [errors, setErrors] = useState({});
  const hsnRegex = /^[0-9]{2,8}$/;
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());
  const [allVisibleSelected, setAllVisibleSelected] = useState(false);

  const [activeRow, setActiveRow] = useState(null);
  const [viewOptions, setViewOptions] = useState(false);
  const buttonRefs = useRef([]);
  const modelRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ x: 0, y: 0 });
  const [openUpwards, setOpenUpwards] = useState(false);

  useEffect(() => { load(); }, [page, limit, search]);

  const load = async () => {
    try {
      // const token = localStorage.getItem("token")
      const res = await api.get(`/api/hsn/paginated`, {
        params: { page, limit, search },
      });
      setData(res.data.items);
      setPages(res.data.pages);
      setTotal(res.data.total);
    } catch (err) {
      // console.error('Error loading HSN:', err);
    }
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const handleDelete = (id) => {
    setDeleteTargetId(id);
    setShowDeleteModal(true);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteTargetId(null);
  };

  const confirmDelete = async (id) => {
    if (!deleteTargetId) return;
    try {
      await api.delete(`/api/hsn/${deleteTargetId}`);
      setShowDeleteModal(false);
      setDeleteTargetId(null);
      load();
      toast.success("HSN deleted successfully!");
    } catch (err) {
      // console.error('Error deleting HSN:', err);
      toast.error("Failed to delete HSN. Please try again.");
    }
  };

  const handleExport = async () => {
    try {
      // const token = localStorage.getItem("token")
      const res = await api.get(`/api/hsn/export`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'hsn.xlsx');
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      // console.error('Export error:', err);
    }
  };

  const handlePdf = () => {
    const doc = new jsPDF();
    doc.text("HSN List", 14, 15);
    const tableColumns = [
      "HSN Code",
      "Description",
      "Created Date",
    ];

    const dataToExport = selectedRowIds.size > 0
      ? data.filter(item => selectedRowIds.has(item._id))
      : data;

    const tableRows = dataToExport.map((e) => [
      e.hsnCode,
      e.description,
      new Date(e.createdAt).toLocaleDateString(),
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

    doc.save("hsn-list.pdf");
  };

  const handleExcel = () => {
    // Prepare data for Excel export
    const excelData = data.map((hsn) => ({
      "HSN Code": hsn.hsnCode,
      "Description": hsn.description,
      "Created Date": new Date(hsn.createdAt).toLocaleDateString(),
    }));

    // Create a new workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths for better formatting
    const columnWidths = [
      { wch: 15 }, // HSN Code
      { wch: 40 }, // Description
      { wch: 15 }, // Created Date
    ];
    worksheet["!cols"] = columnWidths;

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "HSN List");

    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, "hsn-list.xlsx");
  };

  const fileInputRef = useRef(null);

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // const token = localStorage.getItem("token")
      const reader = new FileReader();
      reader.onload = async (event) => {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        // Format to match backend model
        const formattedData = jsonData.map((item) => ({
          hsnCode: item["HSN Code"],
          description: item["HSN Description"],
        }));

        // ✅ Send all at once
        const res = await api.post(`/api/hsn/import`, {
          hsnItems: formattedData,
        });

        toast.success(res.data.message);
        load();
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      // console.error(error);
      toast.error("Import failed");
    }
  };

  const handleModalSubmit = async () => {
    let newErrors = {};
    const { hsnCode, description, id } = modalData;

    // Validate HSN Code
    const hsnRegex = /^[0-9]{2,8}$/;
    if (!hsnCode || !hsnCode.trim()) {
      newErrors.hsnCode = "HSN code is required";
    } else if (!hsnRegex.test(hsnCode.trim())) {
      newErrors.hsnCode = "HSN code must be 2-8 digits";
    }

    // Validate Description
    if (!description || !description.trim()) {
      newErrors.description = "Description is required";
    }

    // If there are validation errors, show them and return
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fix the validation errors");
      return;
    }

    // Clear any previous errors
    setErrors({});

    try {
      // const token = localStorage.getItem("token");
      const cleanhsnCode = sanitizeInput(hsnCode.trim());
      const cleanhsnDescription = sanitizeInput(description.trim());

      if (modalData.id) {
        // Update existing HSN
        await api.put(`/api/hsn/${modalData.id}`, {
          hsnCode: cleanhsnCode,
          description: cleanhsnDescription
        });
        toast.success("HSN updated successfully!");
      } else {
        // Create new HSN
        await api.post(`/api/hsn`, {
          hsnCode: cleanhsnCode,
          description: cleanhsnDescription
        });
        toast.success("HSN created successfully!");
      }

      // Reset modal and reload data
      setModalData({ hsnCode: '', description: '', id: null });
      setShowModal(false);
      setErrors({});
      load();
    } catch (err) {
      // console.error('Save error:', err);

      // Handle specific error cases
      if (err.response?.status === 400) {
        toast.error(err.response.data.message || "Invalid data provided");
      } else if (err.response?.status === 409) {
        toast.error("HSN code already exists");
      } else if (err.response?.status === 401) {
        toast.error("Unauthorized. Please login again");
      } else {
        toast.error("Failed to save HSN. Please try again");
      }
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setModalData({ hsnCode: item.hsnCode, description: item.description, id: item._id });
    } else {
      setModalData({ hsnCode: '', description: '', id: null });
    }
    setErrors({}); // Clear any previous errors
    setShowModal(true);
  };

  const handleBulkDelete = async () => {
    if (selectedRowIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedRowIds.size} selected HSN records?`)) return;

    try {
      await Promise.all(
        Array.from(selectedRowIds).map((id) => api.delete(`/api/hsn/${id}`))
      );
      toast.success("Selected HSNs deleted");
      setSelectedRowIds(new Set());
      load();
    } catch (err) {
      // console.error("Bulk delete error:", err);
      toast.error("Failed to delete selected HSNs");
    }
  };

  useEffect(() => {
    const allCurrentPageIds = data.map(item => item._id);
    const allSelected = allCurrentPageIds.length > 0 && allCurrentPageIds.every(id => selectedRowIds.has(id));
    setAllVisibleSelected(allSelected);
  }, [data, selectedRowIds]);

  return (
    <div className="p-4">
      {/* header, view style */}
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
            HSN
          </h2>
        </div>

        {/* Right: Action Buttons */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            height: "33px",
          }}
        >
          {hasPermission("HSN", "write") && (
            <button
              onClick={() => openModal()}
              style={{
                padding: "6px 16px",
                background: "white",
                border: "1px solid #1F7FFF",
                color: "#1F7FFF",
                borderRadius: 8,
                textDecoration: "none",
                fontSize: "14px",
                display: "flex",
                gap: "8px",
                alignItems: "center",
                height: "33px",
              }}
            >
              <MdAddShoppingCart className="fs-5" />
              <span className="fs-6">Add HSN</span>
            </button>
          )}
        </div>
      </div>

      <div
        style={{
          width: "100%",
          minHeight: "auto",
          maxHeight: "calc(100vh - 160px)",
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
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
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
              height: "38px",
              width: "auto",
            }}
          >
            {[
              { label: "All", count: total },
            ].map((tab) => (
              <div
                key={tab.label}
                style={{
                  padding: "6px 12px",
                  background: "white",
                  borderRadius: 8,
                  boxShadow: "0px 1px 4px rgba(0, 0, 0, 0.10)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 14,
                  color: "#0E101A",
                  cursor: "pointer",
                }}
                onClick={() => setListTab(tab.label)}
              >
                {tab.label}
                <span style={{ color: "#727681" }}>{tab.count}</span>
              </div>
            ))}
          </div>

          {/* select delete + Search Bar + export import */}
          <div
            style={{
              display: "flex",
              justifyContent: "end",
              gap: "24px",
              height: "33px",
              width: "50%",
            }}
          >

            {/* {selectedRowIds.size > 0 && (
              <button className="btn btn-danger me-2" onClick={handleBulkDelete}>
                Delete ({selectedRowIds.size}) Selected
              </button>
            )} */}

            <div
              style={{
                width: "50%",
                position: "relative",
                padding: "8px 16px 8px 20px",
                display: "flex",
                borderRadius: 8,
                alignItems: "center",
                background: "#FCFCFC",
                border: "1px solid #EAEAEA",
                gap: "5px",
                color: "rgba(19.75, 25.29, 61.30, 0.40)",
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
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>

            {hasPermission("HSN", "export") && (
              <div
                style={{
                  display: "inline-flex",
                  justifyContent: "flex-start",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                {/* Export Button */}
                <button
                  title="Download Pdf"
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
            )}
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
              <tr style={{ background: "#F3F8FB" }}>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    width: "auto",
                    fontWeight: "400",
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
                      style={{ width: 18, height: 18 }}
                      checked={allVisibleSelected}
                      onChange={(e) => {
                        const next = new Set(selectedRowIds);
                        if (e.target.checked) {
                          data.forEach((row) => row._id && next.add(row._id));
                        } else {
                          data.forEach((row) => row._id && next.delete(row._id));
                        }
                        setSelectedRowIds(next);
                      }}
                    />
                    HSN Code
                  </div>
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    width: "auto",
                    fontWeight: "400",
                  }}
                >
                  Description
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    width: "auto",
                    fontWeight: "400",
                  }}
                >
                  Created Date
                </th>
                <th
                  style={{
                    textAlign: "center",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    width: "auto",
                    fontWeight: "400",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>

            <tbody style={{ overflowY: "auto" }}>
              {data.length === 0 ? (
                <>
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
                </>
              ) : (
                <>
                  {data.map((hsn, index) => (
                    <tr
                      key={hsn._id}
                      style={{
                        borderBottom: "1px solid #EAEAEA",
                        height: "46px",
                      }}
                      className={`table-hover ${activeRow === index ? "active-row" : ""}`}
                    >
                      {/* hsn code */}
                      <td
                        style={{
                          padding: "4px 16px",
                          verticalAlign: "middle",
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
                            style={{ width: 18, height: 18 }}
                            checked={selectedRowIds.has(hsn._id)}
                            onChange={(e) => {
                              const next = new Set(selectedRowIds);
                              if (e.target.checked) {
                                if (hsn._id) next.add(hsn._id);
                              } else {
                                if (hsn._id) next.delete(hsn._id);
                              }
                              setSelectedRowIds(next);
                            }}
                          />
                          <div
                            style={{
                              fontSize: 14,
                              color: "#0E101A",
                              whiteSpace: "nowrap",
                              display: "flex",
                              gap: "5px",
                              justifyContent: "center",
                              alignItems: "center",
                              cursor: "pointer",
                            }}
                          >
                            {hsn.hsnCode}
                          </div>
                        </div>
                      </td>

                      {/* description */}
                      <td
                        style={{
                          padding: "4px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                          cursor: "pointer",
                        }}
                      >
                        <span>{hsn.description.length > 100 ? hsn.description.slice(0, 100) + '...' : hsn.description}</span>
                      </td>

                      {/* created date */}
                      <td
                        style={{
                          padding: "4px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                        }}
                      >
                        {new Date(hsn.createdAt).toLocaleDateString("en-GB", {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>

                      {/* Actions */}
                      <td
                        style={{
                          padding: "4px 16px",
                          position: "relative",
                          overflow: "visible",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            position: "relative",
                            cursor: "pointer",
                          }}
                          onClick={() =>
                            setViewOptions(
                              viewOptions === index ? false : index
                            )
                          }
                          ref={(el) => (buttonRefs.current[index] = el)}
                        >
                          <div
                            style={{
                              width: 24,
                              height: 24,
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                            onClick={(e) => {
                              const rect =
                                e.currentTarget.getBoundingClientRect();

                              const dropdownHeight = 260; // your menu height
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

                              setViewOptions(
                                viewOptions === index ? false : index
                              );
                            }}
                            ref={(el) =>
                              (buttonRefs.current[index] = el)
                            }
                          >
                            <div
                              style={{
                                width: 4,
                                height: 4,
                                background: "#6C748C",
                                borderRadius: 2,
                              }}
                            />
                            <div
                              style={{
                                width: 4,
                                height: 4,
                                background: "#6C748C",
                                borderRadius: 2,
                              }}
                            />
                            <div
                              style={{
                                width: 4,
                                height: 4,
                                background: "#6C748C",
                                borderRadius: 2,
                              }}
                            />
                          </div>
                          {viewOptions === index && (
                            <>
                              <div
                                style={{
                                  position: "fixed",
                                  top: openUpwards
                                    ? dropdownPos.y - 110
                                    : dropdownPos.y,
                                  left: dropdownPos.x - 80,
                                  zIndex: 999999,
                                }}
                              >
                                <div
                                  ref={modelRef}
                                  style={{
                                    background: "white",
                                    padding: 8,
                                    borderRadius: 12,
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                    minWidth: 180,
                                    height: "auto", // height must match dropdownHeight above
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 4,
                                  }}
                                >
                                  {hasPermission("HSN", "update") && (
                                    <div
                                      style={{
                                        display: "flex",
                                        justifyContent: "flex-start",
                                        alignItems: "center",
                                        gap: 8,
                                        padding: "8px 12px",
                                        borderRadius: 8,
                                        border: "none",
                                        cursor: "pointer",
                                        fontFamily: "Inter, sans-serif",
                                        fontSize: 16,
                                        fontWeight: 400,
                                        color: "#6C748C",
                                        textDecoration: "none",
                                      }}
                                      className="button-action"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        openModal(hsn);
                                      }}
                                    >
                                      <img src={edit} alt="" />
                                      <span style={{ color: "black" }}>
                                        Edit
                                      </span>
                                    </div>
                                  )}

                                  {hasPermission("HSN", "delete") && (
                                    <div
                                      onClick={() => handleDelete(hsn._id)}
                                      style={{
                                        display: "flex",
                                        justifyContent: "flex-start",
                                        alignItems: "center",
                                        gap: 8,
                                        padding: "8px 12px",
                                        borderRadius: 8,
                                        border: "none",
                                        cursor: "pointer",
                                        fontFamily: "Inter, sans-serif",
                                        fontSize: 16,
                                        fontWeight: 400,
                                        color: "#6C748C",
                                        textDecoration: "none",
                                      }}
                                      className="button-action"
                                    >
                                      <img src={deletebtn} alt="" />
                                      <span style={{ color: "black" }}>
                                        Delete
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="page-redirect-btn px-2">
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

      <AddHsnModals
        show={showModal}
        onClose={() => setShowModal(false)}
        modalData={modalData}
        setModalData={setModalData}
        onSubmit={handleModalSubmit}
        errors={errors}
      />

      <DeleteModal
        isOpen={showDeleteModal}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
        itemName="product"
      />

    </div>

  );
};

export default HSNList;
