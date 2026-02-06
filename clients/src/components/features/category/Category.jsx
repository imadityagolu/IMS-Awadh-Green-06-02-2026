import React, { useEffect, useState, useRef } from "react";
import { TbFileExport } from "react-icons/tb";
import { toast } from "react-toastify";
import blankCategory_img from "../../../assets/images/categoryblank.png";
import cat_icon from "../../../assets/images/cat-icon.svg";
import DeleteAlert from "../../../utils/sweetAlert/DeleteAlert";
import Swal from "sweetalert2";
import { sanitizeInput } from "../../../utils/sanitize";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { useTranslation } from "react-i18next";
import api from "../../../pages/config/axiosInstance";
// IMS-REDISGNE
import { BiCategory } from "react-icons/bi";
import { CiSearch } from "react-icons/ci";
import Pagination from "../../Pagination";
import { HiOutlineDotsHorizontal } from "react-icons/hi";
import CreateCategoryModal from "./CreateCategoryModel";
import { Link } from "react-router-dom";
import cat_actions_icon from "../../../assets/images/cat-actions-ico.png";
import cat_actions_icon2 from "../../../assets/images/cat-actions-ico2.png";
import cat_actions_icon3 from "../../../assets/images/cat-actions-ico3.png";
import CreateSubCategoryModel from "./CreateSubCategoryModel";
import ConfirmDelete from "../../../components/ConfirmDelete";
import CreateEditCategoryModel from "./CreateEditCategoryModel";
import CreateEditSubCategoryModel from "./CreateEditSubCategoryModel";

