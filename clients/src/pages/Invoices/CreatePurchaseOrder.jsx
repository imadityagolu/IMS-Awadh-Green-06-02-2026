import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { LuCalendarMinus2 } from "react-icons/lu";
import { FiChevronDown } from "react-icons/fi";
import { CiBarcode } from "react-icons/ci";
import { RiImageAddFill } from "react-icons/ri";
import { IoIosCloseCircleOutline } from "react-icons/io";
import { RiDeleteBinLine } from "react-icons/ri";
import indialogo from "../../assets/images/india-logo.png";
import total_orders_icon from "../../assets/images/totalorders-icon.png";
import CompanyLogo from "../../assets/images/kasperlogo.png";
import TaxInvoiceLogo from "../../assets/images/taxinvoice.png";
import Qrcode from "../../assets/images/qrcode.png";
import api from "../config/axiosInstance";
import { toast } from "react-toastify";
import { toWords } from "number-to-words";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import AddSuppliers from "../Modal/suppliers/AddSupplierModals";
import { FiSearch } from "react-icons/fi";

function CreatePurchaseOrder() {
  const viewManageRef = useRef(null); //for handle click outside for calendar

  const hasAddedInitialProduct = useRef(false);
  const { supplierId } = useParams();
  const navigate = useNavigate();
  // State for supplier selection/selection
  const [supplierSearch, setSupplierSearch] = useState("");
  const [allSupplier, setAllSupplier] = useState([]);
  const [filteredSupplier, setFilteredSupplier] = useState([]);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  // modal state
  const [openAddModal, setOpenAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState({});
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [productLoading, setProductLoading] = useState(false);
  const [activeSearchId, setActiveSearchId] = useState(null);
  const [searchData, setSearchData] = useState({});
  const inputRef = useRef(null);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [additionalDiscountType, setAdditionalDiscountType] =
    useState("Percentage"); // "Fixed" or "Percentage"

  // Modals
  const [viewManageOptions, setViewManageOptions] = useState(false);
  const [viewInvoiceOptions, setViewInvoiceOptions] = useState(false);
  const [viewChargeOptions, setViewChargeOptions] = useState(false);
  const [selectedChargeType, setSelectedChargeType] = useState("");
  const [chargeAmount, setChargeAmount] = useState("");

  const handleViewManage = () => setViewManageOptions(true);
  const handleViewInvoice = (open) => setViewInvoiceOptions(open);
  const handleViewChargeOptions = () => setViewChargeOptions((prev) => !prev);

  const buttonRefs = useRef([]);
  const modelRef = useRef(null);
  const chargeRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modelRef.current && !modelRef.current.contains(event.target)) {
        setViewInvoiceOptions(false);
      }
      if (chargeRef.current && !chargeRef.current.contains(event.target)) {
        setViewChargeOptions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // check if we're in "create from navbar" mode (no supplierId)
  const isFromNavbar = !supplierId;

  // Form state
  const [supplier, setSupplier] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    gstin: "",
    supplierId: "",
  });

  const [invoiceDate, setInvoiceDate] = useState(new Date());
  const [invoiceNo, setInvoiceNo] = useState("");

  useEffect(() => {
    const generateInvoiceNumber = () => {
      const prefix = "INV";
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const sequence = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0");
      return `${prefix}${year}${month}${sequence}`;
    };
    setInvoiceNo(generateInvoiceNumber());
  }, []);

  // Fetch supplier for search (when in navbar mode)
  useEffect(() => {
    if (isFromNavbar) {
      fetchSupplierForSearch();
    }
  }, [isFromNavbar]);

  const fetchSupplierForSearch = async () => {
    try {
      const response = await api.get("/api/suppliers");
      console.log("Supplier API response:", response.data.suppliers);

      // The response has {total: X, suppliers: [...]}
      if (response.data && Array.isArray(response.data.suppliers)) {
        setAllSupplier(response.data.suppliers);
        setFilteredSupplier(response.data.suppliers);
      } else {
        console.error("Unexpected supplier data format:", response.data);
        setAllSupplier([]);
        setFilteredSupplier([]);
        toast.error("Invalid supplier data format");
      }
    } catch (error) {
      console.error("Error fetching supplier:", error);
      toast.error("Failed to load suppliers");
      setAllSupplier([]);
      setFilteredSupplier([]);
    }
  };

  // Handle supplier search
  useEffect(() => {
    if (!supplierSearch.trim()) {
      setFilteredSupplier(allSupplier);
      return;
    }
    const searchTerm = supplierSearch.toLowerCase();
    const filtered = allSupplier.filter(
      (sup) =>
        sup.name?.toLowerCase().includes(searchTerm) ||
        sup.phone?.includes(supplierSearch) ||
        sup.email?.toLowerCase().includes(searchTerm),
    );
    setFilteredSupplier(filtered);
  }, [supplierSearch, allSupplier]);

  const [products, setProducts] = useState([]);
  const [productOptions, setProductOptions] = useState([]);

  // Additional Charges
  const [additionalChargesDetails, setAdditionalChargesDetails] = useState({
    shipping: 0,
    handling: 0,
    packing: 0,
    service: 0,
    other: 0,
  });

  const [additionalDiscountPct, setAdditionalDiscountPct] = useState("");
  const [additionalDiscountAmt, setAdditionalDiscountAmt] = useState("");
  const [autoRoundOff, setAutoRoundOff] = useState(false);
  const [fullyReceived, setFullyReceived] = useState(false);
  const [amountPaid, setAmountPaid] = useState("");
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Fetch supplier & products
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch supplier details
        if (supplierId) {
          const supplierRes = await api.get(`/api/suppliers/${supplierId}`);
          const s = supplierRes.data;
          console.log("Fetched supplier data:", s);
          setSupplier({
            name: s.supplierName || "",
            phone: s.phone || "",
            address: [s.address.addressLine, s.address.state, s.address.pincode]
              .filter(Boolean)
              .join(", "),
            email: s.email || "",
            gstin: s.gstin || "",
            supplierId: s._id,
          });
          setSupplierSearch(s.supplierName || "");
        }

        // Fetch products
        const productsRes = await api.get("/api/products");
        setProductLoading(true);

        // Store all products for searching
        const fetchedProducts = productsRes.data.products || productsRes.data;
        setAllProducts(fetchedProducts);
        setFilteredProducts(fetchedProducts);
        setProductOptions(
          fetchedProducts.map((p) => ({
            value: p._id,
            label: p.productName,
            price: p.purchasePrice || 0, // Use purchase price for supplier
            taxRate: parseFloat(p.tax?.match(/\d+/)?.[0]) || 0,
            unit: p.unit || "Piece",
            hsnCode: p.hsn?.hsnCode || "",
            taxType: p.tax || "GST 0%",
            discountAmount: p.discountAmount || 0,
            discountType: p.discountType || "Percentage",
            imageUrl: p.images?.[0]?.url || p.images?.[0]?.secure_url || "",
          })),
        );

        // Add initial product row
        if (!hasAddedInitialProduct.current && products.length === 0) {
          addProductRow();
          hasAddedInitialProduct.current = true;
        }
      } catch (err) {
        console.error("Data fetch error:", err);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
        setProductLoading(false);
      }
    };
    loadData();
  }, [supplierId]);
  // Add these functions to your CreatePurchaseOrder component:

  // handle supplier selection from dropdown
  const handleSupplierSelect = (selectedSupplier) => {
    console.log("Selected supplier:", selectedSupplier);
    setSupplier({
      name: selectedSupplier.name || "",
      phone: selectedSupplier.phone || "",
      address: [
        selectedSupplier.address?.addressLine,
        selectedSupplier.address?.city,
        selectedSupplier.address?.state,
        selectedSupplier.address?.pincode,
      ]
        .filter(Boolean)
        .join(", "),
      email: selectedSupplier.email || "",
      gstin: selectedSupplier.gstin || "",
      supplierId: selectedSupplier._id, // Store the ID
    });
    setSupplierSearch(selectedSupplier.name);
    setShowSupplierDropdown(false);
  };

  // handle new supplier creation success
  const handleNewSupplierCreated = (newSupplier) => {
    fetchSupplierForSearch();
    // Auto select the newly created supplier
    handleSupplierSelect(newSupplier);
    toast.success("Supplier created successfully!");
  };

  // clear selected supplier
  const handleClearSupplier = () => {
    setSupplier({
      name: "",
      phone: "",
      address: "",
      email: "",
      gstin: "",
      supplierId: "",
    });
    setSupplierSearch("");
  };

  useEffect(() => {
    if (products.length > 0 && allProducts.length > 0) {
      setSearchData((prev) => {
        const updated = { ...prev };
        products.forEach((p) => {
          if (!updated[p.id]) {
            updated[p.id] = {
              term: "",
              filtered: allProducts,
              isOpen: false,
            };
          }
        });
        return updated;
      });
    }
  }, [products, allProducts]);

  const handleSearch = (e, rowId) => {
    const term = e.target.value;

    const filtered = allProducts.filter((p) =>
      p.productName?.toLowerCase().includes(term.toLowerCase()),
    );

    setSearchData((prev) => ({
      ...prev,
      [rowId]: {
        term,
        filtered,
        isOpen: true,
      },
    }));
  };

  // Add this useEffect for handling click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".search-input-container")) {
        setSearchData((prev) => {
          const closed = {};
          Object.keys(prev).forEach((id) => {
            closed[id] = { ...prev[id], isOpen: false };
          });
          return closed;
        });
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openDropdown = (rowId) => {
    const inputElement = document.querySelector(`[data-row-id="${rowId}"]`);
    if (!inputElement) return;

    const rect = inputElement.getBoundingClientRect();

    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
      width: "400px",
      maxHeight: "400px",
      overflowY: "auto",
      backgroundColor: "#fff",
      border: "1px solid #E5E7EB",
      borderRadius: "6px",
      boxShadow: "0 4px 12px rgba(0,0,0,.1)",
      zIndex: 10000,
    });

    setActiveSearchId(rowId);
  };

  const handleProductSelect = (product, rowId) => {
    // Update product data with productId
    updateProduct(rowId, "productId", product._id);

    // Update with product details
    updateProduct(rowId, "itemName", product.productName);
    updateProduct(rowId, "name", product.productName);
    updateProduct(rowId, "unitPrice", product.purchasePrice || 0); // Use purchase price
    updateProduct(
      rowId,
      "taxRate",
      parseFloat(product.tax?.match(/\d+/)?.[0]) || 0,
    );
    updateProduct(rowId, "taxType", product.tax || "GST 0%");
    updateProduct(rowId, "unit", product.unit || "Piece");
    updateProduct(rowId, "hsnCode", product.hsn?.hsnCode || "");

    // Update search data
    setSearchData((prev) => ({
      ...prev,
      [rowId]: {
        term: product.productName,
        filtered: [],
        isOpen: false,
      },
    }));

    // Close dropdown
    setDropdownStyle({});
    setActiveSearchId(null);
  };

  const addProductRow = () => {
    const newId = Date.now() + Math.random();
    setProducts((prev) => [
      ...prev,
      {
        id: newId,
        productId: "",
        itemName: "",
        name: "",
        qty: "",
        unit: "Piece",
        unitPrice: "",
        taxRate: 0,
        taxType: "GST 0%",
        taxAmount: 0,
        discountPct: "",
        discountAmt: 0,
        amount: 0,
        hsnCode: "",
      },
    ]);
    // Initialize search data for this new row
    setSearchData((prev) => ({
      ...prev,
      [newId]: {
        term: "",
        filtered: allProducts.length > 0 ? allProducts : [],
        isOpen: false,
      },
    }));
  };

  const removeProductRow = (id) => {
    if (products.length > 1) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      // Also remove search data for this row
      setSearchData((prev) => {
        const newData = { ...prev };
        delete newData[id];
        return newData;
      });
    }
  };

  const updateProduct = (id, field, value) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;

        let updated = { ...p };

        // Handle quantity specially to enforce minimum of 1
        if (field === "qty") {
          const numValue = parseFloat(value);
          updated.qty = isNaN(numValue) || numValue < 1 ? 1 : numValue;
        } else {
          updated[field] = value;
        }

        // If product selected from dropdown
        if (field === "productId") {
          updated.productId = value;
          const selected = productOptions.find((opt) => opt.value === value);
          if (selected) {
            // Calculate discount based on discountType
            let discountPct = 0;
            let discountAmt = 0;

            if (selected.discountType === "Percentage") {
              discountPct = selected.discountAmount || 0;
            } else if (selected.discountType === "Fixed") {
              // For fixed amount, calculate percentage based on unit price
              discountAmt = selected.discountAmount || 0;
              if (selected.price > 0) {
                discountPct = (discountAmt / selected.price) * 100;
              }
            }
            updated = {
              ...updated,
              itemName: selected.label,
              name: selected.label,
              unitPrice: selected.price,
              taxRate: selected.taxRate,
              taxType: selected.taxType,
              unit: selected.unit,
              hsnCode: selected.hsnCode,
              qty: 1,
              discountPct: discountPct,
              discountAmt: discountAmt,
            };
          }
        }

        // Handle manual discount updates
        if (field === "discountPct") {
          const pctValue = parseFloat(value) || 0;
          updated.discountPct = pctValue;
        } else if (field === "discountAmt") {
          const amtValue = parseFloat(value) || 0;
          updated.discountAmt = amtValue;
        }

        // Recalculate line
        const qty = parseFloat(updated.qty) || 1;
        const unitPrice = parseFloat(updated.unitPrice) || 0;
        const base = qty * unitPrice;
        let discAmt = 0;
        let discPct = 0;

        // Check if discountAmt was manually entered (has value)
        if (
          field === "discountAmt" &&
          value !== "" &&
          !isNaN(parseFloat(value))
        ) {
          // User entered discount amount directly
          discAmt = parseFloat(value) || 0;
          // Calculate percentage from amount
          discPct = base > 0 ? (discAmt / base) * 100 : 0;
          updated.discountPct = discPct;
        }
        // Check if discountPct was manually entered
        else if (
          field === "discountPct" &&
          value !== "" &&
          !isNaN(parseFloat(value))
        ) {
          // User entered discount percentage directly
          discPct = parseFloat(value) || 0;
          // Calculate amount from percentage
          discAmt = (base * discPct) / 100;
          updated.discountAmt = discAmt;
        }
        // Otherwise use existing values
        else {
          discPct = parseFloat(updated.discountPct) || 0;
          discAmt = (base * discPct) / 100;
        }

        // Ensure discount doesn't exceed base amount
        discAmt = Math.min(discAmt, base);

        const taxable = Math.max(base - discAmt, 0);
        const taxAmt = (taxable * (updated.taxRate || 0)) / 100;

        updated.taxAmount = taxAmt;
        updated.discountAmt = discAmt;
        updated.amount = taxable + taxAmt;

        updated.discountPct = discPct;

        return updated;
      }),
    );
  };

  // Calculate additional charges total
  const additionalChargesTotal = Object.values(additionalChargesDetails).reduce(
    (sum, charge) => sum + parseFloat(charge || 0),
    0,
  );

  // Calculate totals
  const subtotal = products.reduce((sum, p) => {
    const qty = parseFloat(p.qty) || 0;
    const unitPrice = parseFloat(p.unitPrice) || 0;
    return sum + qty * unitPrice;
  }, 0);

  const totalTax = products.reduce((sum, p) => sum + (p.taxAmount || 0), 0);
  const itemsDiscount = products.reduce(
    (sum, p) => sum + (p.discountAmt || 0),
    0,
  );

  const additionalDiscountValue =
    additionalDiscountType === "Percentage" && additionalDiscountPct
      ? (subtotal * parseFloat(additionalDiscountPct)) / 100
      : additionalDiscountType === "Fixed" && additionalDiscountAmt
        ? parseFloat(additionalDiscountAmt) || 0
        : 0;

  const totalDiscount = itemsDiscount + additionalDiscountValue;

  const grandTotalBefore =
    subtotal + totalTax + additionalChargesTotal - totalDiscount;

  const roundedTotal = autoRoundOff
    ? Math.round(grandTotalBefore)
    : grandTotalBefore;
  const roundOffAdded = roundedTotal - grandTotalBefore;
  const grandTotal = Math.max(0, roundedTotal);

  useEffect(() => {
    if (fullyReceived) {
      setAmountPaid(grandTotal.toFixed(2));
    }
  }, [fullyReceived, grandTotal]);

  const amountDue = Math.max(0, grandTotal - (parseFloat(amountPaid) || 0));

  // Handle file upload
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
    ];
    const validFiles = files.filter((file) => allowedTypes.includes(file.type));

    if (validFiles.length !== files.length) {
      toast.error("Only JPG, JPEG, PNG and PDF files are allowed!");
    }

    const newImages = validFiles.map((file) => ({
      file,
      preview: file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : null,
      filename: file.name,
      type: file.type,
    }));

    setUploadedImages((prev) => [...prev, ...newImages]);
  };

  // Handle charge selection
  const handleChargeSelect = (chargeType) => {
    setSelectedChargeType(chargeType);
    setViewChargeOptions(false);
  };

  const handleChargeDone = () => {
    if (chargeAmount && selectedChargeType) {
      const chargeKey = selectedChargeType.toLowerCase().replace(" charge", "");
      const validChargeKeys = [
        "shipping",
        "handling",
        "packing",
        "service",
        "other",
      ];

      if (validChargeKeys.includes(chargeKey)) {
        setAdditionalChargesDetails((prev) => ({
          ...prev,
          [chargeKey]: parseFloat(chargeAmount) || 0,
        }));
        setChargeAmount("");
        setSelectedChargeType("");
        setViewChargeOptions(false);
        toast.success(`${selectedChargeType} added: ₹${chargeAmount}`);
      }
    }
  };

  // Handle date selection
  const handleDateSelect = (option) => {
    const today = new Date();
    let selectedDate = new Date();

    switch (option) {
      case "Today":
        selectedDate = today;
        setInvoiceDate(selectedDate);
        setViewManageOptions(false);
        setIsDatePickerOpen(false);
        break;
      case "Yesterday":
        selectedDate = new Date(today.setDate(today.getDate() - 1));
        setInvoiceDate(selectedDate);
        setViewManageOptions(false);
        setIsDatePickerOpen(false);
        break;
      case "Last Week":
        selectedDate = new Date(today.setDate(today.getDate() - 7));
        setInvoiceDate(selectedDate);
        setViewManageOptions(false);
        setIsDatePickerOpen(false);
        break;
      case "Last 15 Days":
        selectedDate = new Date(today.setDate(today.getDate() - 15));
        setInvoiceDate(selectedDate);
        setViewManageOptions(false);
        setIsDatePickerOpen(false);
        break;
      case "Last Month":
        selectedDate = new Date(today.setMonth(today.getMonth() - 1));
        setInvoiceDate(selectedDate);
        setViewManageOptions(false);
        setIsDatePickerOpen(false);
        break;
      case "Custom":
        setIsDatePickerOpen(true);
        break;
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    // When from navbar, check if supplier is selected
    if (isFromNavbar) {
      if (!supplier.supplierId) {
        newErrors.supplierName = "Please select a supplier";
      }
    } else {
      // When from supplier page, check name directly
      if (!supplier.name.trim()) {
        newErrors.supplierName = "Supplier name is required";
      }
    }

    if (!supplier.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(supplier.phone)) {
      newErrors.phone = "Phone number must be 10 digits";
    }

    if (!supplier.address.trim()) {
      newErrors.address = "Address is required";
    }

    if (products.length === 0) {
      newErrors.products = "At least one product is required";
    }

    setErrors(newErrors);

    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors,
    };
  };

  // Handle form submission for supplier invoice
  const handleSubmit = async (shouldPrint = false) => {
    if (!supplier.supplierId) {
      toast.error("Please select a supplier first");
      return;
    }
    if (isSubmitting) {
      return;
    }

    const { isValid, errors } = validateForm();
    if (!isValid) {
      const firstErrorKey = Object.keys(errors)[0];
      toast.error(errors[firstErrorKey]);
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare FormData for file uploads
      const formData = new FormData();

      // Add all invoice data as separate fields - FOR SUPPLIER
      // formData.append("supplierId", supplierId);
      formData.append("supplierId", supplier.supplierId);
      formData.append("invoiceDate", invoiceDate.toISOString());
      formData.append(
        "dueDate",
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      ); // 30 days for supplier
      formData.append("billingAddress", supplier.address);
      formData.append("shippingAddress", supplier.address);
      formData.append("subtotal", subtotal);
      formData.append("totalTax", totalTax);
      formData.append("totalDiscount", totalDiscount);
      formData.append("additionalCharges", additionalChargesTotal);
      formData.append("autoRoundOff", autoRoundOff);
      formData.append("grandTotal", grandTotal);
      formData.append("paidAmount", parseFloat(amountPaid) || 0);
      formData.append("fullyReceived", fullyReceived);
      formData.append("paymentMethod", "bank_transfer");
      formData.append(
        "status",
        fullyReceived || (parseFloat(amountPaid) || 0) >= grandTotal
          ? "received"
          : "draft",
      );
      formData.append("notes", "");
      formData.append("termsAndConditions", "");

      // Add additional discount as object
      formData.append(
        "additionalDiscount[pct]",
        parseFloat(additionalDiscountPct) || 0,
      );
      formData.append(
        "additionalDiscount[amt]",
        parseFloat(additionalDiscountAmt) || 0,
      );

      // Add additional charges details as separate fields
      formData.append(
        "additionalChargesDetails[shipping]",
        additionalChargesDetails.shipping,
      );
      formData.append(
        "additionalChargesDetails[handling]",
        additionalChargesDetails.handling,
      );
      formData.append(
        "additionalChargesDetails[packing]",
        additionalChargesDetails.packing,
      );
      formData.append(
        "additionalChargesDetails[service]",
        additionalChargesDetails.service,
      );
      formData.append(
        "additionalChargesDetails[other]",
        additionalChargesDetails.other,
      );

      // Add items array
      products.forEach((p, index) => {
        formData.append(`items[${index}][productId]`, p.productId);
        formData.append(`items[${index}][itemName]`, p.itemName || p.name);
        formData.append(`items[${index}][hsnCode]`, p.hsnCode || "");
        formData.append(`items[${index}][qty]`, parseFloat(p.qty));
        formData.append(`items[${index}][unit]`, p.unit);
        formData.append(`items[${index}][unitPrice]`, parseFloat(p.unitPrice));
        formData.append(`items[${index}][taxType]`, `GST ${p.taxRate}%`);
        formData.append(`items[${index}][taxRate]`, p.taxRate);
        formData.append(`items[${index}][taxAmount]`, p.taxAmount);
        formData.append(
          `items[${index}][discountPct]`,
          parseFloat(p.discountPct) || 0,
        );
        formData.append(`items[${index}][discountAmt]`, p.discountAmt);
        formData.append(`items[${index}][amount]`, p.amount);
      });

      // Add uploaded images
      uploadedImages.forEach((image, index) => {
        formData.append(`attachments`, image.file, image.filename);
      });

      // Debug: Log what's being sent
      console.log("Sending form data for supplier invoice:");

      // Send to supplier invoice backend
      const response = await api.post("/api/purchase-orders", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Response:", response.data);

      if (response.data.success) {
        toast.success("Purchase Order created successfully!");

        if (shouldPrint) {
          // Navigate to print page with invoice ID
          navigate(
            `/skeleton?redirect=/purchase-order-preview/${response.data.invoice._id}`,
          );
        } else {
          // Navigate to show invoice page with the invoice data
          navigate("/skeleton?redirect=/purchase-list");
        }
      } else {
        toast.error(response.data.error || "Failed to create supplier invoice");
      }
    } catch (error) {
      console.error("Supplier invoice creation failed:", error);

      // Show detailed error information
      if (error.response?.data?.error) {
        toast.error(`Backend error: ${error.response.data.error}`);
      } else if (error.response?.data?.message) {
        toast.error(`Validation error: ${error.response.data.message}`);
      } else if (error.response?.data?.details) {
        const validationErrors = error.response.data.details.join(", ");
        toast.error(`Validation errors: ${validationErrors}`);
      } else if (error.response?.status === 500) {
        toast.error("Server error 500. Check backend logs.");
      } else {
        toast.error("Failed to create supplier invoice. Please try again.");
      }

      // Log full error for debugging
      console.log("Full error response:", error.response?.data);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper for preview
  const parseNumber = (num) => parseFloat(num) || 0;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        viewManageRef.current &&
        !viewManageRef.current.contains(event.target)
      ) {
        setViewManageOptions(false);
        setIsDatePickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="px-4 py-4" style={{ height: "100vh" }}>
      <div
        className=""
        style={{ overflow: "hidden", height: "calc(100vh - 100px)" }}
      >
        <div className="">
          {/* Header */}
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0px 0px",
              height: "80px",
            }}
          >
            {/* Left: Title + Icon */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                height: "32px",
                padding: "0px 24px",
              }}
            >
              {/* Icon Container */}
              <Link to="/supplier-list" style={{ textDecoration: "none" }}>
                <span
                  style={{
                    backgroundColor: "white",
                    width: "32px",
                    height: "32px",
                    borderRadius: "50px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    border: "1px solid #FCFCFC",
                    cursor: "pointer",
                  }}
                >
                  <img src={total_orders_icon} alt="total_orders_icon" />
                </span>
              </Link>

              {/* Title */}
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
                Create Purchase Order
              </h2>
            </div>

            {/* Right: Preview Button */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                height: "33px",
              }}
            >
              <div
                onClick={() => handleViewInvoice(true)}
                style={{
                  padding: "6px 16px",
                  background: "#1F7FFF",
                  border: "1px solid #1F7FFF",
                  borderRadius: 8,
                  textDecoration: "none",
                  fontSize: "14px",
                  display: "flex",
                  gap: "8px",
                  alignItems: "center",
                  height: "33px",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                <span className="fs-6">Preview</span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div
            style={{
              width: "100%",
              padding: "16px",
              background: "var(--White, white)",
              borderRadius: "16px",
              border: "1px var(--Stroke, #EAEAEA) solid",
              flexDirection: "column",
              justifyContent: "flex-start",
              alignItems: "flex-start",
              gap: "24px",
              display: "flex",
              overflowX: "auto",
              height: "calc(100vh - 200px)",
            }}
          >
            {/* Supplier Details */}
            <div style={{ width: "1860px" }}>
              <div
                style={{
                  color: "black",
                  fontSize: "16px",
                  fontFamily: "Inter",
                  fontWeight: "500",
                  lineHeight: "19.20px",
                }}
              >
                Supplier Details
              </div>

              <div
                style={{
                  display: "grid",
                  gap: "16px",
                  width: "100%",
                  marginTop: "16px",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    display: "inline-flex",
                  }}
                >
                  <div style={{ width: "60%" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-start",
                        gap: "40px",
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <label>
                          Supplier Name<span style={{ color: "red" }}>*</span>
                        </label>
                        <div
                          style={{
                            width: "360px",
                            borderRadius: "8px",
                            border: "1px solid #EAEAEA",
                            padding: "6px 8px",
                            display: "flex",
                            gap: "4px",
                            marginTop: "4px",
                            alignItems: "center",
                            position: "relative",
                          }}
                        >
                          {/* Input field */}
                          <div
                            style={{
                              flex: 1,
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            {isFromNavbar && (
                              <FiSearch
                                style={{
                                  color: "#666",
                                  cursor: isFromNavbar ? "pointer" : "default",
                                  fontSize: "16px",
                                }}
                                onClick={() =>
                                  isFromNavbar && setShowSupplierDropdown(true)
                                }
                              />
                            )}
                            <input
                              type="text"
                              placeholder={
                                isFromNavbar
                                  ? "Search or select supplier..."
                                  : "Enter Supplier Name"
                              }
                              style={{
                                width: "100%",
                                border: "none",
                                outline: "none",
                                fontSize: "14px",
                                cursor: isFromNavbar ? "pointer" : "text",
                              }}
                              value={
                                isFromNavbar
                                  ? supplierSearch
                                  : supplier.name || ""
                              }
                              onChange={(e) => {
                                if (isFromNavbar) {
                                  // In navbar mode, show dropdown and search
                                  setSupplierSearch(e.target.value);
                                  setShowSupplierDropdown(true);
                                  // Don't update supplier name directly - wait for selection
                                } else {
                                  // In supplier page mode, update directly
                                  setSupplier({
                                    ...supplier,
                                    name: e.target.value,
                                  });
                                }
                              }}
                              onFocus={() =>
                                isFromNavbar && setShowSupplierDropdown(true)
                              }
                              readOnly={isFromNavbar && supplier.supplierId} // Read-only when supplier is selected
                            />
                          </div>

                          {/* Action buttons */}
                          {isFromNavbar && (
                            <div style={{ display: "flex", gap: "4px" }}>
                              {supplier.supplierId ? (
                                // When supplier is selected - show clear button
                                <button
                                  onClick={handleClearSupplier}
                                  style={{
                                    background: "transparent",
                                    border: "none",
                                    color: "#dc3545",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    padding: "2px 6px",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  Change
                                </button>
                              ) : (
                                // When no supplier - show add button
                                <button
                                  onClick={() => setOpenAddModal(true)}
                                  style={{
                                    background: "#1F7FFF",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    padding: "4px 8px",
                                    whiteSpace: "nowrap",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                >
                                  + Add
                                </button>
                              )}
                            </div>
                          )}

                          {/* Supplier Dropdown */}
                          {/* Supplier Dropdown */}
                          {isFromNavbar && showSupplierDropdown && (
                            <div
                              style={{
                                position: "absolute",
                                top: "100%",
                                left: 0,
                                right: 0,
                                backgroundColor: "white",
                                border: "1px solid #EAEAEA",
                                borderRadius: "8px",
                                maxHeight: "300px",
                                overflowY: "auto",
                                zIndex: 1000,
                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                marginTop: "4px",
                              }}
                            >
                              {/* Check if filteredSupplier is an array */}
                              {!Array.isArray(filteredSupplier) ||
                              filteredSupplier.length === 0 ? (
                                <div
                                  style={{
                                    padding: "12px",
                                    color: "#666",
                                    textAlign: "center",
                                  }}
                                >
                                  {!Array.isArray(filteredSupplier)
                                    ? "Error loading suppliers"
                                    : "No suppliers found"}
                                  <div style={{ marginTop: "8px" }}>
                                    <button
                                      onClick={() => {
                                        setOpenAddModal(true);
                                        setShowSupplierDropdown(false);
                                      }}
                                      style={{
                                        padding: "6px 12px",
                                        backgroundColor: "#1F7FFF",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "4px",
                                        cursor: "pointer",
                                        fontSize: "12px",
                                      }}
                                    >
                                      + Add New Supplier
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div
                                    style={{
                                      padding: "8px 12px",
                                      borderBottom: "1px solid #f0f0f0",
                                      backgroundColor: "#f8f9fa",
                                      fontSize: "12px",
                                      color: "#666",
                                    }}
                                  >
                                    Select supplier or{" "}
                                    <button
                                      onClick={() => {
                                        setOpenAddModal(true);
                                        setShowSupplierDropdown(false);
                                      }}
                                      style={{
                                        background: "transparent",
                                        border: "none",
                                        color: "#1F7FFF",
                                        cursor: "pointer",
                                        fontWeight: "500",
                                      }}
                                    >
                                      add new
                                    </button>
                                  </div>
                                  {/* Safe mapping */}
                                  {filteredSupplier.map((sup) => {
                                    if (!sup || typeof sup !== "object")
                                      return null;

                                    const supplierName = sup.name || "";
                                    const phone = sup.phone || "";
                                    const email = sup.email || "";
                                    const id = sup._id || "";

                                    return (
                                      <div
                                        key={id}
                                        onClick={() =>
                                          handleSupplierSelect(sup)
                                        }
                                        style={{
                                          padding: "12px 16px",
                                          borderBottom: "1px solid #f0f0f0",
                                          cursor: "pointer",
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "12px",
                                          transition: "background-color 0.2s",
                                        }}
                                        onMouseEnter={(e) =>
                                          (e.currentTarget.style.backgroundColor =
                                            "#f8f9fa")
                                        }
                                        onMouseLeave={(e) =>
                                          (e.currentTarget.style.backgroundColor =
                                            "white")
                                        }
                                      >
                                        <div
                                          style={{
                                            width: "32px",
                                            height: "32px",
                                            borderRadius: "50%",
                                            backgroundColor: "#e0f0ff",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontWeight: "bold",
                                            color: "#1F7FFF",
                                            fontSize: "14px",
                                          }}
                                        >
                                          {supplierName
                                            .charAt(0)
                                            .toUpperCase() || "S"}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                          <div style={{ fontWeight: "500" }}>
                                            {supplierName}
                                          </div>
                                          <div
                                            style={{
                                              fontSize: "12px",
                                              color: "#666",
                                            }}
                                          >
                                            {phone} {email && `• ${email}`}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        {errors.supplierName && (
                          <div
                            style={{
                              color: "red",
                              fontSize: "12px",
                              marginTop: "4px",
                            }}
                          >
                            {errors.supplierName}
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <label>
                          Phone No.<span style={{ color: "red" }}>*</span>
                        </label>
                        <div
                          style={{
                            width: "360px",
                            borderRadius: "8px",
                            border: "1px solid #EAEAEA",
                            padding: "6px 8px",
                            display: "flex",
                            gap: "6px",
                            marginTop: "4px",
                          }}
                        >
                          <div
                            className="d-flex "
                            style={{ borderRight: "1px solid #EAEAEA" }}
                          >
                            <img src={indialogo} alt="india-logo" />
                            <span
                              style={{ color: "black", padding: "0px 6px" }}
                            >
                              {" "}
                              +91{" "}
                            </span>
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="Enter Supplier No."
                              style={{
                                width: "250px",
                                border: "none",
                                outline: "none",
                                fontSize: "14px",
                              }}
                              value={supplier.phone}
                              onChange={(e) =>
                                setSupplier({
                                  ...supplier,
                                  phone: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                        {errors.phone && (
                          <div
                            style={{
                              color: "red",
                              fontSize: "12px",
                              marginTop: "4px",
                            }}
                          >
                            {errors.phone}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ marginTop: "10px", width: "50%" }}>
                      <label>
                        Billing Address<span style={{ color: "red" }}>*</span>
                      </label>
                      <div>
                        <textarea
                          placeholder="Enter Billing Address"
                          style={{
                            width: "760px",
                            height: "80px",
                            borderRadius: "8px",
                            border: "1px dashed #EAEAEA",
                            padding: "8px",
                            marginTop: "4px",
                            resize: "none",
                          }}
                          value={supplier.address}
                          onChange={(e) =>
                            setSupplier({
                              ...supplier,
                              address: e.target.value,
                            })
                          }
                        ></textarea>
                      </div>
                      {errors.address && (
                        <div
                          style={{
                            color: "red",
                            fontSize: "12px",
                            marginTop: "4px",
                          }}
                        >
                          {errors.address}
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      width: 2,
                      alignSelf: "stretch",
                      transform: "rotate(-180deg)",
                      background: "var(--Black-Disable, #A2A8B8)",
                      flexShrink: 0,
                    }}
                  />

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "end",
                      gap: "10px",
                      width: "40%",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "end",
                        gap: "10px",
                        flexDirection: "column",
                      }}
                    >
                      <div
                        style={{
                          height: 30,
                          justifyContent: "flex-start",
                          alignItems: "center",
                          display: "inline-flex",
                          gap: "15px",
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ position: "relative", width: 200 }}>
                          {/* Floating Label */}
                          <span
                            style={{
                              position: "absolute",
                              top: "-7px",
                              left: "12px",
                              background: "#fff",
                              padding: "0 6px",
                              fontSize: "11px",
                              color: "#6B7280",
                              zIndex: 10,
                            }}
                          >
                            Invoice Date
                          </span>
                          <div
                            ref={viewManageRef}
                            style={{
                              height: 38,
                              padding: "0 12px",
                              border: "1px solid #A2A8B8",
                              borderRadius: 8,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              cursor: "pointer",
                              background: "#fff",
                            }}
                            onClick={handleViewManage}
                          >
                            <LuCalendarMinus2 />
                            <div
                              style={{
                                color: "var(--Black-Black, #0E101A)",
                                fontSize: 14,
                                fontFamily: "Inter",
                                fontWeight: "400",
                                lineHeight: 16.8,
                                wordWrap: "break-word",
                              }}
                            >
                              {format(invoiceDate, "dd MMM yyyy")}
                            </div>
                            <FiChevronDown />
                            {viewManageOptions && (
                              <div
                                style={{
                                  position: "absolute",
                                  top: "35px",
                                  left: "0px",
                                  zIndex: 999999,
                                }}
                              >
                                <div
                                  style={{
                                    background: "white",
                                    padding: 6,
                                    borderRadius: 12,
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                    minWidth: 200,
                                    height: "auto",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 4,
                                  }}
                                >
                                  {[
                                    "Today",
                                    "Yesterday",
                                    "Last Week",
                                    "Last 15 Days",
                                    "Last Month",
                                    "Custom",
                                  ].map((option) => (
                                    <div
                                      key={option}
                                      style={{
                                        display: "flex",
                                        justifyContent: "flex-start",
                                        alignItems: "center",
                                        gap: 8,
                                        padding: "5px 12px",
                                        borderRadius: 8,
                                        border: "none",
                                        cursor: "pointer",
                                        fontFamily: "Inter, sans-serif",
                                        fontSize: 14,
                                        fontWeight: 400,
                                        color: "#6C748C",
                                        textDecoration: "none",
                                      }}
                                      className="button-action"
                                      onClick={() => handleDateSelect(option)}
                                    >
                                      <span style={{ color: "black" }}>
                                        {option}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* DatePicker for Custom selection */}
                            {isDatePickerOpen && (
                              <div
                                style={{
                                  position: "absolute",
                                  top: "35px",
                                  left: "0px",
                                  zIndex: 1000000,
                                  background: "white",
                                  padding: "10px",
                                  borderRadius: "8px",
                                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <DatePicker
                                  selected={invoiceDate}
                                  onChange={(date) => {
                                    if (date) {
                                      setInvoiceDate(date);
                                    }
                                    setIsDatePickerOpen(false);
                                    setViewManageOptions(false);
                                  }}
                                  inline
                                  calendarClassName="custom-calendar"
                                />
                                <div
                                  style={{
                                    textAlign: "center",
                                    marginTop: "10px",
                                  }}
                                >
                                  <button
                                    onClick={() => {
                                      setIsDatePickerOpen(false);
                                      setViewManageOptions(false);
                                    }}
                                    style={{
                                      padding: "5px 15px",
                                      background: "#f3f4f6",
                                      border: "1px solid #d1d5db",
                                      borderRadius: "4px",
                                      cursor: "pointer",
                                      fontSize: "14px",
                                    }}
                                  >
                                    Close
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Invoice No. */}
                        <div style={{ position: "relative", width: 200 }}>
                          <span
                            style={{
                              position: "absolute",
                              top: "-7px",
                              left: "12px",
                              background: "#fff",
                              padding: "0 6px",
                              fontSize: "11px",
                              color: "#6B7280",
                              zIndex: 10,
                            }}
                          >
                            Invoice No
                          </span>

                          <div
                            style={{
                              height: 38,
                              padding: "0 12px",
                              border: "1px solid #A2A8B8",
                              borderRadius: 8,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              cursor: "pointer",
                              background: "#fff",
                            }}
                          >
                            <div
                              style={{
                                color: "var(--Black-Black, #0E101A)",
                                fontSize: 14,
                                fontFamily: "Inter",
                                fontWeight: "400",
                                lineHeight: 16.8,
                                wordWrap: "break-word",
                              }}
                            >
                              {invoiceNo}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Add Products */}
            <div
              style={{
                width: "1860px",
                height: "100%",
                flexDirection: "column",
                justifyContent: "flex-start",
                alignItems: "center",
                gap: 16,
                display: "inline-flex",
              }}
            >
              <div
                style={{
                  alignSelf: "stretch",
                  justifyContent: "space-between",
                  alignItems: "center",
                  display: "inline-flex",
                }}
              >
                <div
                  style={{
                    color: "var(--Black-Black, #0E101A)",
                    fontSize: 16,
                    fontFamily: "Inter",
                    fontWeight: "500",
                    lineHeight: "19.20px",
                    wordWrap: "break-word",
                  }}
                >
                  Add Products
                </div>
                <div
                  style={{
                    height: 31.95,
                    justifyContent: "flex-start",
                    alignItems: "center",
                    display: "flex",
                  }}
                >
                  <div
                    style={{
                      alignSelf: "stretch",
                      paddingLeft: 10,
                      paddingRight: 10,
                      paddingTop: 4.26,
                      paddingBottom: 4.26,
                      background: "white",
                      borderRadius: 8.52,
                      outline: "1.07px var(--Blue-Blue, #1F7FFF) solid",
                      outlineOffset: "-1.07px",
                      justifyContent: "flex-start",
                      alignItems: "center",
                      gap: 8.52,
                      display: "flex",
                      cursor: "pointer",
                    }}
                    onClick={() => handleViewInvoice(true)}
                  >
                    <CiBarcode className="fs-4" />
                  </div>
                </div>
              </div>

              {/* Products Table */}
              <div
                style={{
                  alignSelf: "stretch",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                  alignItems: "flex-start",
                  display: "flex",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    paddingLeft: 8,
                    paddingRight: 8,
                    paddingTop: 4,
                    paddingBottom: 4,
                    background: "var(--Blue-Light-Blue, #E5F0FF)",
                    borderTopLeftRadius: 8,
                    borderTopRightRadius: 8,
                    justifyContent: "space-between",
                    alignItems: "center",
                    display: "inline-flex",
                  }}
                >
                  <div
                    style={{
                      flex: "1 1 0%",
                      justifyContent: "flex-start",
                      alignItems: "center",
                      display: "flex",
                    }}
                  >
                    <div
                      style={{
                        width: 80,
                        height: 30,
                        paddingLeft: 12,
                        paddingRight: 12,
                        paddingTop: 4,
                        paddingBottom: 4,
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 8,
                        display: "flex",
                      }}
                    >
                      <div
                        style={{
                          color: "#727681",
                          fontSize: 14,
                          fontFamily: "Inter",
                          fontWeight: "500",
                          lineHeight: "16.80px",
                          wordWrap: "break-word",
                        }}
                      >
                        Sl No.
                      </div>
                    </div>
                    <div
                      style={{
                        flex: "1 1 auto",
                        minWidth: 0,
                        height: 30,
                        paddingLeft: 12,
                        paddingRight: 12,
                        paddingTop: 4,
                        paddingBottom: 4,
                        justifyContent: "flex-start",
                        alignItems: "center",
                        gap: 8,
                        display: "flex",
                      }}
                    >
                      <div
                        style={{
                          color: "#727681",
                          fontSize: 14,
                          fontFamily: "Inter",
                          fontWeight: "500",
                          lineHeight: "16.80px",
                          wordWrap: "break-word",
                        }}
                      >
                        Items
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      justifyContent: "flex-end",
                      alignItems: "center",
                      gap: 12,
                      display: "flex",
                    }}
                  >
                    <div
                      style={{
                        width: 120,
                        height: 30,
                        paddingLeft: 12,
                        paddingRight: 12,
                        paddingTop: 4,
                        paddingBottom: 4,
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 8,
                        display: "flex",
                      }}
                    >
                      <div
                        style={{
                          color: "#727681",
                          fontSize: 14,
                          fontFamily: "Inter",
                          fontWeight: "500",
                          lineHeight: "16.80px",
                          wordWrap: "break-word",
                        }}
                      >
                        Qty
                      </div>
                    </div>
                    <div
                      style={{
                        width: 1,
                        height: 30,
                        background: "var(--Black-Disable, #A2A8B8)",
                      }}
                    />
                    <div
                      style={{
                        width: 120,
                        height: 30,
                        paddingLeft: 12,
                        paddingRight: 12,
                        paddingTop: 4,
                        paddingBottom: 4,
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 8,
                        display: "flex",
                      }}
                    >
                      <div
                        style={{
                          color: "#727681",
                          fontSize: 14,
                          fontFamily: "Inter",
                          fontWeight: "500",
                          lineHeight: "16.80px",
                          wordWrap: "break-word",
                        }}
                      >
                        Unit Price
                      </div>
                    </div>
                    <div
                      style={{
                        width: 1,
                        height: 30,
                        background: "var(--Black-Disable, #A2A8B8)",
                      }}
                    />
                    <div
                      style={{
                        width: 120,
                        height: 30,
                        paddingLeft: 12,
                        paddingRight: 12,
                        paddingTop: 4,
                        paddingBottom: 4,
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 8,
                        display: "flex",
                      }}
                    >
                      <div
                        style={{
                          color: "#727681",
                          fontSize: 14,
                          fontFamily: "Inter",
                          fontWeight: "500",
                          lineHeight: "16.80px",
                          wordWrap: "break-word",
                        }}
                      >
                        Tax
                      </div>
                    </div>
                    <div
                      style={{
                        width: 1,
                        height: 30,
                        background: "var(--Black-Disable, #A2A8B8)",
                      }}
                    />
                    <div
                      style={{
                        width: 120,
                        height: 30,
                        paddingLeft: 12,
                        paddingRight: 12,
                        paddingTop: 4,
                        paddingBottom: 4,
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 8,
                        display: "flex",
                      }}
                    >
                      <div
                        style={{
                          color: "#727681",
                          fontSize: 14,
                          fontFamily: "Inter",
                          fontWeight: "500",
                          lineHeight: "16.80px",
                          wordWrap: "break-word",
                        }}
                      >
                        Tax Amount
                      </div>
                    </div>
                    <div
                      style={{
                        width: 1,
                        height: 30,
                        background: "var(--Black-Disable, #A2A8B8)",
                      }}
                    />
                    <div
                      style={{
                        width: 200,
                        height: 30,
                        paddingLeft: 12,
                        paddingRight: 12,
                        paddingTop: 4,
                        paddingBottom: 4,
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 8,
                        display: "flex",
                      }}
                    >
                      <div
                        style={{
                          color: "#727681",
                          fontSize: 14,
                          fontFamily: "Inter",
                          fontWeight: "500",
                          lineHeight: "16.80px",
                          wordWrap: "break-word",
                        }}
                      >
                        Discount
                      </div>
                    </div>
                    <div
                      style={{
                        width: 1,
                        height: 30,
                        background: "var(--Black-Disable, #A2A8B8)",
                      }}
                    />
                    <div
                      style={{
                        width: 120,
                        height: 30,
                        paddingLeft: 12,
                        paddingRight: 12,
                        paddingTop: 4,
                        paddingBottom: 4,
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 8,
                        display: "flex",
                      }}
                    >
                      <div
                        style={{
                          color: "#727681",
                          fontSize: 14,
                          fontFamily: "Inter",
                          fontWeight: "500",
                          lineHeight: "16.80px",
                          wordWrap: "break-word",
                        }}
                      >
                        Amount
                      </div>
                    </div>
                  </div>
                </div>

                {/* Products List */}
                {!products || products.length === 0 ? (
                  <div
                    style={{
                      width: "100%",
                      padding: "16px",
                      textAlign: "center",
                      color: "#6b7280",
                      fontSize: "14px",
                    }}
                  >
                    No Product found
                  </div>
                ) : (
                  <div
                    style={{
                      alignSelf: "stretch",
                      minHeight: "auto",
                      paddingLeft: 8,
                      paddingRight: 8,
                      paddingTop: 4,
                      paddingBottom: 4,
                      background: "white",
                      borderBottomRightRadius: 8,
                      borderBottomLeftRadius: 8,
                      borderLeft: "1px var(--White-Stroke, #EAEAEA) solid",
                      borderRight: "1px var(--White-Stroke, #EAEAEA) solid",
                      borderBottom: "1px var(--White-Stroke, #EAEAEA) solid",
                      flexDirection: "column",
                      justifyContent: "flex-start",
                      alignItems: "flex-start",
                      display: "flex",
                    }}
                  >
                    {products.map((p, idx) => (
                      <div
                        key={p.id}
                        style={{
                          width: "100%",
                          height: 46,
                          background: "white",
                          overflow: "hidden",
                          borderBottom:
                            "1px var(--White-Stroke, #EAEAEA) solid",
                          justifyContent: "flex-start",
                          alignItems: "flex-start",
                          display: "inline-flex",
                        }}
                      >
                        <div
                          style={{
                            flex: "1 1 0%",
                            alignSelf: "stretch",
                            paddingTop: 4,
                            paddingBottom: 4,
                            justifyContent: "flex-start",
                            alignItems: "center",
                            gap: 8,
                            display: "flex",
                          }}
                        >
                          <div
                            style={{
                              flex: "1 1 0%",
                              height: 40,
                              justifyContent: "flex-start",
                              alignItems: "center",
                              display: "flex",
                              gap: "15px",
                            }}
                          >
                            <div
                              style={{
                                width: 80,
                                height: 30,
                                paddingLeft: 2,
                                paddingTop: 4,
                                paddingBottom: 4,
                                justifyContent: "center",
                                alignItems: "center",
                                gap: 8,
                                display: "flex",
                              }}
                            >
                              <RiDeleteBinLine
                                className="text-danger fs-5"
                                style={{ cursor: "pointer" }}
                                onClick={() => removeProductRow(p.id)}
                              />
                              <div
                                style={{
                                  textAlign: "center",
                                  color: "var(--Black-Black, #0E101A)",
                                  fontSize: 14,
                                  fontFamily: "Inter",
                                  fontWeight: "400",
                                  lineHeight: "16.80px",
                                  wordWrap: "break-word",
                                }}
                              >
                                {idx + 1}
                              </div>
                            </div>
                            <div
                              className="search-input-container"
                              style={{
                                flex: "1 1 auto",
                                minWidth: 0,
                              }}
                            >
                              <input
                                data-row-id={p.id}
                                ref={inputRef}
                                type="text"
                                value={
                                  p.itemName || searchData[p.id]?.term || ""
                                }
                                onChange={(e) => {
                                  handleSearch(e, p.id);
                                  openDropdown(p.id);
                                }}
                                onFocus={() => {
                                  openDropdown(p.id);
                                  setSearchData((prev) => ({
                                    ...prev,
                                    [p.id]: {
                                      ...prev[p.id],
                                      isOpen: true,
                                      filtered: allProducts,
                                    },
                                  }));
                                }}
                                placeholder="Search Product by its name"
                                style={{
                                  border: "none",
                                  outline: "none",
                                  width: "100%",
                                  backgroundColor: "transparent",
                                  padding: "8px",
                                }}
                              />
                            </div>
                            {/* rr */}
                            {searchData[p.id]?.isOpen && (
                              <div
                                style={{
                                  ...dropdownStyle,
                                  maxHeight: "400px", // Increase height for better view
                                  width: "400px", // Increase width to show more details
                                }}
                                onMouseDown={(e) => e.stopPropagation()}
                              >
                                {(searchData[p.id]?.filtered || []).map(
                                  (product) => (
                                    <div
                                      key={product._id}
                                      onClick={() =>
                                        handleProductSelect(product, p.id)
                                      }
                                      style={{
                                        padding: "12px",
                                        cursor: "pointer",
                                        borderBottom: "1px solid #f0f0f0",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "12px",
                                        backgroundColor: "#fff",
                                        transition: "background-color 0.2s",
                                      }}
                                      onMouseEnter={(e) =>
                                        (e.currentTarget.style.backgroundColor =
                                          "#f8f9fa")
                                      }
                                      onMouseLeave={(e) =>
                                        (e.currentTarget.style.backgroundColor =
                                          "#fff")
                                      }
                                    >
                                      {/* Product Image */}
                                      <div
                                        style={{
                                          width: "50px",
                                          height: "50px",
                                          flexShrink: 0,
                                        }}
                                      >
                                        {product.images?.[0]?.url ? (
                                          <img
                                            src={product.images?.[0]?.url}
                                            alt={product.productName}
                                            style={{
                                              width: "100%",
                                              height: "100%",
                                              objectFit: "cover",
                                              borderRadius: "4px",
                                              border: "1px solid #e5e7eb",
                                            }}
                                          />
                                        ) : (
                                          <div
                                            style={{
                                              width: "100%",
                                              height: "100%",
                                              backgroundColor: "#f3f4f6",
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              borderRadius: "4px",
                                              border: "1px solid #e5e7eb",
                                              color: "#6b7280",
                                              fontSize: "12px",
                                            }}
                                          >
                                            No Image
                                          </div>
                                        )}
                                      </div>

                                      {/* Product Details */}
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        {/* Product Name */}
                                        <div
                                          style={{
                                            fontWeight: "500",
                                            color: "#1f2937",
                                            fontSize: "14px",
                                            lineHeight: "1.4",
                                            marginBottom: "4px",
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                          }}
                                        >
                                          {product.productName}
                                        </div>
                                        {/* HSN Code (optional) */}
                                        {product.hsn?.hsnCode && (
                                          <div
                                            style={{
                                              color: "#6b7280",
                                              fontSize: "10px",
                                              marginBottom: "2px",
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "end",
                                            }}
                                          >
                                            HSN: {product.hsn.hsnCode}
                                          </div>
                                        )}
                                        {/* Price */}
                                        <div
                                          style={{
                                            fontWeight: "600",
                                            color: "#1f2937",
                                            fontSize: "14px",
                                          }}
                                        >
                                          ₹
                                          {product.purchasePrice ||
                                            product.price ||
                                            0}
                                        </div>
                                      </div>
                                    </div>
                                  ),
                                )}
                              </div>
                            )}
                            {/* rr end */}
                          </div>
                          {/* dd */}

                          <div
                            style={{
                              height: 40,
                              justifyContent: "flex-end",
                              alignItems: "center",
                              gap: 12,
                              display: "flex",
                            }}
                          >
                            <div
                              style={{
                                width: 120,
                                alignSelf: "stretch",
                                paddingLeft: 12,
                                paddingRight: 12,
                                paddingTop: 4,
                                paddingBottom: 4,
                                justifyContent: "space-between",
                                alignItems: "center",
                                display: "flex",
                              }}
                            >
                              <div
                                style={{
                                  color: "var(--Black-Black, #0E101A)",
                                  fontSize: 14,
                                  fontFamily: "Inter",
                                  fontWeight: "400",
                                  lineHeight: "16.80px",
                                  wordWrap: "break-word",
                                }}
                              >
                                <input
                                  type="number"
                                  placeholder="0"
                                  min="1"
                                  step="1"
                                  style={{
                                    width: "100%",
                                    border: "none",
                                    outline: "none",
                                  }}
                                  value={p.qty}
                                  onChange={(e) => {
                                    const rawValue = e.target.value;
                                    if (rawValue === "") {
                                      updateProduct(p.id, "qty", "");
                                    } else {
                                      const numValue = parseFloat(rawValue);
                                      if (!isNaN(numValue)) {
                                        updateProduct(
                                          p.id,
                                          "qty",
                                          Math.max(1, numValue),
                                        );
                                      }
                                    }
                                  }}
                                  onBlur={(e) => {
                                    if (
                                      !e.target.value ||
                                      parseFloat(e.target.value) < 1
                                    ) {
                                      updateProduct(p.id, "qty", 1);
                                    }
                                  }}
                                />
                              </div>
                            </div>
                            <div
                              style={{
                                width: 1,
                                height: 30,
                                background: "var(--Black-Disable, #A2A8B8)",
                              }}
                            />

                            <div
                              style={{
                                width: 120,
                                alignSelf: "stretch",
                                paddingLeft: 12,
                                paddingRight: 12,
                                paddingTop: 4,
                                paddingBottom: 4,
                                justifyContent: "space-between",
                                alignItems: "center",
                                display: "flex",
                              }}
                            >
                              <div
                                style={{
                                  color: "var(--Black-Black, #0E101A)",
                                  fontSize: 14,
                                  fontFamily: "Inter",
                                  fontWeight: "400",
                                  lineHeight: "16.80px",
                                  wordWrap: "break-word",
                                }}
                              >
                                <input
                                  type="number"
                                  placeholder="0.00"
                                  style={{
                                    width: "100%",
                                    border: "none",
                                    outline: "none",
                                  }}
                                  value={p.unitPrice}
                                  onChange={(e) =>
                                    updateProduct(
                                      p.id,
                                      "unitPrice",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>
                            </div>

                            <div
                              style={{
                                width: 1,
                                height: 30,
                                background: "var(--Black-Disable, #A2A8B8)",
                              }}
                            />

                            <div
                              style={{
                                width: 120,
                                alignSelf: "stretch",
                                paddingLeft: 12,
                                paddingRight: 12,
                                paddingTop: 4,
                                paddingBottom: 4,
                                justifyContent: "space-between",
                                alignItems: "center",
                                display: "flex",
                              }}
                            >
                              <div
                                style={{
                                  color: "var(--Black-Black, #0E101A)",
                                  fontSize: 14,
                                  fontFamily: "Inter",
                                  fontWeight: "400",
                                  lineHeight: "16.80px",
                                  wordWrap: "break-word",
                                  width: "100%",
                                }}
                              >
                                <input
                                  type="text"
                                  style={{
                                    width: "100%",
                                    border: "none",
                                    outline: "none",
                                  }}
                                  value={`${p.taxRate}%`}
                                  readOnly
                                />
                              </div>
                            </div>

                            <div
                              style={{
                                width: 1,
                                height: 30,
                                background: "var(--Black-Disable, #A2A8B8)",
                              }}
                            />

                            <div
                              style={{
                                width: 120,
                                alignSelf: "stretch",
                                paddingLeft: 12,
                                paddingRight: 12,
                                paddingTop: 4,
                                paddingBottom: 4,
                                justifyContent: "space-between",
                                alignItems: "center",
                                display: "flex",
                              }}
                            >
                              <div
                                style={{
                                  color: "var(--Black-Black, #0E101A)",
                                  fontSize: 14,
                                  fontFamily: "Inter",
                                  fontWeight: "400",
                                  lineHeight: "16.80px",
                                  wordWrap: "break-word",
                                }}
                              >
                                <input
                                  type="number"
                                  style={{
                                    width: "100%",
                                    border: "none",
                                    outline: "none",
                                  }}
                                  value={p.taxAmount.toFixed(2)}
                                  readOnly
                                />
                              </div>
                            </div>

                            <div
                              style={{
                                width: 1,
                                height: 30,
                                background: "var(--Black-Disable, #A2A8B8)",
                              }}
                            />

                            <div
                              style={{
                                width: 200,
                                alignSelf: "stretch",
                                justifyContent: "flex-start",
                                alignItems: "center",
                                gap: 4,
                                display: "flex",
                              }}
                            >
                              {/* Percentage Discount Input */}
                              <div
                                style={{
                                  flex: "1 1 0%",
                                  alignSelf: "stretch",
                                  position: "relative",
                                  background: "white",
                                  overflow: "hidden",
                                  borderRadius: 4,
                                  outline: "1px var(--Stroke, #EAEAEA) solid",
                                  outlineOffset: "-1px",
                                }}
                              >
                                <div
                                  style={{
                                    left: 1,
                                    top: 10,
                                    position: "absolute",
                                    color: "var(--Black-Primary, #0E101A)",
                                    fontSize: 14,
                                    fontFamily: "Inter",
                                    fontWeight: "400",
                                    lineHeight: "16.80px",
                                    wordWrap: "break-word",
                                  }}
                                >
                                  <input
                                    type="number"
                                    placeholder="0.00"
                                    style={{
                                      width: "100%",
                                      border: "none",
                                      outline: "none",
                                      padding: "0px 10px",
                                    }}
                                    value={p.discountPct || ""}
                                    onChange={(e) => {
                                      const value =
                                        e.target.value === ""
                                          ? ""
                                          : parseFloat(e.target.value) || 0;
                                      updateProduct(p.id, "discountPct", value);
                                    }}
                                  />
                                </div>
                                <div
                                  style={{
                                    width: 25,
                                    paddingRight: 4,
                                    left: 73,
                                    top: 1,
                                    position: "absolute",
                                    background:
                                      "var(--Spinning-Frame, #E9F0F4)",
                                    outline: "1px var(--Stroke, #C2C9D1) solid",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    gap: 4,
                                    display: "inline-flex",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: 1,
                                      height: 38,
                                      opacity: 0,
                                      background: "var(--Stroke, #C2C9D1)",
                                    }}
                                  />
                                  <div
                                    style={{
                                      color: "var(--Black-Secondary, #6C748C)",
                                      fontSize: 14,
                                      fontFamily: "Poppins",
                                      fontWeight: "400",
                                      lineHeight: "16.80px",
                                      wordWrap: "break-word",
                                    }}
                                  >
                                    %
                                  </div>
                                </div>
                              </div>

                              {/* Fixed Amount Discount Input */}
                              <div
                                style={{
                                  flex: "1 1 0%",
                                  alignSelf: "stretch",
                                  position: "relative",
                                  background: "white",
                                  overflow: "hidden",
                                  borderRadius: 4,
                                  outline: "1px var(--Stroke, #EAEAEA) solid",
                                  outlineOffset: "-1px",
                                }}
                              >
                                <div
                                  style={{
                                    left: 1,
                                    top: 10,
                                    position: "absolute",
                                    color: "var(--Black-Primary, #0E101A)",
                                    fontSize: 14,
                                    fontFamily: "Inter",
                                    fontWeight: "400",
                                    lineHeight: "16.80px",
                                    wordWrap: "break-word",
                                  }}
                                >
                                  <input
                                    type="number"
                                    placeholder="0.00"
                                    style={{
                                      width: "100%",
                                      border: "none",
                                      outline: "none",
                                      padding: "0px 10px",
                                    }}
                                    value={p.discountAmt || ""}
                                    onChange={(e) => {
                                      const value =
                                        e.target.value === ""
                                          ? ""
                                          : parseFloat(e.target.value) || 0;
                                      updateProduct(p.id, "discountAmt", value);
                                    }}
                                  />
                                </div>
                                <div
                                  style={{
                                    width: 25,
                                    paddingRight: 4,
                                    left: 73,
                                    top: 1,
                                    position: "absolute",
                                    background:
                                      "var(--Spinning-Frame, #E9F0F4)",
                                    outline: "1px var(--Stroke, #C2C9D1) solid",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    gap: 4,
                                    display: "inline-flex",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: 1,
                                      height: 38,
                                      opacity: 0,
                                      background: "var(--Stroke, #C2C9D1)",
                                    }}
                                  />
                                  <div
                                    style={{
                                      color: "var(--Black-Secondary, #6C748C)",
                                      fontSize: 14,
                                      fontFamily: "Poppins",
                                      fontWeight: "400",
                                      lineHeight: "16.80px",
                                      wordWrap: "break-word",
                                    }}
                                  >
                                    ₹
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div
                              style={{
                                width: 1,
                                height: 30,
                                background: "var(--Black-Disable, #A2A8B8)",
                              }}
                            />

                            <div
                              style={{
                                width: 120,
                                alignSelf: "stretch",
                                paddingLeft: 12,
                                paddingRight: 12,
                                paddingTop: 4,
                                paddingBottom: 4,
                                justifyContent: "space-between",
                                alignItems: "center",
                                display: "flex",
                              }}
                            >
                              <div
                                style={{
                                  color: "var(--Black-Black, #0E101A)",
                                  fontSize: 14,
                                  fontFamily: "Inter",
                                  fontWeight: "400",
                                  lineHeight: "16.80px",
                                  wordWrap: "break-word",
                                }}
                              >
                                <input
                                  type="number"
                                  style={{
                                    width: "100%",
                                    border: "none",
                                    outline: "none",
                                  }}
                                  value={p.amount.toFixed(2)}
                                  readOnly
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Add New Product Button */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "7px",
                        marginTop: "16px",
                        cursor: "pointer",
                      }}
                      onClick={addProductRow}
                    >
                      <div
                        style={{
                          width: "20px",
                          height: "20px",
                          overflow: "hidden",
                          border: "2px solid var(--Blue, #1F7FFF)",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          borderRadius: "4px",
                        }}
                      >
                        <div
                          style={{
                            color: "#1F7FFF",
                            fontSize: "13px",
                            fontWeight: "600",
                          }}
                        >
                          +
                        </div>
                      </div>
                      <span
                        style={{
                          color: "var(--Black, #212436)",
                          fontSize: "16px",
                          fontFamily: "Inter",
                          fontWeight: "400",
                        }}
                      >
                        Add New Product
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Details */}
            <div
              style={{
                background: "#fff",
                padding: "2px",
                width: "1860px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "32px",
                  width: "100%",
                }}
              >
                {/* LEFT SIDE */}
                <div
                  style={{
                    width: "50%",
                    paddingRight: "32px",
                    borderRight: "1px solid #eee",
                  }}
                >
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      marginBottom: "24px",
                    }}
                  >
                    Payment Details
                  </div>

                  {/* Additional Discount */}
                  <div style={{ marginBottom: "24px", width: "50%" }}>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        marginBottom: "8px",
                      }}
                    >
                      Additional Discount
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        width: "195px",
                      }}
                    >
                      <div style={{ display: "flex", gap: "8px" }}>
                        <div
                          style={{
                            height: "40px",
                            paddingLeft: "8px",
                            background: "var(--White, white)",
                            borderRadius: "8px",
                            border: "1px var(--Stroke, #EAEAEA) solid",
                            justifyContent: "space-between",
                            display: "flex",
                            position: "relative",
                            width: "100%",
                          }}
                        >
                          <input
                            type="number"
                            placeholder="00"
                            value={
                              additionalDiscountType === "Percentage"
                                ? additionalDiscountPct || ""
                                : additionalDiscountType === "Fixed"
                                  ? additionalDiscountAmt || ""
                                  : ""
                            }
                            onChange={(e) => {
                              const value = e.target.value;
                              const numValue = parseFloat(value);

                              if (additionalDiscountType === "Percentage") {
                                setAdditionalDiscountPct(
                                  value === "" ? "" : numValue,
                                );
                                if (
                                  value !== "" &&
                                  !isNaN(numValue) &&
                                  subtotal > 0
                                ) {
                                  // Calculate and update fixed amount
                                  const fixedValue =
                                    (subtotal * numValue) / 100;
                                  setAdditionalDiscountAmt(fixedValue);
                                } else {
                                  setAdditionalDiscountAmt("");
                                }
                              } else if (additionalDiscountType === "Fixed") {
                                setAdditionalDiscountAmt(
                                  value === "" ? "" : numValue,
                                );
                                if (
                                  value !== "" &&
                                  !isNaN(numValue) &&
                                  subtotal > 0
                                ) {
                                  // Calculate and update percentage
                                  const pctValue = (numValue / subtotal) * 100;
                                  setAdditionalDiscountPct(pctValue);
                                } else {
                                  setAdditionalDiscountPct("");
                                }
                              }
                            }}
                            style={{
                              width: "100%",
                              border: "none",
                              background: "transparent",
                              color: "var(--Black-Black, #0E101A)",
                              fontSize: "14px",
                              fontFamily: "Inter",
                              fontWeight: "400",
                              overflow: "hidden",
                              outline: "none",
                            }}
                          />
                          <div
                            style={{
                              paddingRight: "4px",
                              background: "var(--Spinning-Frame, #E9F0F4)",
                              borderTopRightRadius: "8px",
                              borderBottomRightRadius: "8px",
                              border: "1px var(--Stroke, #C2C9D1) solid",
                              justifyContent: "center",
                              alignItems: "center",
                              display: "flex",
                              padding: "6px",
                              minWidth: "60px",
                            }}
                          >
                            <select
                              value={additionalDiscountType}
                              onChange={(e) => {
                                const type = e.target.value;
                                setAdditionalDiscountType(type);
                                // Clear both values when switching type
                                if (type === "") {
                                  setAdditionalDiscountPct("");
                                  setAdditionalDiscountAmt("");
                                }
                              }}
                              style={{
                                color: "var(--Black-Secondary, #6C748C)",
                                fontSize: "14px",
                                fontFamily: "Poppins",
                                fontWeight: "400",
                                border: "none",
                                background: "transparent",
                                cursor: "pointer",
                                outline: "none",
                              }}
                            >
                              <option value="">₹/%</option>
                              <option value="Fixed">₹</option>
                              <option value="Percentage">%</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Charges */}
                  <div
                    style={{
                      marginBottom: "24px",
                      display: "flex",
                      width: "100%",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#6b7280",
                          marginBottom: "8px",
                        }}
                      >
                        Additional Charges
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          border: "1px solid #e5e7eb",
                          borderRadius: "10px",
                          paddingRight: "6px",
                          position: "relative",
                        }}
                        ref={chargeRef}
                      >
                        <div
                          style={{
                            padding: "10px 12px",
                            fontSize: "14px",
                          }}
                        >
                          ₹
                        </div>

                        <input
                          placeholder="00"
                          className=""
                          style={{
                            flex: 1,
                            border: "none",
                            padding: "10px 12px",
                            outline: "none",
                            fontSize: "14px",
                            width: "400px",
                          }}
                          value={chargeAmount}
                          onChange={(e) => setChargeAmount(e.target.value)}
                        />

                        <div
                          style={{
                            background: "#2563eb",
                            color: "#fff",
                            padding: "6px 10px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            border: "none",
                            marginRight: "6px",
                            cursor: "pointer",
                          }}
                          onClick={handleViewChargeOptions}
                        >
                          {selectedChargeType
                            ? selectedChargeType.replace("charge", "")
                            : "Charges"}{" "}
                          <FiChevronDown />
                        </div>
                        {viewChargeOptions && (
                          <div
                            style={{
                              position: "absolute",
                              top: "45px",
                              left: "0px",
                              zIndex: 999999,
                            }}
                          >
                            <div
                              style={{
                                background: "white",
                                padding: 6,
                                borderRadius: 12,
                                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                minWidth: 300,
                                height: "auto",
                                display: "flex",
                                flexDirection: "column",
                                gap: 4,
                              }}
                            >
                              {[
                                "Shipping Charge",
                                "Handling Charge",
                                "Packing Charge",
                                "Service Charge",
                                "Other Charge",
                              ].map((charge) => (
                                <div
                                  key={charge}
                                  style={{
                                    display: "flex",
                                    justifyContent: "flex-start",
                                    alignItems: "center",
                                    gap: 8,
                                    padding: "5px 12px",
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
                                  onClick={() => handleChargeSelect(charge)}
                                >
                                  <span style={{ color: "black" }}>
                                    {charge}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <button
                        onClick={handleChargeDone}
                        style={{
                          padding: "6px 12px",
                          fontSize: "12px",
                          borderRadius: "20px",
                          background: "#fff",
                          border: "1px solid #d1d5db",
                          color: "#2563eb",
                          marginTop: "25px",
                          cursor: "pointer",
                        }}
                      >
                        Done
                      </button>
                    </div>
                  </div>

                  {/* Upload Images */}
                  <div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        marginBottom: "8px",
                      }}
                    >
                      Upload Invoice/Bills
                    </div>

                    <div
                      style={{
                        width: "80px",
                        height: "90px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        cursor: "pointer",
                        flexDirection: "column",
                        fontSize: "12px",
                        color: "#9ca3af",
                        position: "relative",
                      }}
                      onClick={() =>
                        document.getElementById("file-upload-supplier").click()
                      }
                    >
                      <input
                        id="file-upload-supplier"
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/jpg,application/pdf"
                        onChange={handleFileUpload}
                        style={{
                          position: "absolute",
                          opacity: 0,
                          width: "100%",
                          height: "100%",
                          cursor: "pointer",
                        }}
                      />
                      <div
                        style={{
                          width: "26px",
                          height: "26px",
                          borderRadius: "999px",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          fontSize: "18px",
                        }}
                      >
                        <RiImageAddFill />
                      </div>
                    </div>
                    {uploadedImages.length > 0 && (
                      <div
                        style={{
                          marginTop: "10px",
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "10px",
                        }}
                      >
                        {uploadedImages.map((image, index) => (
                          <div key={index} style={{ position: "relative" }}>
                            {image.type.startsWith("image/") ? (
                              <img
                                src={image.preview}
                                alt={`upload-${index}`}
                                style={{
                                  width: "60px",
                                  height: "60px",
                                  objectFit: "cover",
                                  borderRadius: "4px",
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: "60px",
                                  height: "60px",
                                  backgroundColor: "#f3f4f6",
                                  display: "flex",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  borderRadius: "4px",
                                  border: "1px solid #d1d5db",
                                }}
                              >
                                <span style={{ fontSize: "10px" }}>
                                  {image.filename.substring(0, 10)}...
                                </span>
                              </div>
                            )}
                            <button
                              onClick={() =>
                                setUploadedImages((prev) =>
                                  prev.filter((_, i) => i !== index),
                                )
                              }
                              style={{
                                position: "absolute",
                                top: "-5px",
                                right: "-5px",
                                background: "red",
                                color: "white",
                                border: "none",
                                borderRadius: "50%",
                                width: "20px",
                                height: "20px",
                                cursor: "pointer",
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT SIDE */}
                <div style={{ width: "50%" }}>
                  {/* Summary */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                      fontSize: "14px",
                    }}
                  >
                    <span style={{ color: "#6b7280" }}>Subtotal :</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                      fontSize: "14px",
                    }}
                  >
                    <span style={{ color: "#6b7280" }}>Taxes :</span>
                    <span>₹{totalTax.toFixed(2)}</span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                      fontSize: "13px",
                    }}
                  >
                    <span style={{ color: "#6b7280" }}>
                      Additional Discount :
                    </span>
                    <span style={{ color: "#9ca3af" }}>
                      ₹{additionalDiscountValue.toFixed(2)}
                    </span>
                  </div>

                  {/* update additonal charge */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "16px",
                      fontSize: "13px",
                    }}
                  >
                    <span style={{ color: "#6b7280" }}>
                      Additional Charges
                      {Object.entries(additionalChargesDetails).some(
                        ([_, value]) => value > 0,
                      ) && (
                        <span
                          style={{
                            color: "#3b82f6",
                            marginLeft: "4px",
                            fontSize: "11px",
                          }}
                        >
                          (
                          {Object.entries(additionalChargesDetails)
                            .filter(([_, value]) => value > 0)
                            .map(
                              ([key, _]) =>
                                key.charAt(0).toUpperCase() + key.slice(1),
                            )
                            .join(", ")}
                          )
                        </span>
                      )}
                      :
                    </span>
                    <span style={{ color: "#9ca3af" }}>
                      ₹{additionalChargesTotal.toFixed(2)}
                    </span>
                  </div>
                  {/* update additional charge end */}

                  <div
                    style={{
                      height: "1px",
                      background: "#eee",
                      margin: "12px 0",
                    }}
                  />

                  {/* Auto round-off */}
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    <input
                      type="checkbox"
                      style={{ accentColor: "#ffffffff" }}
                      checked={autoRoundOff}
                      onChange={(e) => setAutoRoundOff(e.target.checked)}
                    />
                    <span>Auto Round-off</span>
                    <span style={{ marginLeft: "auto" }}>
                      {roundOffAdded >= 0 ? "+" : "-"} ₹
                      {Math.abs(roundOffAdded).toFixed(2)}
                    </span>
                  </div>

                  <div
                    style={{
                      height: "1px",
                      background: "#eee",
                      margin: "12px 0",
                    }}
                  />

                  {/* Total Amount */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontWeight: "700",
                      fontSize: "20px",
                      marginTop: "8px",
                      marginBottom: "16px",
                    }}
                  >
                    <span>Total Amount :-</span>
                    <span>₹{grandTotal.toFixed(2)}</span>
                  </div>

                  {/* Fully Paid */}
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      fontSize: "14px",
                      alignItems: "center",
                    }}
                  >
                    <input
                      type="checkbox"
                      style={{ accentColor: "#ffffffff" }}
                      checked={fullyReceived}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setFullyReceived(checked);
                        if (checked) {
                          setAmountPaid(grandTotal.toFixed(2));
                        }
                      }}
                    />
                    <span>Fully Paid</span>
                  </div>

                  {/* Amount Inputs */}
                  <div
                    style={{
                      display: "flex",
                      gap: "16px",
                      marginTop: "12px",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#6b7280",
                          marginBottom: "6px",
                        }}
                      >
                        Amount Paid
                      </div>
                      <div
                        style={{
                          width: "100%",
                          borderRadius: "10px",
                          padding: "10px",
                          border: "1px solid #e5e7eb",
                          background: "#f9fafb",
                          outline: "none",
                          display: "flex",
                        }}
                      >
                        ₹
                        <input
                          placeholder="0.00"
                          className=""
                          value={amountPaid}
                          onChange={(e) => setAmountPaid(e.target.value)}
                          style={{
                            borderRadius: "10px",
                            border: "none",
                            background: "#f9fafb",
                            outline: "none",
                            width: "100%",
                          }}
                          disabled={fullyReceived}
                        />
                      </div>
                    </div>

                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#6b7280",
                          marginBottom: "6px",
                        }}
                      >
                        Amount Due
                      </div>
                      <div
                        style={{
                          width: "100%",
                          borderRadius: "10px",
                          padding: "10px",
                          border: "1px solid #e5e7eb",
                          background: "#f9fafb",
                          outline: "none",
                          display: "flex",
                        }}
                      >
                        ₹
                        <input
                          placeholder="0.00"
                          className=""
                          value={amountDue.toFixed(2)}
                          readOnly
                          style={{
                            borderRadius: "10px",
                            border: "none",
                            background: "#f9fafb",
                            outline: "none",
                            width: "100%",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  width: "100%",
                  justifyContent: "end",
                  alignItems: "center",
                  display: "flex",
                  marginTop: 16,
                }}
              >
                <div
                  style={{
                    paddingLeft: 47,
                    paddingRight: 47,
                    justifyContent: "flex-start",
                    alignItems: "flex-start",
                    gap: 15,
                    display: "inline-flex",
                  }}
                >
                  {/* SAVE BUTTON */}
                  <div
                    onClick={() => handleSubmit(false)}
                    style={{
                      height: 36,
                      padding: 8,
                      background: "var(--White-Universal-White, white)",
                      boxShadow: "-1px -1px 4px rgba(0, 0, 0, 0.25) inset",
                      borderRadius: 8,
                      outline: "1.50px var(--Blue-Blue, #1F7FFF) solid",
                      outlineOffset: "-1.50px",
                      justifyContent: "flex-start",
                      alignItems: "center",
                      gap: 4,
                      display: "flex",
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                      textDecoration: "none",
                      opacity: isSubmitting ? 0.7 : 1,
                    }}
                  >
                    <div
                      style={{
                        color: "var(--Blue-Blue, #1F7FFF)",
                        fontSize: 14,
                        fontFamily: "Inter",
                        fontWeight: "500",
                        wordWrap: "break-word",
                      }}
                    >
                      {isSubmitting ? "Saving..." : "Save"}
                    </div>
                  </div>

                  {/* SAVE & PRINT BUTTON */}
                  <div
                    onClick={() => handleSubmit(true)}
                    style={{
                      height: 36,
                      padding: 8,
                      background: "var(--Blue-Blue, #1F7FFF)",
                      boxShadow: "-1px -1px 4px rgba(0, 0, 0, 0.25) inset",
                      borderRadius: 8,
                      outline: "1.50px var(--Blue-Blue, #1F7FFF) solid",
                      outlineOffset: "-1.50px",
                      justifyContent: "flex-start",
                      alignItems: "center",
                      gap: 4,
                      display: "flex",
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                      textDecoration: "none",
                      opacity: isSubmitting ? 0.7 : 1,
                    }}
                  >
                    <div
                      style={{
                        color: "white",
                        fontSize: 14,
                        fontFamily: "Inter",
                        fontWeight: "500",
                        wordWrap: "break-word",
                      }}
                    >
                      {isSubmitting ? "Saving..." : "Save & Print"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Supplier Modal */}
      {openAddModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.27)",
            backdropFilter: "blur(1px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 99999999,
          }}
          onClick={() => setOpenAddModal(false)}
        >
          <div onClick={(e) => e.stopPropagation()} className="">
            <AddSuppliers
              onClose={() => {
                setOpenAddModal(false);
                fetchSupplierForSearch();
              }}
              onSuccess={handleNewSupplierCreated} //Auto selected new supplier
            />
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {viewInvoiceOptions && (
        <>
          <div
            style={{
              position: "absolute",
              top: "0px",
              left: "0px",
              zIndex: 999999,
              width: "100%",
              height: "100%",
              display: "flex",
              justifyContent: "center",
              backgroundColor: "rgba(0, 0, 0, 0.27)",
              backdropFilter: "blur(0.1px)",
              overflow: "auto",
            }}
            onClick={(e) =>
              e.target === e.currentTarget && handleViewInvoice(false)
            }
          >
            <div
              style={{
                background: "#F3F5F6",
                padding: 6,
                borderRadius: 12,
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                width: "60%",
                height: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 4,
                position: "absolute",
              }}
              ref={modelRef}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  paddingLeft: 36.37,
                  paddingRight: 36.37,
                  padding: "16px 36px 36px 36px",
                }}
              >
                <div
                  style={{
                    borderBottom: "1px solid #EAEAEA",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: "600",
                      marginBottom: "10px",
                    }}
                  >
                    Preview
                  </div>
                  <div
                    style={{
                      color: "red",
                      padding: "9px",
                      background: "white",
                      border: "1px solid #EAEAEA",
                      borderRadius: "50%",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                    onClick={() => handleViewInvoice(false)}
                  >
                    <IoIosCloseCircleOutline />
                  </div>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    paddingTop: 20,
                    position: "relative",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    alignItems: "flex-start",
                    gap: 18.18,
                    display: "inline-flex",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      position: "relative",
                      fontFamily: "IBM Plex Mono",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        left: 0,
                        top: 0,
                        background: "var(--White-White-1, white)",
                        boxShadow: "0px 1px 4px rgba(0, 0, 0, 0.10)",
                        padding: "10px 30px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div style={{ width: "100px" }}>
                          <img
                            src={CompanyLogo}
                            alt="company logo"
                            style={{ width: "100%", objectFit: "contain" }}
                          />
                        </div>
                        <div style={{ width: "130px" }}>
                          <img
                            src={TaxInvoiceLogo}
                            alt="tax invoice"
                            style={{ width: "100%", objectFit: "contain" }}
                          />
                        </div>
                      </div>
                      <div
                        style={{
                          width: "100%",
                          height: 0.76,
                          left: 31.77,
                          background: "var(--White-Stroke, #EAEAEA)",
                          marginTop: "8px",
                        }}
                      />
                      <div
                        style={{
                          width: "100%",
                          display: "flex",
                          justifyContent: "space-between",
                          marginTop: "2px",
                        }}
                      >
                        <span>
                          INVOICE Date - {format(invoiceDate, "dd MMM yyyy")}
                        </span>
                        <span style={{ marginRight: "12px" }}>
                          INVOICE No. - {invoiceNo}
                        </span>
                      </div>
                      <div
                        style={{
                          width: "100%",
                          height: 0.76,
                          left: 31.77,
                          marginTop: "1px",
                          background: "var(--White-Stroke, #EAEAEA)",
                        }}
                      />
                      <div
                        style={{
                          width: "100%",
                          display: "flex",
                          justifyContent: "space-around",
                          marginTop: "2px",
                          alignItems: "center",
                          borderBottom: "1px solid #EAEAEA",
                        }}
                      >
                        <div
                          style={{
                            borderRight: "1px solid #EAEAEA",
                            width: "50%",
                            textAlign: "center",
                          }}
                        >
                          <span>From</span>
                        </div>
                        <div style={{ width: "50%", textAlign: "center" }}>
                          <span>Supplier Details</span>
                        </div>
                      </div>
                      <div
                        style={{
                          width: "100%",
                          display: "flex",
                          justifyContent: "space-around",
                          marginTop: "2px",
                          alignItems: "center",
                          borderBottom: "1px solid #EAEAEA",
                        }}
                      >
                        <div
                          style={{
                            borderRight: "1px solid #EAEAEA",
                            width: "50%",
                            padding: "3px",
                          }}
                        >
                          <div>
                            Name :{" "}
                            <span style={{ color: "black", fontWeight: "600" }}>
                              Kasper Infotech Pvt. Ltd.
                            </span>
                          </div>
                          <div>Address : </div>
                          <div style={{ marginTop: "8px" }}>Phone : </div>
                          <div>Email : </div>
                          <div>GSTIN : </div>
                        </div>
                        <div style={{ width: "50%", padding: "3px" }}>
                          <div>
                            Name :{" "}
                            <span style={{ color: "black", fontWeight: "600" }}>
                              {supplier.name}
                            </span>
                          </div>
                          <div>
                            Address :{" "}
                            <span style={{ color: "black", fontWeight: "600" }}>
                              {supplier.address}
                            </span>
                          </div>
                          <div style={{ marginTop: "8px" }}>
                            Phone :{" "}
                            <span style={{ color: "black", fontWeight: "600" }}>
                              {supplier.phone}
                            </span>
                          </div>
                          <div style={{ marginTop: "0px" }}>
                            Email :{" "}
                            <span style={{ color: "black", fontWeight: "600" }}>
                              {supplier?.email}
                            </span>
                          </div>
                          <div style={{ marginTop: "0px" }}>
                            GSTIN :{" "}
                            <span style={{ color: "black", fontWeight: "600" }}>
                              {supplier?.gstin}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="table-responsive mt-3">
                        <table
                          className=""
                          style={{
                            width: "100%",
                            border: "1px solid #EAEAEA",
                            borderCollapse: "collapse",
                          }}
                        >
                          <thead style={{ textAlign: "center" }}>
                            <tr>
                              <th
                                style={{
                                  borderRight: "1px solid #EAEAEA",
                                  borderBottom: "1px solid #EAEAEA",
                                  fontWeight: "400",
                                }}
                                rowSpan="2"
                              >
                                Sr No.
                              </th>
                              <th
                                style={{
                                  borderRight: "1px solid #EAEAEA",
                                  borderBottom: "1px solid #EAEAEA",
                                  fontWeight: "400",
                                }}
                                rowSpan="2"
                              >
                                Name of the Products
                              </th>
                              <th
                                style={{
                                  borderRight: "1px solid #EAEAEA",
                                  borderBottom: "1px solid #EAEAEA",
                                  fontWeight: "400",
                                }}
                                rowSpan="2"
                              >
                                HSN
                              </th>
                              <th
                                style={{
                                  borderRight: "1px solid #EAEAEA",
                                  borderBottom: "1px solid #EAEAEA",
                                  fontWeight: "400",
                                }}
                                rowSpan="2"
                              >
                                QTY
                              </th>
                              <th
                                style={{
                                  borderRight: "1px solid #EAEAEA",
                                  borderBottom: "1px solid #EAEAEA",
                                  fontWeight: "400",
                                }}
                                rowSpan="2"
                              >
                                Rate
                              </th>
                              <th
                                style={{
                                  borderRight: "1px solid #EAEAEA",
                                  borderBottom: "1px solid #EAEAEA",
                                  fontWeight: "400",
                                }}
                                colSpan="2"
                              >
                                Tax
                              </th>
                              <th
                                style={{
                                  borderRight: "1px solid #EAEAEA",
                                  borderBottom: "1px solid #EAEAEA",
                                  fontWeight: "400",
                                }}
                                rowSpan="2"
                              >
                                Total
                              </th>
                            </tr>
                            <tr>
                              <th
                                style={{
                                  borderRight: "1px solid #EAEAEA",
                                  borderBottom: "1px solid #EAEAEA",
                                  width: "40px",
                                  fontWeight: "400",
                                }}
                              >
                                %
                              </th>
                              <th
                                style={{
                                  borderRight: "1px solid #EAEAEA",
                                  borderBottom: "1px solid #EAEAEA",
                                  width: "40px",
                                  fontWeight: "400",
                                }}
                              >
                                ₹
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {products.map((item, idx) => (
                              <tr key={idx}>
                                <td
                                  style={{
                                    borderRight: "1px solid #EAEAEA",
                                    height: "40px",
                                    textAlign: "center",
                                  }}
                                >
                                  {" "}
                                  {idx + 1}
                                </td>
                                <td
                                  style={{
                                    borderRight: "1px solid #EAEAEA",
                                    padding: "0px 20px",
                                  }}
                                >
                                  {item.name || ""}
                                </td>
                                <td
                                  style={{
                                    borderRight: "1px solid #EAEAEA",
                                    textAlign: "center",
                                  }}
                                >
                                  {item.hsn?.hsnCode || "-"}
                                </td>
                                <td
                                  style={{
                                    borderRight: "1px solid #EAEAEA",
                                    textAlign: "center",
                                  }}
                                >
                                  {item.qty || ""}
                                </td>
                                <td
                                  style={{
                                    borderRight: "1px solid #EAEAEA",
                                    textAlign: "center",
                                  }}
                                >
                                  {item.unitPrice
                                    ? `₹${parseNumber(item.unitPrice).toFixed(
                                        2,
                                      )}`
                                    : ""}
                                </td>
                                <td
                                  style={{
                                    borderRight: "1px solid #EAEAEA",
                                    textAlign: "center",
                                  }}
                                >
                                  {item.taxRate || "0"}%
                                </td>
                                <td
                                  style={{
                                    borderRight: "1px solid #EAEAEA",
                                    textAlign: "center",
                                  }}
                                >
                                  ₹{(item.taxAmount || 0).toFixed(2)}
                                </td>
                                <td
                                  style={{
                                    borderRight: "1px solid #EAEAEA",
                                    textAlign: "center",
                                  }}
                                >
                                  ₹{(item.amount || 0).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                            <tr>
                              <td
                                style={{
                                  borderRight: "1px solid #EAEAEA",
                                  height: "250px",
                                  textAlign: "center",
                                }}
                              ></td>
                              <td
                                style={{
                                  borderRight: "1px solid #EAEAEA",
                                  padding: "0px 20px",
                                }}
                              ></td>
                              <td
                                style={{
                                  borderRight: "1px solid #EAEAEA",
                                  textAlign: "center",
                                }}
                              ></td>
                              <td
                                style={{
                                  borderRight: "1px solid #EAEAEA",
                                  textAlign: "center",
                                }}
                              ></td>
                              <td
                                style={{
                                  borderRight: "1px solid #EAEAEA",
                                  textAlign: "center",
                                }}
                              ></td>
                              <td
                                style={{
                                  borderRight: "1px solid #EAEAEA",
                                  textAlign: "center",
                                }}
                              ></td>
                              <td
                                style={{
                                  borderRight: "1px solid #EAEAEA",
                                  textAlign: "center",
                                }}
                              ></td>
                              <td
                                style={{
                                  borderRight: "1px solid #EAEAEA",
                                  textAlign: "center",
                                }}
                              ></td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div
                        style={{
                          width: "100%",
                          display: "flex",
                          justifyContent: "space-around",
                          marginTop: "15px",
                          borderTop: "1px solid #EAEAEA",
                          borderBottom: "1px solid #EAEAEA",
                        }}
                      >
                        <div
                          style={{
                            borderRight: "",
                            width: "50%",
                            padding: "3px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                          }}
                        >
                          <u>Total in words</u>
                          <div
                            style={{
                              fontSize: "12px",
                              marginTop: "5px",
                              fontWeight: "600",
                            }}
                          >
                            {toWords(grandTotal).toUpperCase()} RUPEES ONLY
                          </div>
                          <div
                            style={{
                              width: "100%",
                              height: 0.76,
                              left: 31.77,
                              background: "var(--White-Stroke, #EAEAEA)",
                              marginTop: "10px",
                            }}
                          />
                          <div
                            style={{
                              marginTop: "2px",
                              textDecoration: "underline",
                            }}
                          >
                            Bank Details
                          </div>
                          <div
                            style={{
                              width: "100%",
                              display: "flex",
                              justifyContent: "space-between",
                              padding: "0px 5px",
                            }}
                          >
                            <div style={{ textAlign: "left" }}>
                              <div>
                                Bank :{" "}
                                <span
                                  style={{ color: "black", fontWeight: "600" }}
                                >
                                  ICICI Bank
                                </span>
                              </div>
                              <div>
                                Branch :{" "}
                                <span
                                  style={{ color: "black", fontWeight: "600" }}
                                >
                                  Noida, Sector 62
                                </span>
                              </div>
                              <div>
                                Account No.:{" "}
                                <span
                                  style={{ color: "black", fontWeight: "600" }}
                                >
                                  278415630109014
                                </span>
                              </div>
                              <div>
                                IFSC :{" "}
                                <span
                                  style={{ color: "black", fontWeight: "600" }}
                                >
                                  ICINO512345
                                </span>
                              </div>
                              <div>
                                Upi :{" "}
                                <span
                                  style={{ color: "black", fontWeight: "600" }}
                                >
                                  abc@ybl
                                </span>
                              </div>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                            >
                              <div
                                style={{ width: "90px", objectFit: "contain" }}
                              >
                                <img
                                  src={Qrcode}
                                  alt="QR Code"
                                  style={{ width: "100%" }}
                                />
                              </div>
                              <div>Pay Using Upi</div>
                            </div>
                          </div>
                        </div>

                        <div
                          style={{
                            width: "50%",
                            padding: "3px",
                            borderLeft: "1px solid #EAEAEA",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              borderBottom: "1px solid #EAEAEA",
                              padding: "2px 8px",
                            }}
                          >
                            <span>SubTotal</span>
                            <span style={{ color: "black" }}>
                              ₹{subtotal.toFixed(2)}
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              borderBottom: "1px solid #EAEAEA",
                              padding: "2px 8px",
                            }}
                          >
                            <span>Tax Amount</span>
                            <span style={{ color: "black" }}>
                              ₹{totalTax.toFixed(2)}
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              borderBottom: "1px solid #EAEAEA",
                              padding: "2px 8px",
                            }}
                          >
                            <span>Discount</span>
                            <span style={{ color: "black" }}>
                              ₹{totalDiscount.toFixed(2)}
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              borderBottom: "1px solid #EAEAEA",
                              padding: "2px 8px",
                            }}
                          >
                            <span>Additional Charges</span>
                            <span style={{ color: "black" }}>
                              ₹{additionalChargesTotal.toFixed(2)}
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              borderBottom: "1px solid #EAEAEA",
                              padding: "2px 8px",
                            }}
                          >
                            <span
                              style={{ fontWeight: "700", fontSize: "20px" }}
                            >
                              Total
                            </span>
                            <span
                              style={{
                                color: "black",
                                fontWeight: "600",
                                fontSize: "20px",
                              }}
                            >
                              ₹{grandTotal.toFixed(2)}
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              padding: "1px 8px",
                            }}
                          >
                            <span>Due Amount</span>
                            <span style={{ color: "black" }}>
                              ₹{amountDue.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          width: "100%",
                          display: "flex",
                          justifyContent: "space-around",
                          borderBottom: "1px solid #EAEAEA",
                        }}
                      >
                        <div
                          style={{
                            borderRight: "",
                            width: "50%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                          }}
                        >
                          <u>Term & Conditions</u>
                        </div>

                        <div
                          style={{
                            width: "50%",
                            borderLeft: "1px solid #EAEAEA",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "center",
                              borderTop: "1px solid #EAEAEA",
                              padding: "1px 8px",
                              marginTop: "60px",
                            }}
                          >
                            <span
                              style={{ fontWeight: "500", fontSize: "10px" }}
                            >
                              Signature
                            </span>
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          width: "100%",
                          justifyContent: "center",
                          display: "flex",
                          marginTop: "5px",
                          fontSize: "12px",
                          color: "#666",
                        }}
                      >
                        <span>Supplier Purchase Invoice</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default CreatePurchaseOrder;
