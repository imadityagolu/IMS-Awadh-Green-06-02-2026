import React, { useEffect, useState, useRef } from "react";
import { MdAddShoppingCart } from "react-icons/md";
import { FiSearch } from "react-icons/fi";
import { BsThreeDots } from "react-icons/bs";
import "react-datepicker/dist/react-datepicker.css";
import { FaCheck } from "react-icons/fa6";
import { RxCross2 } from "react-icons/rx";
import Custommrr from "../../../assets/images/suppimg.png";
import CustomerDetails from "../../../pages/Modal/customerModals/CustomerDetails";
import AddCustomers from "../../../pages/Modal/customerModals/AddCustomerModal";
import { useNavigate } from "react-router-dom";
import { TbFileExport } from "react-icons/tb";
import api from "../../../pages/config/axiosInstance";
import Pagination from "../../../components/Pagination";
import ConfirmDeleteModal from "../../ConfirmDelete";
import { toast } from "react-toastify";
import { IoIosArrowBack } from "react-icons/io";
import CreditNoteImg from "../../../assets/images/create-creditnote.png";
import CreditICONImg from "../../../assets/images/create-icon1.png";
import GenerateICONImg from "../../../assets/images/create-icon4.png";
import DeleteICONImg from "../../../assets/images/delete.png";
import EditICONImg from "../../../assets/images/edit.png";
import EditCustomerModal from "../../../pages/Modal/customerModals/EditCustomerModal";
import CustomerDueEmpty from "./CustomerDueEmpty";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function CustomerDuesAdvanceList({ data }) {
  // console.log("data for with", data);
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  //   const [openModal, setOpenModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  //   const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [customers, setCustomers] = useState([]);

  const [tabCounts, setTabCounts] = useState({
    All: 0,
    Due: 0,
    Advance: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const navigate = useNavigate();
  const menuRef = useRef(null);

  const [activeRow, setActiveRow] = useState(null);
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());


  const toggleRow = (index) => {
    const newOpen = openRow === index ? null : index;
    setOpenRow(newOpen);
    if (newOpen === null && activeRow === index) {
      setActiveRow(null);
    } else if (newOpen !== null) {
      setActiveRow(index);
    }
  };

  const fetchCustomers = async () => {
    try {
      const typeParam = activeTab === "All" ? "all" : (activeTab || "").toLowerCase();
      const res = await api.get("/api/customers/filter/dues-advance", {
        params: { type: typeParam, search: search || "" },
      });
      const { customers: fetchedCustomers, tabCounts: counts } = res.data;
      setCustomers(fetchedCustomers);
      setFilteredCustomers(fetchedCustomers);
      // console.log("Fetched customers:", fetchedCustomers);
      setTabCounts({
        All: counts.all,
        Due: counts.due,
        Advance: counts.advance,
      })
    } catch (error) {
      // console.error(error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchCustomers();
  }, [activeTab]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== undefined) {
        fetchCustomers();
      }
    }, 500); // Debounce delay of 500ms

    return () => {
      clearTimeout(timer);
    };
  }, [search, activeTab]);

  useEffect(() => {
    const filteredRows = customers.filter((c) => c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search) || c.email?.toLowerCase().includes(search.toLowerCase()))
    setFilteredCustomers(filteredRows)
    setCurrentPage(1);
  }, [search, customers])

  // pagination
  const indexOfLastTerm = currentPage * itemsPerPage;
  const indexOfFirstTerm = indexOfLastTerm - itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(indexOfFirstTerm, indexOfLastTerm);

  const allVisibleSelected = paginatedCustomers.length > 0 && paginatedCustomers.every(c => selectedRowIds.has(c._id));
  // useEffect(() => {
  //   if (!loading && customers.length === 0) {
  //     navigate("/customerdueempty", { replace: true })
  //   }
  // }, [loading, customers, navigate])

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Customers Dues & Advance Report", 14, 15);

    const tableColumns = [
      "Customer Name",
      "Phone",
      "Points Available",
      "Due Amount",
      "Total Spent"
    ];

    // Get visible rows - selected ones or all if none selected
    // If selections exist, export ONLY selected ones (across all pages if possible, but here we track IDs)
    // If no selections, export ALL filtered customers (not just current page usually, but for consistency let's do all filtered)

    // Wait, selectedRowIds tracks IDs. If I select on page 1, go to page 2, select more, I want all of them.
    // So I should filter `filteredCustomers` against `selectedRowIds`.

    let rowsToExport = [];
    if (selectedRowIds.size > 0) {
      rowsToExport = filteredCustomers.filter(c => selectedRowIds.has(c._id));
    } else {
      rowsToExport = filteredCustomers;
    }

    if (rowsToExport.length === 0) {
      toast.warn("No customers to export");
      return;
    }

    const tableRows = rowsToExport.map(customer => [
      customer.name || "—",
      customer.phone || "—",
      customer.availablePoints || 0,
      `INR ${(customer.totalDueAmount || 0).toFixed(2)}`,
      `INR ${(customer.totalPurchaseAmount || 0).toFixed(2)}`
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

    const filename = `customers-${rowsToExport.length}-${new Date().toISOString().split('T')[0]}`;
    doc.save(`${filename}.pdf`);

    toast.success(`Exported ${rowsToExport.length} customer${rowsToExport.length !== 1 ? "s" : ""}`);

    // Optional: Clear selection after export
    // setSelectedRowIds(new Set());
  };

  return (
    <div className="p-4" style={{ fontFamily: '"Inter", sans-serif' }}>

      {tabCounts.length === 0 && !search ? (
        <>
          <CustomerDueEmpty />
        </>
      ) : (
        <>
          {/* Header */}
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0px 0px 16px 0px", // Optional: padding for container
            }}
          >
            <h3 style={{ fontSize: 22, color: "#0E101A", fontWeight: 500 }}>
              Dues and Advance
            </h3>
          </div>

          {/* Search + Tabs + Table */}
          <div style={{
            overflowX: "auto",
            width: "100%",
            padding: 16,
            background: "white",
            borderRadius: 16,
            display: "flex",
            flexDirection: "column",
            gap: 16,
            fontFamily: "Inter, sans-serif",
          }}>
            <div className="d-flex flex-wrap gap-3 align-items-center justify-content-between">
              {/* TABS */}
              <div className="d-flex align-items-center gap-3 flex-wrap">
                <div
                  style={{
                    background: "#F3F8FB",
                    padding: 3,
                    borderRadius: 8,
                    display: "flex",
                    gap: 8,
                    overflowX: "auto",
                    height: "33px",
                  }}
                >
                  {Object.entries(tabCounts || {}).map(([label, count]) => {
                    const active = activeTab === label;
                    return (
                      <div
                        key={label}
                        onClick={() => setActiveTab(label)}
                        role="button"
                        style={{
                          padding: "6px 12px",
                          borderRadius: 8,
                          background: active ? "#fff" : "transparent",
                          boxShadow: active
                            ? "0 1px 4px rgba(0,0,0,0.08)"
                            : "none",
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                          cursor: "pointer",
                          width:"fit-content",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <div style={{ fontSize: 14, color: "#0E101A" }}>
                          {label}
                        </div>
                        <div style={{ color: "#727681", fontSize: 14 }}>
                          {count}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SEARCH */}
              <div style={{
                display: "flex",
                justifyContent: "end",
                gap: "24px",
                height: "33px",
                width:"50%"
              }}>
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
                  <FiSearch className="fs-5" />
                  <input
                    type="search"
                    style={{
                      width: "100%",
                      border: "none",
                      outline: "none",
                      fontSize: 14,
                      background: "#FCFCFC",
                      color: "rgba(19.75, 25.29, 61.30, 0.40)",
                    }}
                    placeholder="Search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

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
                    cursor: 'pointer',
                  }}
                  onClick={handleExportPDF}
                  disabled={paginatedCustomers.length === 0}
                >
                  <TbFileExport className="fs-5" style={{color:"#6C748C"}}/>
                  Export
                </button>
              </div>
            </div>

            {/* TABLE */}
            <div className="" style={{ overflow: "auto", maxHeight: "calc(100vh - 380px)" }}>
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
                              // Add all current page customers
                              paginatedCustomers.forEach(customer => {
                                if (customer._id) next.add(customer._id);
                              });
                            } else {
                              // Remove all current page customers
                              paginatedCustomers.forEach(customer => {
                                if (customer._id) next.delete(customer._id);
                              });
                            }
                            setSelectedRowIds(next);
                          }}
                        />
                      </div>
                    </th>
                    {[
                      "Customer Name",
                      "Points Available",
                      "Due Amount",
                      "Total Spent",
                    ].map((heading, i) => (
                      <th
                        key={i}
                        style={{
                          padding: "12px 16px",
                          color: "#727681",
                          fontSize: "14px",
                          fontWeight: 400,
                        }}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody style={{ overflowY: 'auto', }}>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-3">
                        Loading customers...
                      </td>
                    </tr>
                  ) : paginatedCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-3 text-muted">
                        No Record Found
                      </td>
                    </tr>
                  ) : (
                    paginatedCustomers.map((customer, index) => (
                      <tr
                        key={customer._id}
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setOpenDetailsModal(true);
                        }}
                        style={{
                          borderBottom: "1px solid #EAEAEA",
                          height: "46px",
                          cursor: 'pointer'
                        }}
                        className={`table-hover ${activeRow === index ? "active-row" : ""}`}
                      >
                        <td style={{
                          padding: "0px 0px",
                          color: "#0E101A",
                          fontSize: "14px",
                        }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: 'center' }}>
                            <input
                              type="checkbox"
                              aria-label="select customer"
                              checked={selectedRowIds.has(customer._id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                const next = new Set(selectedRowIds);
                                if (e.target.checked) {
                                  if (customer._id) next.add(customer._id);
                                } else {
                                  if (customer._id) next.delete(customer._id);
                                }
                                setSelectedRowIds(next);
                              }}
                            />
                          </div>
                        </td>
                        <td style={{ padding: "4px 16px" }}>
                          <div
                            className="d-flex align-items-center"
                            style={{ gap: 10 }}
                          >
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                background: "#eee",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: "bold",
                                color: "#666",
                              }}
                            >
                              {customer.name?.charAt(0).toUpperCase() || "C"}
                            </div>
                            <div>
                              <div
                                style={{
                                  fontSize: 14,
                                  fontWeight: 400,
                                  color: "#0E101A",
                                }}
                              >
                                {customer?.name}
                              </div>
                              <div style={{ fontSize: 12, color: "#727681" }}>
                                {customer?.phone}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td
                          style={{
                            padding: "14px 16px",
                            fontSize: 14,
                            color: "#0E101A",
                          }}
                        >
                          {customer?.availablePoints || 0}🪙 points
                        </td>

                        <td
                          style={{
                            padding: "14px 16px",
                            fontWeight: 500,
                            color: customer?.totalDueAmount && customer.totalDueAmount > 0 ? "#D92D20" : "#16A34A",
                          }}
                        >
                          {customer?.totalDueAmount && customer.totalDueAmount > 0
                            ? `₹${customer.totalDueAmount.toFixed(2)}/-`
                            : "₹0.00/-"}
                        </td>

                        <td
                          style={{ padding: "14px 16px", color: customer?.totalPurchaseAmount && customer.totalPurchaseAmount > 0 ? "#16A34A" : "#0E101A", fontWeight: 500 }}
                        >
                          {customer?.totalPurchaseAmount
                            ? `₹${customer.totalPurchaseAmount.toFixed(2)}/-`
                            : "₹0.00/-"}
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
                total={filteredCustomers.length}
                itemsPerPage={itemsPerPage}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          </div>

          <ConfirmDeleteModal
            isOpen={showDeleteModal}
            onCancel={() => {
              setShowDeleteModal(false);
              setSelectedCustomer(null);
            }}
            onConfirm={async () => {
              try {
                await api.delete(`/api/customers/${selectedCustomer._id}`);
                toast.success("Customer due advance deleted successfully!")
                fetchCustomers();
              } catch (error) {
                toast.error("Failed to delete due advance customer ")
              } finally {
                setShowDeleteModal(false);
                setSelectedCustomer(null);
              }
            }}
          />

          {/* SIDE MODAL */}
          {openDetailsModal && selectedCustomer && (
            <>
              <span
                onClick={() => setOpenDetailsModal(false)}
                style={{
                  cursor: "pointer",
                  position: "fixed",
                  left: "calc(100vw - 760px)", // Position just left of panel
                  top: "30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid #EAEAEA",
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  backgroundColor: "#fff",
                  zIndex: 10000, // Higher than panel's z-index
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              >
                <IoIosArrowBack style={{ color: "#6C748C", fontSize: "18px" }} />
              </span>
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  right: 0,
                  width: "740px",
                  height: "100vh",
                  background: "white",
                  boxShadow: "-4px 0 20px rgba(0,0,0,0.1)",
                  transition: "right 0.4s ease",
                  zIndex: 9999,
                  overflowY: "auto",
                }}
              >
                <CustomerDetails
                  data={selectedCustomer}
                  onClose={() => setOpenDetailsModal(false)}
                  onEdit={(customer) => {
                    setOpenDetailsModal(true);
                    setSelectedCustomer(customer);
                    setOpenEditModal(true);
                  }}
                />
              </div>
            </>
          )}

          {/* Edit Customer Modal */}
          {openEditModal && selectedCustomer && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
              }}
              onClick={() => setOpenEditModal(false)}
            >
              <div onClick={(e) => e.stopPropagation()}>
                <EditCustomerModal
                  customer={selectedCustomer}
                  onClose={() => {
                    setOpenEditModal(false);
                    setSelectedCustomer(null);
                    fetchCustomers();
                  }}
                />
              </div>
            </div>
          )}
        </>
      )
      }
    </div >
  );
}