const Category = () => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [errors, setErrors] = useState({});
  const nameRegex = /^[A-Za-z']{2,}$/;
  const slugRegex = /^[a-z0-9-]{2,}$/;

  // Edit state
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategorySlug, setEditCategorySlug] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState([]);
  // IMS-REDISGNE
  const [showAddCategoryModel, setShowAddCategoryModel] = useState(false);
  const [showAddSubCategoryModel, setShowAddSubCategoryModel] = useState(false);
  const [activeTab, setActiveTab] = useState("category"); // <-- default category
  const [showActionsFor, setShowActionsFor] = useState(null);
  const buttonRefs = useRef({});
  const modelRef = useRef(null); // reference to modal area
  const modelAddRef = useRef(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [subCategoryName, setSubCategoryName] = useState("");
  const [products, setProducts] = useState([]);
  const [activeRow, setActiveRow] = useState(null);
  const [openRow, setOpenRow] = useState(null);
  const [showDeleteModel, setShowDeleteModel] = useState(false);
  const [showEditCategoryModel, setShowEditCategoryModel] = useState(false);
  const [showEditSubCategoryModel, setShowEditSubCategoryModel] =
    useState(false);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);

  const [dropdownPos, setDropdownPos] = useState({ x: 0, y: 0 });
  const [openUpwards, setOpenUpwards] = useState(false);

  // handle button click
  const handleCreateClick = () => {
    setShowCategoryActionsModel((prev) => !prev); // toggles open/close
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showAddSubCategoryModel &&
        modelAddRef.current &&
        !modelAddRef.current.contains(event.target)
      ) {
        setShowAddSubCategoryModel(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAddSubCategoryModel]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showAddSubCategoryModel &&
        modelAddRef.current &&
        !modelAddRef.current.contains(event.target)
      ) {
        setShowAddSubCategoryModel(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAddSubCategoryModel]);

  // ← Add this new one ↓
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!showActionsFor) return;

      const isClickInsideModel =
        modelRef.current && modelRef.current.contains(event.target);
      const isClickInsideButton =
        buttonRefs.current[showActionsFor] &&
        buttonRefs.current[showActionsFor].contains(event.target);

      if (!isClickInsideModel && !isClickInsideButton) {
        setShowActionsFor(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showActionsFor]);

  // Real-time validation for categoryName
  const validateCategoryName = (value) => {
    if (!value) {
      return "Category name is required";
    }
    if (!nameRegex.test(value)) {
      return "Category name must contain letters or colon (min 2 characters)";
    }
    return "";
  };

  // Handle category name change with real-time validation
  const handleCategoryNameChange = (e) => {
    const value = e.target.value;
    if (isEditMode) {
      setEditCategoryName(value);
    } else {
      setCategoryName(value);
    }
    setErrors((prev) => ({
      ...prev,
      categoryName: validateCategoryName(value),
    }));
  };

  const handleBulkDelete = async () => {
    const confirmed = await DeleteAlert({});
    if (!confirmed) return;

    try {
      // const token = localStorage.getItem("token");
      await api.post("/api/category/categories/bulk-delete", {
        ids: selectedCategories,
      });
      toast.success("Selected categories deleted");
      setSelectedCategories([]);
      fetchCategories();
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        toast.error("Unauthorized. Please login again");
      } else if (err.response?.status === 403) {
        toast.error("You don't have permission to delete categories");
      } else {
        toast.error("Bulk delete failed. Please try again");
      }
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/api/category/categories");

      // Filter out soft-deleted categories and their subcategories
      const activeCategories = res.data.filter(cat => cat.isDelete !== true);

      // Also filter subcategories inside each category
      const filteredCategories = activeCategories.map(cat => ({
        ...cat,
        subcategories: (cat.subcategories || []).filter(sub => sub.isDelete !== true)
      }));

      setCategories(filteredCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
    }
  };
  useEffect(() => {
    fetchCategories();
  }, []);

  //Fetch Products
  const fetchProducts = React.useCallback(async () => {
    // const token = localStorage.getItem("token");
    const params = {
      page: currentPage,
      limit: itemsPerPage,
    };

    try {
      const res = await api.get(`/api/products`, {
        // headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setProducts(res.data.products);
      setTotal(res.data.total);
      // Initialize all to "general"
      const initialTabs = res.data.products.reduce((acc, product) => {
        acc[product._id] = "general";
        return acc;
      }, {});
    } catch (err) {
      setProducts([]);
      setTotal(0);
      console.error("Failed to fetch products", err);
    }
  }, [selectedCategory, currentPage, itemsPerPage]);
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    let newErrors = {};
    newErrors.categoryName = validateCategoryName(categoryName);
    setErrors(newErrors);

    if (Object.values(newErrors).some(Boolean)) return;

    try {
      await api.post("/api/category/categories", {
        categoryName: categoryName.trim(),
        subCategoryName: subCategoryName?.trim() || "", // ✅ OPTIONAL
      });

      toast.success("Category created successfully!");

      setCategoryName("");
      setSubCategoryName("");
      setErrors({});
      fetchCategories();
      setShowAddCategoryModel(false);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Error creating category");
    }
  };

  const handleAddSubCategory = async (e) => {
    e.preventDefault();

    if (!subCategoryName.trim()) {
      toast.error("Subcategory name is required");
      return;
    }

    if (!selectedCategory?._id) {
      toast.error("Category not selected");
      return;
    }

    try {
      await api.post(
        `/api/subcategory/categories/${selectedCategory._id}/subcategories`,
        {
          name: subCategoryName.trim(),
        }
      );

      toast.success("Subcategory added successfully");

      setShowAddSubCategoryModel(false);
      setSelectedCategory(null);
      setSubCategoryName("");

      fetchCategories(); // refresh category list
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to add subcategory");
    }
  };

  const handleUpdate = async (updatedName) => {
    try {
      // const token = localStorage.getItem("token");

      await api.put(
        `/api/category/categories/${selectedCategory._id}`, // ✅ BACKTICKS
        {
          categoryName: sanitizeInput(updatedName),
        }
      );

      toast.success("Category updated successfully");
      setShowEditCategoryModel(false);
      fetchCategories();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update category");
    }
  };

  const filteredCategories = categories.filter((category) =>
    category?.categoryName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // All subcategories with parent info
  const allSubcategories = categories.flatMap((cat) =>
    (cat.subcategories || []).map((sub) => ({
      ...sub,
      parentCategory: cat.categoryName,
      parentId: cat._id,
    }))
  );

  // Filtered subcategories (for search)
  const filteredSubcategories = allSubcategories.filter((sub) =>
    sub.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Dynamic pagination based on active tab
  const currentItems =
    activeTab === "category"
      ? filteredCategories.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      )
      : filteredSubcategories.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      );

  const totalItems =
    activeTab === "category"
      ? filteredCategories.length
      : filteredSubcategories.length;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedCategories = filteredCategories.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);

  const handleDeleteClick = (id, type = "category") => {
    if (type === "subcategory") {
      setSelectedSubcategory(id);
    } else {
      setSelectedCategory(id);
    }
    setShowDeleteModel(true);
  };

  const hanleDelete = (id) => {
    setSelectedCategory(id);
  };

  // CSV, Excel, and PDF export functions (unchanged)
  const handleCSV = () => {
    const tableHeader = [
      "Category Code",
      "Category",
      "Category slug",
      "Created On",
    ];
    const csvRows = [
      tableHeader.join(","),
      ...categories.map((e) => [e.categoryName, e.createdAt].join(",")),
    ];
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "category.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExcel = () => {
    const excelData = categories.map((category) => ({
      "Category Code": category.categoryCode,
      Category: category.categoryName,
      // "Category Slug": category.categorySlug,
      "Created On": new Date(category.createdAt).toLocaleDateString(),
    }));
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const columnWidths = [{ wch: 15 }, { wch: 25 }, { wch: 25 }, { wch: 15 }];
    worksheet["!cols"] = columnWidths;
    XLSX.utils.book_append_sheet(workbook, worksheet, "Categories");
    XLSX.writeFile(workbook, "categories.xlsx");
  };

  const fileInputRef = React.useRef();

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith(".xlsx")) {
      toast.error("Please select a valid Excel file");
      return;
    }
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const requiredFields = [
          "Category Code",
          "Category",
          "Category slug",
          "Created On",
        ];
        const valid = results.data.every((row) =>
          requiredFields.every((f) => f in row && row[f] !== "")
        );
        if (!valid) {
          toast.error("File structure does not match the required schema.");
          return;
        }
        try {
          const token = localStorage.getItem("token");
          await api.post("/api/category/categories", results.data);
          toast.success("Imported successfully!");
          fetchCategories();
        } catch (err) {
          console.error("Error while importing:", err);
          toast.error("Error while importing categories");
        }
      },
    });
  };

  const handlePdf = () => {
    const doc = new jsPDF();
    doc.text("Category", 14, 15);
    const tableColumns = [
      "Category Name",
      "Sub Categories",
      "Number of Products",
    ];
    const tableRows = categories.map((e) => [
      e.categoryName,
      e.subcategories?.map((s) => s.name).join(", ") || 0,
      // e.products.filter((p) => p.category === e.categoryName).length || 0,
      e.products?.filter((p) => {
                                      const productCatId =
                                        typeof p.category === "string"
                                          ? p.category
                                          : p.category?._id;
                                      return productCatId === e._id && p.isDelete !== true;
                                    }).length || 0,
    ]);
    autoTable(doc, {
      head: [tableColumns],
      body: tableRows,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [155, 155, 155], textColor: "white" },
      theme: "striped",
    });
    doc.save("categories-subcategories.pdf");
  };

  const toggleRow = (index) => {
    const newOpen = openRow === index ? null : index;
    setOpenRow(newOpen);
    if (newOpen === null && activeRow === index) {
      setActiveRow(null);
    } else if (newOpen !== null) {
      setActiveRow(index);
    }
  };

  const getTextAndBgColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 6) - hash);
    }

    // Spread values better
    const hue = Math.abs(hash * 37) % 360; // stronger spread
    const saturation = 55 + (hash % 25); // 55–80
    const lightBg = 82 + (hash % 8); // 82–90
    const lightText = 22 + (hash % 10); // 22–32

    return {
      background: `hsl(${hue}, ${saturation}%, ${lightBg}%)`,
      text: `hsl(${hue}, ${saturation}%, ${lightText}%)`,
    };
  };
  const totalSubCategories =
    categories?.reduce(
      (total, cat) => total + (cat.subcategories?.length || 0),
      0
    ) || 0;

  const openEditModal = (category) => {
    setSelectedCategory(category);
    setShowEditCategoryModel(true);
  };

  const handleEditSubCategory = async ({ _id, name, categoryId }) => {
    if (!_id) return toast.error("Subcategory not selected");

    try {
      await api.put(`/api/subcategory/${_id}`, { name, categoryId });
      toast.success("Subcategory updated successfully");
      setShowEditSubCategoryModel(false);
      setSelectedSubcategory(null);
      fetchCategories();
    } catch (error) {
      console.error("Edit Subcategory Error:", error);
      toast.error(
        error.response?.data?.message || "Failed to update subcategory"
      );
    }
  };

  return (
    <div className="p-4">
      {categories.length === 0 ? (
        <>
          <div
            className="d-flex flex-column justify-content-center align-items-center py-5 overflow-y-auto"
            style={{ Height: "calc(100vh - 60px)" }}
          >
            <div className="text-center">
              <h1
                style={{
                  color: "black",
                  fontSize: 32,
                  fontFamily: "Inter",
                  fontWeight: "400",
                }}
              >
                Category
              </h1>
              <p
                style={{
                  fontSize: "16px",
                  fontFamily: "Inter",
                  fontWeight: "400",
                  color: "#727681",
                }}
              >
                You haven’t created any categories yet—add your first one now.
              </p>
            </div>
            <img
              className="py-5"
              src={blankCategory_img}
              alt="blankCategory_img"
            />
            <button
              onClick={() => setShowAddCategoryModel(true)}
              className="button-hover button-color"
              style={{
                border: "none",
                // backgroundColor: "rgb(31, 127, 255)",
                color: "white",
                fontSize: 16,
                fontFamily: "Inter",
                fontWeight: "500",
                borderRadius: "8px",
                padding: "8px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
              }}
            >
              {" "}
              <img src={cat_icon} alt="cat_icon" />
              Create Category
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="">
            <div style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0px 0px 16px 0px", // Optional: padding for container
            }}>
              <h1
                style={{
                  color: "#0E101A",
                  fontSize: 22,
                  fontFamily: "Inter",
                  fontWeight: "500",
                }}
              >
                Category
              </h1>
              <button
                onClick={() => setShowAddCategoryModel(true)}
                className="button-hover d-flex align-items-center gap-1"
                style={{
                  borderRadius: "8px",
                  padding: "5px 16px",
                  border: "1px solid rgb(31, 127, 255)",
                  color: "rgb(31, 127, 255)",
                  fontFamily: "Inter",
                  backgroundColor: "white",
                }}
              >
                <BiCategory /> Add Category
              </button>
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
              <div className="category-datalist-btn-container d-flex justify-content-between align-items-center flex-wrap">
                <div
                  className="category-btn-container d-flex justify-content-between align-items-center"
                  style={{
                    fontFamily: "Inter",
                    backgroundColor: "#F3F8FB",
                    height: "33",
                    borderRadius: "8px",
                    padding: "2px",
                    fontSize: "14px",
                    gap: "8px",
                  }}
                >
                  {/* CATEGORY BUTTON */}
                  <button
                    onClick={() => setActiveTab("category")}
                    style={{
                      backgroundColor:
                        activeTab === "category" ? "white" : "transparent",
                      color: activeTab === "category" ? "#0E101A" : "#000",
                      boxShadow:
                        activeTab === "category"
                          ? "rgba(149, 157, 165, 0.2) 0px 8px 24px"
                          : "",
                      borderRadius: activeTab === "category" ? "8px" : "0px",
                      border: "none",
                      padding: "6px 12px",
                    }}
                  >
                    Category{" "}
                    <span style={{ color: "#727681" }}>
                      {categories?.length || 0}
                    </span>
                  </button>
                  {/* SUB CATEGORY BUTTON */}
                  <button
                    onClick={() => setActiveTab("subcategory")(setOpenRow(false))}
                    style={{
                      backgroundColor:
                        activeTab === "subcategory" ? "white" : "transparent",
                      color: activeTab === "subcategory" ? "#0E101A" : "#000",
                      boxShadow:
                        activeTab === "subcategory"
                          ? "rgba(149, 157, 165, 0.2) 0px 8px 24px"
                          : "",
                      borderRadius:
                        activeTab === "subcategory" ? "8px" : "0px",
                      border: "none",
                      padding: "6px 12px",
                    }}
                  >
                    Sub-Category{" "}
                    <span style={{ color: "#727681" }}>
                      {totalSubCategories}
                    </span>
                  </button>
                </div>
                <div
                  className=""
                  style={{
                    display: "flex",
                    justifyContent: "end",
                    gap: "24px",
                    height: "33px",
                    width: "50%",
                  }}
                >
                  <div
                    className=""
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
                    <CiSearch className="fs-4" />
                    <input
                      type="search"
                      placeholder="Search"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1); // ✅ IMPORTANT
                      }}
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
              {/* ------- Tables Container ------- */}
              <div
                className="table-responsive"
                style={{
                  overflowY: "auto",
                  maxHeight: "510px",
                }}
              >
                {/* Category-data-table */}
                {activeTab === "category" && (
                  <table
                    className="table-responsive"
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      overflowX: "auto",
                    }}>
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
                            padding: "4px 16px",
                            color: "#727681",
                            fontWeight: "400",
                          }}
                        >
                          Category Name
                        </th>
                        <th
                          style={{
                            padding: "4px 16px",
                            color: "#727681",
                            fontWeight: "400",
                          }}
                        >
                          Sub Category
                        </th>
                        <th
                          style={{
                            padding: "4px 16px",
                            color: "#727681",
                            fontWeight: "400",
                          }}
                        >
                          No. Of Products
                        </th>
                        <th
                          style={{
                            padding: "4px 16px",
                            color: "#727681",
                            fontWeight: "400",
                          }}
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody style={{ fontFamily: "Inter", fontSize: "14px" }}>
                      {paginatedCategories.length === 0 ? (
                        <>
                          <tr>
                            <td
                              colSpan={4}
                              style={{
                                padding: "12px 16px",
                                verticalAlign: "middle",
                                textAlign: "center",
                                fontSize: 14,
                                color: "#6C748C",
                                fontStyle: "italic",
                              }}
                            >
                              No Record Found
                            </td>
                          </tr>
                        </>
                      ) : (
                        <>
                          {paginatedCategories.map((item, idx) => (
                            <React.Fragment key={idx}>
                              <tr
                                style={{
                                  height: "46px",
                                  borderBottom:
                                    "1px solid rgba(233, 233, 241, 1)",
                                }}
                                className={`table-hover ${activeRow === idx ? "active-row" : ""}`}
                              >
                                <td
                                  onClick={() => toggleRow(idx)}
                                  style={{
                                    padding: "4px 16px",
                                    cursor: "pointer",
                                  }}
                                >
                                  {item.categoryName}
                                </td>
                                <td
                                  onClick={() => toggleRow(idx)}
                                  style={{
                                    padding: "4px 16px",
                                    cursor: "pointer",
                                  }}
                                >
                                  {item.subcategories?.length}
                                </td>
                                <td style={{ padding: "4px 16px" }}>
                                  {
                                    products?.filter((p) => {
                                      const productCatId =
                                        typeof p.category === "string"
                                          ? p.category
                                          : p.category?._id;
                                      return productCatId === item._id && p.isDelete !== true;
                                    }).length
                                  }
                                </td>
                                <td style={{ padding: "4px 16px", textAlign: "center", position: "relative" }}>
                                  <button
                                    onClick={(e) => {
                                      const rect =
                                        e.currentTarget.getBoundingClientRect();
                                      setShowActionsFor(
                                        showActionsFor === item._id
                                          ? null
                                          : item._id
                                      )
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
                                    ref={(el) =>
                                      (buttonRefs.current[item._id] = el)
                                    }
                                  >
                                    <HiOutlineDotsHorizontal size={28} color="grey" />
                                  </button>

                                  {showActionsFor === item._id && (
                                    // Actions Model
                                    <div
                                      style={{
                                        position: "fixed",
                                        top: openUpwards
                                          ? dropdownPos.y - 145
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
                                          cursor: "pointer",
                                        }}
                                      >
                                        <ul
                                          style={{
                                            listStyle: "none",
                                            marginBottom: "0",
                                            display: "flex",
                                            justifyContent: "center",
                                            flexDirection: "column",
                                            gap: "10px",
                                          }}
                                        >
                                          <li
                                            onClick={() => {
                                              openEditModal(item);
                                              setShowActionsFor(null);
                                            }}
                                            className="button-action"
                                            style={{
                                              color: "#0E101A",
                                              fontFamily: "Inter",
                                              fontSize: "16px",
                                              display: "flex",
                                              alignItems: "center",
                                              gap: "10px",
                                              padding: " 5px 10px",
                                              borderRadius: "8px",
                                            }}
                                          >
                                            <img
                                              src={cat_actions_icon}
                                              alt="cat_actions_icon"
                                            />
                                            <label
                                              style={{
                                                color: "#0E101A",
                                                fontFamily: "Inter",
                                                fontSize: "16px",
                                                textDecoration: "none",
                                              }}
                                            >
                                              Edit
                                            </label>
                                          </li>

                                          <li
                                            onClick={() => {
                                              handleDeleteClick(
                                                item._id,
                                                "category"
                                              );
                                              setShowActionsFor(null);
                                            }}
                                            className="button-action"
                                            style={{
                                              color: "#0E101A",
                                              fontFamily: "Inter",
                                              fontSize: "16px",
                                              display: "flex",
                                              alignItems: "center",
                                              gap: "10px",
                                              padding: " 5px 10px",
                                              borderRadius: "8px",
                                            }}
                                          >
                                            <img
                                              src={cat_actions_icon3}
                                              alt="cat_actions_icon"
                                            />
                                            <label
                                              style={{
                                                color: "#0E101A",
                                                fontFamily: "Inter",
                                                fontSize: "16px",
                                                textDecoration: "none",
                                              }}
                                            >
                                              Delete
                                            </label>
                                          </li>
                                          <li
                                            onClick={() => {
                                              setSelectedCategory(item);
                                              setSubCategoryName("");
                                              setShowAddSubCategoryModel(true);
                                              setShowActionsFor(null);
                                            }}
                                            className="button-action"
                                            style={{
                                              color: "#0E101A",
                                              fontFamily: "Inter",
                                              fontSize: "16px",
                                              display: "flex",
                                              alignItems: "center",
                                              gap: "10px",
                                              padding: " 5px 10px",
                                              borderRadius: "8px",
                                            }}
                                          >
                                            <img
                                              src={cat_actions_icon}
                                              alt="cat_actions_icon"
                                            />
                                            <label
                                              style={{
                                                color: "#0E101A",
                                                fontFamily: "Inter",
                                                fontSize: "16px",
                                                textDecoration: "none",
                                              }}
                                            >
                                              Add Subcategory
                                            </label>
                                          </li>
                                        </ul>
                                      </div>
                                    </div>
                                  )}
                                </td>
                              </tr>
                              {/* COLLAPSE ROW EXACT SAME DESIGN KE NICHE */}
                              <tr>
                                <td colSpan="7" style={{ padding: "0" }}>
                                  <div
                                    style={{
                                      maxHeight:
                                        openRow === idx ? "500px" : "0px",
                                      overflow: "hidden",
                                      transition: "max-height 0.4s ease",
                                      backgroundColor: "#E5F0FF",
                                    }}
                                  >
                                    {/* Collapse Content */}
                                    <div
                                      style={{
                                        padding: "16px",
                                        display: "flex",
                                        gap: "80px",
                                      }}
                                    >
                                      <label htmlFor="">Sub Category:-</label>
                                      <span>
                                        {item.subcategories.length === 0 ? (
                                          <>
                                            <span
                                              style={{ fontStyle: "italic" }}
                                            >
                                              Empty Sub Category
                                            </span>
                                          </>
                                        ) : (
                                          <>
                                            {item.subcategories?.map(
                                              (sub, i) => {
                                                const { background, text } =
                                                  getTextAndBgColor(sub.name);

                                                return (
                                                  <span
                                                    key={sub._id || i}
                                                    style={{
                                                      backgroundColor:
                                                        background,
                                                      color: text,
                                                      margin: "2px",
                                                      padding: "4px 8px",
                                                      borderRadius: "36px",
                                                      display: "inline-block",
                                                      fontSize: "12px",
                                                      fontWeight: 500,
                                                    }}
                                                  >
                                                    {sub.name}
                                                  </span>
                                                );
                                              }
                                            )}
                                          </>
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            </React.Fragment>
                          ))}
                        </>
                      )}
                    </tbody>
                  </table>
                )}

                {/* Sub-category-data-table */}
                {activeTab === "subcategory" && (
                  <table
                    className="table-responsive"
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      overflowX: "auto",
                    }}>
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
                            padding: "4px 16px",
                            color: "#727681",
                            fontWeight: "400",
                          }}
                        >
                          Sub-Category Name
                        </th>
                        <th
                          style={{
                            padding: "4px 16px",
                            color: "#727681",
                            fontWeight: "400",
                          }}
                        >
                          Parent Category
                        </th>
                        <th
                          style={{
                            padding: "4px 16px",
                            color: "#727681",
                            fontWeight: "400",
                          }}
                        >
                          No. Of Products
                        </th>
                        <th
                          style={{
                            padding: "4px 16px",
                            color: "#727681",
                            fontWeight: "400",
                          }}
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody style={{ fontFamily: "Inter", fontSize: "14px" }}>
                      {currentItems.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            style={{
                              padding: "12px 16px",
                              verticalAlign: "middle",
                              textAlign: "center",
                              fontSize: 14,
                              color: "#6C748C",
                              fontStyle: "italic",
                            }}
                          >
                            No Record Found
                          </td>
                        </tr>
                      ) : (
                        currentItems.map((sub, idx) => (
                          <tr
                            key={sub._id}
                            style={{
                              height: "46px",
                              borderBottom: "1px solid rgb(233, 233, 241)",
                            }}
                            className={`table-hover ${activeRow === idx ? "active-row" : ""}`}
                          >
                            <td style={{ padding: "4px 16px" }}>
                              {sub.name}
                            </td>
                            <td style={{ padding: "4px 16px" }}>
                              {sub.parentCategory}
                            </td>
                            <td style={{ padding: "4px 16px" }}>
                              {
                                products?.filter((p) => {
                                  const productSubId =
                                    typeof p.subcategory === "string"
                                      ? p.subcategory
                                      : p.subcategory?._id;
                                  return (
                                    productSubId === sub._id &&
                                    p.isDelete !== true
                                  );
                                }).length
                              }
                            </td>
                            <td style={{ padding: "4px 16px" }}>
                              <button
                                onClick={(e) => {
                                  const rect =
                                    e.currentTarget.getBoundingClientRect();
                                  setShowActionsFor(
                                    showActionsFor === sub._id
                                      ? null
                                      : sub._id
                                  )
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
                                }}
                                ref={(el) =>
                                  (buttonRefs.current[sub._id] = el)
                                }
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
                              {showActionsFor === sub._id && (
                                <div
                                  style={{
                                    position: "fixed",
                                    top: openUpwards
                                      ? dropdownPos.y - 100
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
                                      cursor: "pointer",
                                    }}
                                  >
                                    <ul
                                      style={{
                                        listStyle: "none",
                                        marginBottom: "0",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "10px",
                                      }}
                                    >
                                      <li
                                        onClick={() => {
                                          setSelectedSubcategory(sub);
                                          setShowEditSubCategoryModel(true);
                                          setShowActionsFor(null);
                                        }}
                                        className="button-action"
                                        style={{
                                          color: "#0E101A",
                                          fontFamily: "Inter",
                                          fontSize: "16px",
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "10px",
                                          padding: "5px 10px",
                                          borderRadius: "8px",
                                        }}
                                      >
                                        <img
                                          src={cat_actions_icon}
                                          alt="edit"
                                        />
                                        <label
                                          style={{
                                            color: "#0E101A",
                                            fontFamily: "Inter",
                                            fontSize: "16px",
                                          }}
                                        >
                                          Edit
                                        </label>
                                      </li>
                                      {/* <li
                                        className="button-action"
                                        style={{
                                          color: "#0E101A",
                                          fontFamily: "Inter",
                                          fontSize: "16px",
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "10px",
                                          padding: "5px 10px",
                                          borderRadius: "8px",
                                        }}
                                      >
                                        <img
                                          src={cat_actions_icon2}
                                          alt="view"
                                        />
                                        <label
                                          style={{
                                            color: "#0E101A",
                                            fontFamily: "Inter",
                                            fontSize: "16px",
                                          }}
                                        >
                                          View Details
                                        </label>
                                      </li> */}
                                      <li
                                        onClick={() => {
                                          handleDeleteClick(
                                            sub._id,
                                            "subcategory"
                                          );
                                          setShowActionsFor(null);
                                        }}
                                        className="button-action"
                                        style={{
                                          color: "#0E101A",
                                          fontFamily: "Inter",
                                          fontSize: "16px",
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "10px",
                                          padding: "5px 10px",
                                          borderRadius: "8px",
                                        }}
                                      >
                                        <img
                                          src={cat_actions_icon3}
                                          alt="delete"
                                        />
                                        <label
                                          style={{
                                            color: "#0E101A",
                                            fontFamily: "Inter",
                                            fontSize: "16px",
                                          }}
                                        >
                                          Delete
                                        </label>
                                      </li>
                                    </ul>
                                  </div>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="page-redirect-btn">
                <Pagination
                  currentPage={currentPage}
                  total={totalItems} // Dynamic total based on tab
                  itemsPerPage={itemsPerPage}
                  onPageChange={(page) => setCurrentPage(page)}
                  onItemsPerPageChange={(count) => {
                    setItemsPerPage(count);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}
      {showAddCategoryModel && (
        <CreateCategoryModal
          closeModal={() => setShowAddCategoryModel(false)}
          modalId="categoryModal"
          title={isEditMode ? [t("Edit Category")] : [t("Add Category")]}
          isEditMode={isEditMode}
          categoryName={isEditMode ? editCategoryName : categoryName}
          subCategoryName={subCategoryName} // ✅ ADD THIS
          onSubCategoryChange={(e) => setSubCategoryName(e.target.value)}
          onCategoryChange={handleCategoryNameChange}
          onSubmit={handleSubmit}
          submitLabel={isEditMode ? [t("Update")] : [t("Save")]}
          errors={errors}
        />
      )}
      {showAddSubCategoryModel && (
        <CreateSubCategoryModel
          modelAddRef={modelAddRef}
          closeModal={() => setShowAddSubCategoryModel(false)}
          categoryName={selectedCategory?.categoryName} // ✅
          subCategoryName={subCategoryName} // ✅
          onSubCategoryChange={(e) => setSubCategoryName(e.target.value)}
          onSubmit={handleAddSubCategory}
        />
      )}
      {showDeleteModel && (
        <ConfirmDelete
          isOpen={showDeleteModel}
          onCancel={() => {
            setShowDeleteModel(false);
            setSelectedCategory(null);
            setSelectedSubcategory(null);
          }}
          onConfirm={async () => {
            try {
              if (selectedSubcategory) {
                // Delete subcategory
                await api.delete(`/api/subcategory/${selectedSubcategory}`);
                toast.success("Subcategory deleted successfully!");
              } else if (selectedCategory) {
                // Delete category
                await api.delete(
                  `/api/category/categories/${selectedCategory}`
                );
                toast.success("Category deleted successfully!");
              }
              fetchCategories();
            } catch (error) {
              console.error("Delete error:", error);
              toast.error("Failed to delete item");
            } finally {
              setShowDeleteModel(false);
              setSelectedCategory(null);
              setSelectedSubcategory(null);
            }
          }}
          title="Confirm Deletion"
          message={
            selectedSubcategory
              ? "Are you sure you want to delete this subcategory? This action cannot be undone."
              : "Are you sure you want to delete this category? All associated subcategories will also be affected."
          }
        />
      )}
      {showEditCategoryModel && (
        <CreateEditCategoryModel
          closeModal={() => setShowEditCategoryModel(false)}
          category={selectedCategory} // 👈 pass full object
          onSubmit={handleUpdate}
          submitLabel="Update"
        />
      )}
      {showEditSubCategoryModel && (
        <CreateEditSubCategoryModel
          closeModal={() => setShowEditSubCategoryModel(false)}
          subcategory={selectedSubcategory}
          onSubmit={handleEditSubCategory}
        />
      )}
    </div>

  );
};

export default Category;
