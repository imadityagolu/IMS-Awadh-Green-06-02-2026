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
import AddCustomers from "../Modal/customerModals/AddCustomerModal";
import { FiSearch } from "react-icons/fi";

// for serial no
const SerialNumberDropdown = ({
  product,
  onSelect,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSerialNo = (serialNo) => {
    const currentSelected = product.selectedSerialNos || [];
    let newSelected;

    if (currentSelected.includes(serialNo)) {
      // Remove from selected
      newSelected = currentSelected.filter(sn => sn !== serialNo);
    } else {
      // Add to selected if not exceeding available
      newSelected = [...currentSelected, serialNo];
    }

    onSelect(newSelected);
  };

  const availableSerialNos = product.availableSerialNos || [];
  const selectedSerialNos = product.selectedSerialNos || [];

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          padding: '6px 8px',
          border: '1px solid #EAEAEA',
          borderRadius: '4px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          backgroundColor: disabled ? '#f5f5f5' : 'white',
          fontSize: '14px',
          color: disabled ? '#999' : '#333',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span>
          {selectedSerialNos.length > 0
            ? `${selectedSerialNos.length} selected`
            : 'Select Serial Nos'}
        </span>
        <FiChevronDown />
      </div>

      {isOpen && !disabled && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            border: '1px solid #EAEAEA',
            borderRadius: '4px',
            maxHeight: '200px',
            overflowY: 'auto',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            marginTop: '2px'
          }}
          onMouseLeave={() => setIsOpen(false)}
        >
          {availableSerialNos.length === 0 ? (
            <div style={{ padding: '12px', textAlign: 'center', color: '#666' }}>
              No serial numbers available
            </div>
          ) : (
            availableSerialNos.map((serialNo) => (
              <div
                key={serialNo}
                style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid #f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  backgroundColor: selectedSerialNos.includes(serialNo)
                    ? '#f0f7ff'
                    : 'white'
                }}
                onClick={() => toggleSerialNo(serialNo)}
              >
                <input
                  type="checkbox"
                  checked={selectedSerialNos.includes(serialNo)}
                  onChange={() => { }}
                  style={{ cursor: 'pointer' }}
                />
                <span>{serialNo}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

function CustomerCreateInvoice() {
  const viewManageRef = useRef(null); //for handle click outside for calendar
  const hasAddedInitialProduct = useRef(false);
  const { customerId } = useParams();
  const navigate = useNavigate();
  // State for customer selection/selection
  const [customerSearch, setCustomerSearch] = useState("");
  const [phoneSearch, setPhoneSearch] = useState("");
  const [allCustomers, setAllCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
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

  const [companyData, setCompanyData] = useState(null);
  const [banks, setBanks] = useState([]);
  const [terms, setTerms] = useState(null);
  const [template, setTemplate] = useState(null);

  // Modals
  const [viewManageOptions, setViewManageOptions] = useState(false);
  const [viewInvoiceOptions, setViewInvoiceOptions] = useState(false);
  const [viewChargeOptions, setViewChargeOptions] = useState(false);
  const [selectedChargeType, setSelectedChargeType] = useState("");
  const [chargeAmount, setChargeAmount] = useState("");
  // State for due date
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7); // Default: 7 days from now
    return date;
  });

  // Refs for due date
  const viewDueDateRef = useRef(null);
  const [viewDueDateOptions, setViewDueDateOptions] = useState(false);
  const [isDueDatePickerOpen, setIsDueDatePickerOpen] = useState(false);

  // for system setting for serial no
  const [settings, setSettings] = useState({
    brand: false,
    category: false,
    subcategory: false,
    itembarcode: false,
    hsn: false,
    lotno: false,
    serialno: false,
    variants: { size: false, color: false },
    units: false,
    expiry: false,
  });

  useEffect(() => {
    fetchProductSettings();
  }, []);

  const fetchProductSettings = async () => {
    try {
      const response = await api.get('/api/system-settings');
      if (response.data.success) {
        const data = response.data.data;
        setSettings({
          brand: data.brand || false,
          category: data.category || false,
          subcategory: data.subcategory || false,
          itembarcode: data.itembarcode || false,
          hsn: data.hsn || false,
          lotno: data.lotno || false,
          serialno: data.serialno || false,
          variants: {
            size: data.variants?.size || false,
            color: data.variants?.color || false
          },
          units: data.units || false,
          expiry: data.expiry || false,
        });
      }
    } catch (error) {
      // console.error("Error fetching system settings:", error);
      toast.error("Failed to fetch system settings");
    }
  };



  // eway bill and chalan state
  const [eway, setEway] = useState(false);
  const [chalan, setChalan] = useState(false);

  const [taxSettings, setTaxSettings] = useState({
    enableGSTBilling: true,
    priceIncludeGST: true,
    defaultGSTRate: "18",
    autoRoundOff: "0",
  });

  // fetch tax setting
  useEffect(() => {
    const loadTaxSettings = async () => {
      try {
        const response = await api.get("/api/tax-gst-settings");
        if (response.data.success) {
          const data = response.data.data;
          setTaxSettings({
            enableGSTBilling: data.enableGSTBilling !== false,
            priceIncludeGST: data.priceIncludeGST !== false,
            defaultGSTRate: data.defaultGSTRate || "18",
            autoRoundOff: data.autoRoundOff || "0",
          });
        }
      } catch (error) {
        console.error("Error fetching tax settings:", error);
      }
    };
    loadTaxSettings();
  }, []);

  // style for eway and chalan

  const checkboxStyle = (checked) => ({
    width: "20px",
    height: "20px",
    border: "1px solid #007aff",
    borderRadius: "4px",
    cursor: "pointer",
    appearance: "none",
    backgroundColor: checked ? "" : "#eee",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  });
  const tickStyle = {
    color: "#007aff",
    fontSize: "14px",
    fontWeight: "bold",
    lineHeight: 1,
  };

  // for preview data start
  const fetchCompanyData = async () => {
    try {
      const res = await api.get(`/api/companyprofile/get`);
      console.log("Companyss data:", res.data);
      setCompanyData(res.data.data);
    } catch (error) {
      console.error("Error fetching company profile:", error);
    }
  };

  const fetchBanks = async () => {
    try {
      const res = await api.get("/api/company-bank/list");
      setBanks(res.data.data);
      console.log("banks", res.data.data);
    } catch (error) {
      console.error("Error fetching bank details:", error);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get("/api/notes-terms-settings");
      setTerms(res.data.data);
      console.log("reddd", res.data);
    } catch (error) {
      console.error("Error fetching notes & terms settings:", error);
    }
  };

  const fetchSignature = async () => {
    try {
      const res = await api.get("/api/print-templates/all");
      setTemplate(res.data.data);
      console.log("ddrrr", res.data);
    } catch (error) {
      console.error("Error fetching tempate settings:", error);
    }
  };

  useEffect(() => {
    fetchCompanyData();
    fetchSettings();
    fetchSignature();
    fetchBanks();
  }, []);

  // for preview data end

  // Stock check function
  const checkStockAvailability = async (productId, requiredQty) => {
    if (!productId) return true;

    try {
      const response = await api.get(`/api/products/${productId}`);
      const product = response.data;

      // Use openingQuantity as stock
      const availableStock = product.openingQuantity || 0;

      if (availableStock < requiredQty) {
        toast.error(
          `Insufficient stock for ${product.productName}! Available: ${availableStock}`,
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error checking stock:", error);
      return true; // Continue if check fails
    }
  };

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

  // Handle due date selection
  const handleDueDateSelect = (option) => {
    const today = new Date();
    let selectedDate = new Date();

    switch (option) {
      case "7 Days":
        selectedDate = new Date(today.setDate(today.getDate() + 7));
        setDueDate(selectedDate);
        setViewDueDateOptions(false);
        break;
      case "15 Days":
        selectedDate = new Date(today.setDate(today.getDate() + 15));
        setDueDate(selectedDate);
        setViewDueDateOptions(false);
        break;
      case "30 Days":
        selectedDate = new Date(today.setDate(today.getDate() + 30));
        setDueDate(selectedDate);
        setViewDueDateOptions(false);
        break;
      case "45 Days":
        selectedDate = new Date(today.setDate(today.getDate() + 45));
        setDueDate(selectedDate);
        setViewDueDateOptions(false);
        break;
      case "60 Days":
        selectedDate = new Date(today.setDate(today.getDate() + 60));
        setDueDate(selectedDate);
        setViewDueDateOptions(false);
        break;
      case "90 Days":
        selectedDate = new Date(today.setDate(today.getDate() + 90));
        setDueDate(selectedDate);
        setViewDueDateOptions(false);
        break;
      case "Custom":
        setIsDueDatePickerOpen(true);
        break;
    }
  };

  // check if we're in "create from navbar" mode (no customerId)
  const isFromNavbar = !customerId;

  // Form state
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    address: "",
    email: "",
    gstin: "",
    customerId: "", //store actual custoemr id
  });

  const [customerPoints, setCustomerPoints] = useState(0);
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

  // Fetch customers for search (when in navbar mode)
  useEffect(() => {
    if (isFromNavbar) {
      fetchCustomersForSearch();
    }
  }, [isFromNavbar]);

  const fetchCustomersForSearch = async () => {
    try {
      const response = await api.get("/api/customers");
      setAllCustomers(response.data);
      setFilteredCustomers(response.data);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to load customers");
    }
  };

  // Handle customer search
  useEffect(() => {
    if (!customerSearch.trim() && !phoneSearch.trim()) {
      setFilteredCustomers(allCustomers);
      return;
    }
    const filtered = allCustomers.filter((cust) => {
      // Search by name (only if customerSearch has value)
      const nameMatch = customerSearch.trim()
        ? cust.name?.toLowerCase().includes(customerSearch.toLowerCase())
        : false;

      // Search by phone (only if phoneSearch has value)
      const phoneMatch = phoneSearch.trim()
        ? cust.phone?.includes(phoneSearch)
        : false;

      // Search by email (only if customerSearch has value)
      const emailMatch = customerSearch.trim()
        ? cust.email?.toLowerCase().includes(customerSearch.toLowerCase())
        : false;

      return nameMatch || phoneMatch || emailMatch;
    });

    setFilteredCustomers(filtered);
  }, [customerSearch, phoneSearch, allCustomers]);

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
  const [usePoints, setUsePoints] = useState(false);
  const [shoppingPointsUsed, setShoppingPointsUsed] = useState("");
  const [autoRoundOff, setAutoRoundOff] = useState(false);
  const [fullyReceived, setFullyReceived] = useState(false);
  const [amountReceived, setAmountReceived] = useState("");
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Fetch customer & products
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch customer details
        if (customerId) {
          const customerRes = await api.get(`/api/customers/${customerId}`);
          const c = customerRes.data;
          setCustomer({
            name: c.name || "",
            phone: c.phone || "",
            address: [c.country, c.city, c.state, c.pincode]
              .filter(Boolean)
              .join(", "),
            email: c.email || "",
            gstin: c.gstin || "",
            customerId: c._id, // store the ID
          });

          // Fetch customer points
          try {
            const pointsRes = await api.get(
              `/api/customers/${customerId}/points`,
            );
            setCustomerPoints(pointsRes.data.customer?.availablePoints || 0);
          } catch (pointsErr) {
            setCustomerPoints(0);
          }
        }

        // Fetch products
        const productsRes = await api.get("/api/products");
        setProductLoading(true);
        // store all product for searching
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
  }, [customerId]);

  // handle customer selection from dropdown
  const handleCustomerSelect = (selectedCustomer) => {
    setCustomer({
      name: selectedCustomer.name || "",
      phone: selectedCustomer.phone || "",
      address: [
        selectedCustomer.country,
        selectedCustomer.city,
        selectedCustomer.state,
        selectedCustomer.pincode,
      ]
        .filter(Boolean)
        .join(", "),
      email: selectedCustomer.email || "",
      gstin: selectedCustomer.gstin || "",
      customerId: selectedCustomer._id, // Store the ID
    });

    // Update search fields with actual values
    setCustomerSearch(selectedCustomer.name || "");
    setPhoneSearch(selectedCustomer.phone || "");
    //  Fetch customer points
    api
      .get(`/api/customers/${selectedCustomer._id}/points`)
      .then((res) => {
        setCustomerPoints(res.data.customer?.availablePoints || 0);
      })
      .catch(() => setCustomerPoints(0));
    setShowCustomerDropdown(false);
  };

  // handle new customer creation success
  const handleNewCustomerCreated = (newCustomer) => {
    fetchCustomersForSearch();
    // Auto select the newly created customer
    handleCustomerSelect(newCustomer);
    toast.success("Customer created successfully!");
  };

  // Add this useEffect near your other useEffect hooks
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside any customer search container
      const customerContainers = document.querySelectorAll(
        ".customer-search-container",
      );
      let isInside = false;

      customerContainers.forEach((container) => {
        if (container.contains(event.target)) {
          isInside = true;
        }
      });

      if (!isInside && showCustomerDropdown) {
        setShowCustomerDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCustomerDropdown]);

  // clear selected customer
  const handleClearCustomer = () => {
    setCustomer({
      name: "",
      phone: "",
      address: "",
      email: "",
      gstin: "",
      customerId: "",
    });
    setCustomerSearch("");
    setPhoneSearch("");
    setCustomerPoints(0);
    setShowCustomerDropdown(false);
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

  const handleProductSelect = async (product, rowId) => {
    // Check if this product is already in the products array
    const existingProductIndex = products.findIndex(
      (p) => p.productId === product._id && p.id !== rowId,
    );

    if (existingProductIndex !== -1) {
      // If product already exists in another row, increase quantity of that row
      const existingRow = products[existingProductIndex];
      const newQty = (parseFloat(existingRow.qty) || 0) + 1;

      setProducts((prev) =>
        prev.map((p, idx) => {
          if (idx === existingProductIndex) {
            return {
              ...p,
              qty: newQty,
            };
          }
          return p;
        }),
      );

      // Update calculations for the existing row
      updateProduct(products[existingProductIndex].id, "qty", newQty);

      // Remove the current empty row since we merged with existing
      removeProductRow(rowId);

      // Update search data for the current row (which will be removed)
      setSearchData((prev) => {
        const newData = { ...prev };
        delete newData[rowId];
        return newData;
      });

      // Close dropdown
      setDropdownStyle({});
      setActiveSearchId(null);
      return;
    }

    // If product doesn't exist already, proceed with normal selection
    const defaultTaxRate = taxSettings.defaultGSTRate || "0";
    const productTaxRate = parseFloat(product.tax?.match(/\d+/)?.[0]);
    const finalTaxRate = productTaxRate || parseFloat(defaultTaxRate);

    // Fetch serial numbers for this product
    const serialNumbers = product.serialno ? product.serialno.split(',').map((sn) => sn.trim()).filter((sn) => sn) : [];

    // Update product data with productId
    updateProduct(rowId, "productId", product._id);

    // Update with product details
    updateProduct(rowId, "itemName", product.productName);
    updateProduct(rowId, "name", product.productName);
    updateProduct(rowId, "unitPrice", product.sellingPrice || 0);
    updateProduct(
      rowId,
      "taxRate",
      parseFloat(product.tax?.match(/\d+/)?.[0]) || 0,
    );
    updateProduct(rowId, "taxType", product.tax || "GST 0%");
    updateProduct(rowId, "unit", product.unit || "Piece");
    updateProduct(rowId, "hsnCode", product.hsn?.hsnCode || "");
    updateProduct(rowId, "availableSerialNos", serialNumbers); // Set available serial numbers
    updateProduct(rowId, "selectedSerialNos", []); // Initialize empty selected serial numbers

    // Use product tax rate if exists, otherwise use default
    updateProduct(rowId, "taxRate", finalTaxRate);
    updateProduct(rowId, "taxType", product.tax || `GST${finalTaxRate}%`);

    // Set quantity to 1 for newly added product
    updateProduct(rowId, "qty", 1);

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
        serialno: "",
        availableSerialNos: [], // New: store available serial numbers
        selectedSerialNos: [], // New: store selected serial numbers
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
          // when quantity changes, adjust selected serial number
          const qtyDiff = Math.round(updated.qty) - (updated.selectedSerialNos?.length || 0);

          if (qtyDiff > 0 && updated.availableSerialNos?.length > 0) {
            // need to add more serial numbers
            const availableToAdd = updated.availableSerialNos.filter((sn) => !updated.selectedSerialNos?.includes(sn)).slice(0, qtyDiff);
            updated.selectedSerialNos = [
              ...(updated.selectedSerialNos || []), ...availableToAdd
            ];
          } else if (qtyDiff < 0) {
            // Need to remove some serial numbers
            updated.selectedSerialNos = (updated.selectedSerialNos || []).slice(0, Math.max(0, updated.selectedSerialNos.length + qtyDiff));
          }
        } else if (field === "selectedSerialNos") {
          updated.selectedSerialNos = value;
          // updated quantity based on selected serial numbers count
          updated.qty = value.length || 1;
        }
        else {
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
              serialno: selected.serialno || "",
              qty: 1,
              discountPct: discountPct, // Apply product discount
              discountAmt: discountAmt, // Apply product discount amount
            };
          }
        }

        // Handle manual discount updates - CRITICAL FIX
        if (field === "discountPct") {
          const pctValue = parseFloat(value) || 0;
          updated.discountPct = pctValue;
          // Don't update discountAmt here - it will be calculated in the recalculation section
        } else if (field === "discountAmt") {
          const amtValue = parseFloat(value) || 0;
          updated.discountAmt = amtValue;
          // Don't update discountPct here - it will be calculated in the recalculation section
        }

        // Recalculate line
        const qty = parseFloat(updated.qty) || 1;
        let unitPrice = parseFloat(updated.unitPrice) || 0;

        // calculate base amount (before any taxes or discounts)
        const baseAmount = qty * unitPrice;

        // calculate discount based on what was entered
        let discAmt = 0;
        let discPct = 0;

        // If discount amount was directly entered
        if (
          field === "discountAmt" &&
          value !== "" &&
          !isNaN(parseFloat(value))
        ) {
          discAmt = parseFloat(value) || 0;
          discAmt = Math.min(discAmt, baseAmount); // Cap discount at base amount
          discPct = baseAmount > 0 ? (discAmt / baseAmount) * 100 : 0;
          updated.discountPct = discPct;
          updated.discountAmt = discAmt;
        }
        // If discount percentage was entered
        else if (
          field === "discountPct" &&
          value !== "" &&
          !isNaN(parseFloat(value))
        ) {
          discPct = parseFloat(value) || 0;
          discAmt = (baseAmount * discPct) / 100;
          discAmt = Math.min(discAmt, baseAmount); // Cap discount at base amount
          updated.discountPct = discPct;
          updated.discountAmt = discAmt;
        }
        // Otherwise use existing values
        else {
          discPct = parseFloat(updated.discountPct) || 0;
          discAmt = (baseAmount * discPct) / 100;
          discAmt = Math.min(discAmt, baseAmount);
          updated.discountAmt = discAmt;
        }
        // Calculate taxable amount (after discount)
        const taxableAmount = Math.max(baseAmount - discAmt, 0);
        // Calculate tax ONLY if GST billing is enabled
        const taxRate = parseFloat(updated.taxRate) || 0;
        const taxAmount = taxSettings.enableGSTBilling
          ? (taxableAmount * taxRate) / 100
          : 0;
        updated.taxAmount = taxAmount;

        // Calculate final amount
        let finalAmount = taxableAmount;

        // Add tax to final amount ONLY if GST is enabled
        if (taxSettings.enableGSTBilling) {
          finalAmount += taxAmount;
        }
        updated.amount = finalAmount;
        updated.serialno = (updated.selectedSerialNos || []).join(", ");
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

  // calculate total tax only if gst is enabled

  const totalTax = taxSettings.enableGSTBilling
    ? products.reduce((sum, p) => sum + (p.taxAmount || 0), 0)
    : 0;
  const itemsDiscount = products.reduce(
    (sum, p) => sum + (p.discountAmt || 0),
    0,
  );

  // Update this calculation in your existing code:
  const additionalDiscountValue =
    additionalDiscountType === "Percentage" && additionalDiscountPct
      ? (subtotal * parseFloat(additionalDiscountPct)) / 100
      : additionalDiscountType === "Fixed" && additionalDiscountAmt
        ? parseFloat(additionalDiscountAmt) || 0
        : 0;

  const totalDiscount = itemsDiscount + additionalDiscountValue;

  const POINT_VALUE = 10;
  const pointsRedeemedAmount =
    (usePoints ? parseFloat(shoppingPointsUsed) || 0 : 0) * POINT_VALUE;

  const grandTotalBefore =
    subtotal -
    totalDiscount -
    pointsRedeemedAmount +
    (taxSettings.enableGSTBilling ? totalTax : 0) +
    additionalChargesTotal;

  // Apply auto round off if enabled
  let roundedTotal = grandTotalBefore;
  let roundOffAdded = 0;

  // Apply auto round off from tax settings
  if (taxSettings.autoRoundOff !== "0" && taxSettings.enableGSTBilling) {
    const roundValue = parseInt(taxSettings.autoRoundOff);
    if (roundValue > 0) {
      // Round to nearest specified value
      roundedTotal = Math.round(grandTotalBefore / roundValue) * roundValue;
      roundOffAdded = roundedTotal - grandTotalBefore;
    }
  }
  const grandTotal = Math.max(0, roundedTotal);

  // const roundedTotal = autoRoundOff
  //   ? Math.round(grandTotalBefore)
  //   : grandTotalBefore;
  // const roundOffAdded = roundedTotal - grandTotalBefore;
  // const grandTotal = Math.max(0, roundedTotal);

  useEffect(() => {
    if (fullyReceived) {
      setAmountReceived(grandTotal.toFixed(2));
    }
  }, [fullyReceived, grandTotal]);

  const amountToReturn = Math.max(
    0,
    (parseFloat(amountReceived) || 0) - grandTotal,
  );

  // // New Uto Round off calculation
  // let roundedTotal = grandTotalBefore;
  // if(taxSettings.autoRoundOff !== "0" && taxSettings.enableGSTBilling) {
  //   const roundValue = parseInt(taxSettings.autoRoundOff);
  //   if(roundValue > 0) {
  //     roundedTotal = Math.round(grandTotalBefore / roundValue) * roundValue;
  //   }
  // }
  // const roundOffAdded = roundedTotal - grandTotalBefore;
  // const grandTotal = Math.max(0, roundedTotal);

  // Handle file upload
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    const validFiles = files.filter((file) => allowedTypes.includes(file.type));

    if (validFiles.length !== files.length) {
      toast.error("Only JPG, JPEG, PNG files are allowed!");
    }

    const newImages = validFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      filename: file.name,
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
      }
    }
  };

  // Handle date selection
  // Replace or modify your handleDateSelect function
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

    // When from navbar, check if customer is selected
    if (isFromNavbar) {
      if (!customer.customerId) {
        newErrors.customerName = "Please select a customer";
      }
    } else {
      // When from customer page, check name directly
      if (!customer.name.trim()) {
        newErrors.customerName = "Customer name is required";
      }
    }
    if (!customer.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(customer.phone)) {
      newErrors.phone = "Phone number must be 10 digits";
    }

    if (!customer.address.trim()) {
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

  // Handle form submission - FIXED VERSION
  // Handle form submission - CORRECTED VERSION for your backend
  const handleSubmit = async (shouldPrint = false) => {
    console.log("handleSubmit called with shouldPrint:", shouldPrint);
    console.log("Button clicked, isSubmitting:", isSubmitting);
    // check if we have a customer selected
    if (!customer.customerId) {
      toast.error("Please select a customer first");
      return;
    }

    if (isSubmitting) {
      console.log("Already submitting, returning...");
      return; // Prevent double submission
    }
    const { isValid, errors } = validateForm();
    //     if (!isValid) {
    //   toast.error(Object.values(errors)[0]);
    //   return;
    // }
    if (!isValid) {
      const firstErrorKey = Object.keys(errors)[0];
      toast.error(errors[firstErrorKey]);
      return;
    }

    // filter out empty product rows (rows with no product selected)
    const nonEmptyProducts = products.filter(
      (p) =>
        p.productId &&
        p.productId.trim() !== "" &&
        p.itemName &&
        p.itemName.trim() !== "",
    );
    if (nonEmptyProducts.length !== products.length) {
      setProducts(nonEmptyProducts);
      // Show a message to the user
      toast.info(
        `Removed ${products.length - nonEmptyProducts.length} empty row(s) before saving`,
      );
    }
    if (nonEmptyProducts.length === 0) {
      toast.error("Please add at least one product");
      return;
    }

    // Check stock availability for all products before submitting
    for (const product of nonEmptyProducts) {
      if (product.productId) {
        try {
          const response = await api.get(`/api/products/${product.productId}`);
          const prodData = response.data;

          const availableStock = prodData.stockQuantity || 0;

          if (availableStock < (product.qty || 1)) {
            toast.error(
              `Insufficient stock for ${prodData.productName}! Available: ${availableStock}, Requested: ${product.qty}`,
            );
            return; // Stop submission
          }
        } catch (error) {
          console.error(
            `Error checking stock for product ${product.productId}:`,
            error,
          );
          // Continue anyway if check fails
        }
      }
    }

    setIsSubmitting(true);

    try {
      // Prepare FormData for file uploads
      const formData = new FormData();

      // Add all invoice data as separate fields - MATCHING YOUR BACKEND SCHEMA
      // formData.append("customerId", customerId);
      // use customer.customerId in the form data
      formData.append("customerId", customer.customerId);
      formData.append("invoiceDate", invoiceDate.toISOString());
      formData.append("dueDate", new Date().toISOString());
      formData.append("billingAddress", customer.address);
      formData.append("shippingAddress", customer.address);
      formData.append("subtotal", subtotal);
      formData.append("totalTax", totalTax);
      formData.append("totalDiscount", totalDiscount);
      formData.append("additionalCharges", additionalChargesTotal);
      formData.append(
        "shoppingPointsUsed",
        usePoints ? parseFloat(shoppingPointsUsed) || 0 : 0,
      );
      formData.append("pointValue", POINT_VALUE);
      formData.append("autoRoundOff", autoRoundOff);
      formData.append("grandTotal", grandTotal);
      formData.append("paidAmount", parseFloat(amountReceived) || 0);
      formData.append("fullyReceived", fullyReceived);
      formData.append("paymentMethod", "cash");
      formData.append(
        "status",
        fullyReceived || (parseFloat(amountReceived) || 0) >= grandTotal
          ? "paid"
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
      formData.append("dueDate", dueDate.toISOString());

      // Add tax settings to form data
      formData.append(
        "taxSettings[enableGSTBilling]",
        taxSettings.enableGSTBilling,
      );
      formData.append(
        "taxSettings[priceIncludeGST]",
        taxSettings.priceIncludeGST,
      );
      formData.append("taxSettings[autoRoundOff]", taxSettings.autoRoundOff);
      formData.append(
        "taxSettings[defaultGSTRate]",
        taxSettings.defaultGSTRate,
      );

      // Add items array
      nonEmptyProducts.forEach((p, index) => {
        formData.append(`items[${index}][productId]`, p.productId);
        formData.append(`items[${index}][itemName]`, p.itemName || p.name);
        formData.append(`items[${index}][hsnCode]`, p.hsnCode || "");
        formData.append(`items[${index}][qty]`, parseFloat(p.qty));
        formData.append(`items[${index}][unit]`, p.unit);
        formData.append(`items[${index}][unitPrice]`, parseFloat(p.unitPrice));
        // formData.append(
        //   `items[${index}][taxType]`,
        //   p.taxType || `GST ${p.taxRate}%`
        // );
        formData.append(
          `items[${index}][taxType]`,
          `GST ${p.taxRate}%`, // Force it to be a string with GST prefix
        );
        formData.append(`items[${index}][taxRate]`, p.taxRate);
        formData.append(`items[${index}][taxAmount]`, p.taxAmount);
        formData.append(
          `items[${index}][discountPct]`,
          parseFloat(p.discountPct) || 0,
        );
        formData.append(`items[${index}][discountAmt]`, p.discountAmt);
        formData.append(`items[${index}][amount]`, p.amount);
        formData.append(`items[${index}][serialNumbers]`, JSON.stringify(p.selectedSerialNos || []));
        formData.append(`items[${index}][serialno]`, (p.selectedSerialNos || []).join(", "));
      });

      // Add uploaded images
      uploadedImages.forEach((image, index) => {
        formData.append(`attachments`, image.file, image.filename);
      });

      // Debug: Log what's being sent
      console.log("Sending form data:");
      for (let pair of formData.entries()) {
        console.log(pair[0] + ": " + pair[1]);
      }

      // Debug: Log form data
      console.log("FormData contents:");
      for (let pair of formData.entries()) {
        console.log(pair[0] + ": " + pair[1]);
      }

      // Send to backend
      const response = await api.post("/api/invoices", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Response:", response.data);

      if (response.data.success) {
        toast.success("Invoice created successfully!");

        if (shouldPrint) {
          // "Save & Print" clicked - navigate to print page
          navigate(
            `/skeleton?redirect=/showinvoice/${response.data.invoice._id}`,
          );
        } else {
          // "Save" clicked - navigate to customers list
          navigate("/skeleton?redirect=/customers");
        }
      } else {
        toast.error(response.data.error || "Failed to create invoice");
      }
    } catch (error) {
      console.error("Invoice creation failed:", error);

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
        toast.error("Failed to create invoice. Please try again.");
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
        !viewManageRef.current.contains(event.target) &&
        viewDueDateRef.current &&
        !viewDueDateRef.current.contains(event.target)
      ) {
        setViewManageOptions(false);
        setIsDatePickerOpen(false);
        setViewDueDateOptions(false);
        setIsDueDatePickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // for auto product row add
  // useEffect(() => {
  //   // check if the last product row has been filled
  //   const lastProduct = products[products.length - 1];
  //   if (
  //     lastProduct &&
  //     lastProduct.itemName &&
  //     lastProduct.itemName.trim() !== ""
  //   ) {
  //     const  isLastRow = products.indexOf(lastProduct) === products.length - 1;
  //     if(isLastRow) {
  //     // Add a new row automatically
  //     const timer = setTimeout(() => {
  //       if (!hasAddedInitialProduct.current) {
  //         addProductRow();
  //         hasAddedInitialProduct.current = true;
  //       }
  //     }, 300);
  //     return () => clearTimeout(timer);
  //   }
  //   }
  // }, [products]);

  useEffect(() => {
    // Check if the last product row has been filled
    const lastProduct = products[products.length - 1];

    if (
      lastProduct &&
      lastProduct.itemName &&
      lastProduct.itemName.trim() !== ""
    ) {
      // Check if this is truly the last row (no empty rows after it)
      const timer = setTimeout(() => {
        // Don't add if there's already an empty row at the end
        const hasEmptyRow = products.some(
          (p) => !p.itemName || p.itemName.trim() === "",
        );

        if (!hasEmptyRow) {
          addProductRow();
        }
      }, 500); // Increased delay for better UX

      return () => clearTimeout(timer);
    }
  }, [products]);

  const styles = `
  .product-row:hover .delete-icon {
    opacity: 1 !important;
  }
  
  .product-row:hover {
    background-color: #f8f9fa !important;
  }
  
  /* Style for all input fields in the products table */
  .table-input {
    width: 100%;
    height: 38px;
    background: white;
    overflow: hidden;
    border-radius: 4px;
    outline: 1px var(--Stroke, #EAEAEA) solid;
    outline-offset: -1px;
    padding: 6px 8px;
    font-size: 14px;
    font-family: 'Inter', sans-serif;
    color: var(--Black-Primary, #0E101A);
    text-align: center;
  }
  
  .table-input:focus {
    outline: 1px var(--Blue-Blue, #1F7FFF) solid;
    outline-offset: -1px;
  }
  
  .table-input-disabled {
    background: var(--Spinning-Frame, #E9F0F4);
    color: var(--Black-Secondary, #6C748C);
    cursor: not-allowed;
    outline: 1px var(--Stroke, #C2C9D1) solid;
  }
  
  /* For read-only inputs */
  .table-input-readonly {
    background: var(--Spinning-Frame, #E9F0F4);
  }
`;

  // Add this function to filter out empty products
  const getNonEmptyProducts = () => {
    return products.filter(
      (p) =>
        p.productId &&
        p.productId.trim() !== "" &&
        p.itemName &&
        p.itemName.trim() !== "",
    );
  };

  if (loading) return <div>Loading...</div>;

  return (
    <>
      <style>{styles}</style>
      <div className="px-4 py-4" style={{ height: "100vh" }}>
        <div className="">
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
                <Link to="/customers" style={{ textDecoration: "none" }}>
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
                  Create Invoice
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
                height: "calc(100vh - 180px)",
              }}
            >
              {/* Customer Details */}
              <div style={{ width: "1780px" }}>
                <div
                  style={{
                    color: "black",
                    fontSize: "16px",
                    fontFamily: "Inter",
                    fontWeight: "500",
                    lineHeight: "19.20px",
                  }}
                >
                  Customer Details
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
                        {/* from nav start */}
                        <div
                          style={{ display: "flex", flexDirection: "column" }}
                        >
                          <label>
                            Customer Name<span style={{ color: "red" }}>*</span>
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
                            className="customer-search-container"
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
                                    cursor: isFromNavbar
                                      ? "pointer"
                                      : "default",
                                    fontSize: "16px",
                                  }}
                                  onClick={() =>
                                    isFromNavbar &&
                                    setShowCustomerDropdown(true)
                                  }
                                />
                              )}
                              <input
                                type="text"
                                placeholder={
                                  isFromNavbar
                                    ? "Search by name..."
                                    : "Enter Name"
                                }
                                style={{
                                  width: "100%",
                                  border: "none",
                                  outline: "none",
                                  fontSize: "14px",
                                  cursor: isFromNavbar ? "pointer" : "text",
                                }}
                                value={
                                  isFromNavbar ? customerSearch : customer.name
                                }
                                onChange={(e) => {
                                  if (isFromNavbar) {
                                    // Update only customer search, clear phone search
                                    setCustomerSearch(e.target.value);
                                    setPhoneSearch(""); // Clear phone search
                                    setShowCustomerDropdown(true);
                                  } else {
                                    setCustomer({
                                      ...customer,
                                      name: e.target.value,
                                    });
                                  }
                                }}
                                onFocus={() =>
                                  isFromNavbar && setShowCustomerDropdown(true)
                                }
                                readOnly={isFromNavbar && customer.customerId}
                              />
                            </div>

                            {/* Action buttons */}
                            {isFromNavbar && (
                              <div style={{ display: "flex", gap: "4px" }}>
                                {customer.customerId ? (
                                  <button
                                    onClick={handleClearCustomer}
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

                            {/* dropdown after action */}
                            {isFromNavbar && showCustomerDropdown && (
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
                                {filteredCustomers.length === 0 ? (
                                  <div
                                    style={{
                                      padding: "12px",
                                      color: "#666",
                                      textAlign: "center",
                                    }}
                                  >
                                    {customerSearch.trim() ||
                                      phoneSearch.trim() ? (
                                      <>
                                        No customers found
                                        {customerSearch.trim() &&
                                          ` for name: "${customerSearch}"`}
                                        {phoneSearch.trim() &&
                                          ` for phone: "${phoneSearch}"`}
                                        <div style={{ marginTop: "8px" }}>
                                          <button
                                            onClick={() => {
                                              setOpenAddModal(true);
                                              setShowCustomerDropdown(false);
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
                                            + Add New Customer
                                          </button>
                                        </div>
                                      </>
                                    ) : (
                                      "Start typing to search customers"
                                    )}
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
                                      {filteredCustomers.length} customer(s)
                                      found
                                      {customerSearch.trim() &&
                                        ` for name: "${customerSearch}"`}
                                      {phoneSearch.trim() &&
                                        ` for phone: "${phoneSearch}"`}
                                      <button
                                        onClick={() => {
                                          setOpenAddModal(true);
                                          setShowCustomerDropdown(false);
                                        }}
                                        style={{
                                          background: "transparent",
                                          border: "none",
                                          color: "#1F7FFF",
                                          cursor: "pointer",
                                          fontWeight: "500",
                                          marginLeft: "8px",
                                        }}
                                      >
                                        + Add new
                                      </button>
                                    </div>
                                    {filteredCustomers.map((cust) => (
                                      <div
                                        key={cust._id}
                                        onClick={() =>
                                          handleCustomerSelect(cust)
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
                                          {cust.name?.charAt(0).toUpperCase() ||
                                            "C"}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                          <div style={{ fontWeight: "500" }}>
                                            {cust.name}
                                          </div>
                                          <div
                                            style={{
                                              fontSize: "12px",
                                              color: "#666",
                                            }}
                                          >
                                            {cust.phone || "No phone"} • ✉️{" "}
                                            {cust.email || "No email"}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        {/* from nav end */}
                        <div
                          style={{ display: "flex", flexDirection: "column" }}
                        >
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
                              alignItems: "center",
                              position: "relative",
                            }}
                            className="customer-search-container"
                          >
                            <div
                              className="d-flex "
                              style={{ borderRight: "1px solid #EAEAEA" }}
                            >
                              <img src={indialogo} alt="india-logo" />
                              <span
                                style={{ color: "black", padding: "0px 6px" }}
                              >
                                +91
                              </span>
                            </div>
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
                                    cursor: isFromNavbar
                                      ? "pointer"
                                      : "default",
                                    fontSize: "16px",
                                  }}
                                  onClick={() =>
                                    isFromNavbar &&
                                    setShowCustomerDropdown(true)
                                  }
                                />
                              )}
                              <input
                                type="text"
                                placeholder={
                                  isFromNavbar
                                    ? "Search by phone..."
                                    : "Enter Customer No"
                                }
                                style={{
                                  width: "250px",
                                  border: "none",
                                  outline: "none",
                                  fontSize: "14px",
                                  cursor: isFromNavbar ? "pointer" : "text",
                                }}
                                value={
                                  isFromNavbar ? phoneSearch : customer.phone
                                }
                                onChange={(e) => {
                                  // Remove all non-numeric characters
                                  const value = e.target.value.replace(
                                    /\D/g,
                                    "",
                                  );

                                  if (isFromNavbar) {
                                    // Update only phone search, clear customer search
                                    setPhoneSearch(value);
                                    setCustomerSearch(""); // Clear customer name search
                                    setShowCustomerDropdown(true);
                                  } else {
                                    setCustomer({
                                      ...customer,
                                      phone: value,
                                    });
                                  }
                                }}
                                onFocus={() =>
                                  isFromNavbar && setShowCustomerDropdown(true)
                                }
                                readOnly={isFromNavbar && customer.customerId}
                                maxLength="10"
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
                            value={customer.address}
                            onChange={(e) =>
                              setCustomer({
                                ...customer,
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
                          <div style={{ position: "relative", minWidth: 200 }}>
                            <span
                              style={{
                                position: "absolute",
                                top: "-7px",
                                left: "12px",
                                background: "#ffff",
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
                              {/* due Date start */}
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
                          {/* Due Date Selection */}
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
                              Due Date
                            </span>
                            <div
                              ref={viewDueDateRef}
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
                              onClick={() => setViewDueDateOptions(true)}
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
                                {format(dueDate, "dd MMM yyyy")}
                              </div>
                              <FiChevronDown />

                              {viewDueDateOptions && (
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
                                      "7 Days",
                                      "15 Days",
                                      "30 Days",
                                      "45 Days",
                                      "60 Days",
                                      "90 Days",
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
                                        onClick={() =>
                                          handleDueDateSelect(option)
                                        }
                                      >
                                        <span style={{ color: "black" }}>
                                          {option}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Due DatePicker for Custom selection */}
                              {isDueDatePickerOpen && (
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
                                    selected={dueDate}
                                    onChange={(date) => {
                                      if (date) {
                                        setDueDate(date);
                                      }
                                      setIsDueDatePickerOpen(false);
                                      setViewDueDateOptions(false);
                                    }}
                                    inline
                                    calendarClassName="custom-calendar"
                                    minDate={new Date()} // Can't select past dates
                                  />
                                  <div
                                    style={{
                                      textAlign: "center",
                                      marginTop: "10px",
                                    }}
                                  >
                                    <button
                                      onClick={() => {
                                        setIsDueDatePickerOpen(false);
                                        setViewDueDateOptions(false);
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
                          {/* due Date end */}
                          {/* kkk */}
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
                              Invoice Number
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
                  width: "1780px",
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
                      {/* serial no start */}
                      {settings.serialno && (
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
                            Serial No
                          </div>
                        </div>
                      )}
                      <div
                        style={{
                          width: 1,
                          height: 30,
                          background: "var(--Black-Disable, #A2A8B8)",
                        }}
                      />
                      {/* serial no end */}
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
                      {taxSettings.enableGSTBilling ? (
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
                      ) : (
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
                            opacity: 0.5,
                          }}
                        >
                          <div
                            style={{
                              color: "#A2A8B8",
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
                      )}
                      <div
                        style={{
                          width: 1,
                          height: 30,
                          background: "var(--Black-Disable, #A2A8B8)",
                        }}
                      />
                      {taxSettings.enableGSTBilling ? (
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
                      ) : (
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
                            opacity: 0.5,
                          }}
                        >
                          <div
                            style={{
                              color: "#A2A8B8",
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
                      )}
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
                            position: "relative",
                          }}
                          className="product-row"
                        >
                          {/* Delete icon - shown only on hover */}
                          <div
                            className="delete-icon"
                            style={{
                              position: "absolute",
                              left: "8px", // Reduced from 12px
                              top: "50%",
                              transform: "translateY(-50%)",
                              opacity: 0,
                              transition: "opacity 0.2s",
                              zIndex: 1,
                              width: "20px",
                              height: "20px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <RiDeleteBinLine
                              className="text-danger"
                              style={{
                                cursor: "pointer",
                                fontSize: "16px", // Reduced from fs-5
                              }}
                              onClick={() => removeProductRow(p.id)}
                            />
                          </div>

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
                                  outline: "1px var(--Stroke, #EAEAEA) solid",
                                  borderRadius: 4,
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
                                  <div
                                    style={{
                                      width: 120,
                                      alignSelf: "stretch",
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
                                    <input
                                      type="number"
                                      placeholder="0"
                                      min="1"
                                      step="1"
                                      className="table-input"
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
                              </div>
                              <div
                                style={{
                                  width: 1,
                                  height: 30,
                                  background: "var(--Black-Disable, #A2A8B8)",
                                }}
                              />
                              {/* for serial no start */}
                              {/* In the products table rows section */}
                              {/* {settings.serialno && (
                                <>
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
                                      outline: "1px var(--Stroke, #EAEAEA) solid",
                                      borderRadius: 4,
                                    }}
                                  >
                                    <input
                                      type="text"
                                      placeholder="Serial No"
                                      className="table-input"
                                      style={{
                                        width: "100%",
                                        border: "none",
                                        outline: "none",
                                      }}
                                      value={p.serialno || ""}
                                      onChange={(e) =>
                                        updateProduct(p.id, "serialno", e.target.value)
                                      }
                                    />
                                  </div>
                                  <div
                                    style={{
                                      width: 1,
                                      height: 30,
                                      background: "var(--Black-Disable, #A2A8B8)",
                                    }}
                                  />
                                </>
                              )} */}
                              {settings.serialno && (
                                <>
                                  <div
                                    style={{
                                      width: 200, // Increased width for dropdown
                                      alignSelf: "stretch",
                                      paddingLeft: 12,
                                      paddingRight: 12,
                                      paddingTop: 4,
                                      paddingBottom: 4,
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      display: "flex",
                                      outline: "1px var(--Stroke, #EAEAEA) solid",
                                      borderRadius: 4,
                                    }}
                                  >
                                    <SerialNumberDropdown
                                      product={p}
                                      onSelect={(selectedSerialNos) => updateProduct(p.id, "selectedSerialNos", selectedSerialNos)}
                                      disabled={!p.productId}
                                    />
                                  </div>
                                  <div
                                    style={{
                                      width: 1,
                                      height: 30,
                                      background: "var(--Black-Disable, #A2A8B8)",
                                    }}
                                  />
                                </>
                              )}
                              {/* for serial no end */}
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
                                  outline: "1px var(--Stroke, #EAEAEA) solid",
                                  borderRadius: 4,
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
                                  <div
                                    style={{
                                      width: 120,
                                      alignSelf: "stretch",
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
                                    <input
                                      type="number"
                                      placeholder="0.00"
                                      style={{
                                        width: "100%",
                                        border: "none",
                                        outline: "none",
                                      }}
                                      className="table-input"
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
                                  outline: "1px var(--Stroke, #EAEAEA) solid",
                                  borderRadius: 4,
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
                                  <div
                                    style={{
                                      width: 120,
                                      alignSelf: "stretch",
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
                                    <input
                                      type="text"
                                      className={`table-input ${!taxSettings.enableGSTBilling ? "table-input-disabled" : ""}`}
                                      style={{
                                        width: "100%",
                                        border: "none",
                                        outline: "none",
                                        background: "transparent",
                                        color: taxSettings.enableGSTBilling
                                          ? "inherit"
                                          : "#A2A8B8",
                                        cursor: taxSettings.enableGSTBilling
                                          ? "text"
                                          : "not-allowed",
                                      }}
                                      value={`${p.taxRate}%`}
                                      readOnly={!taxSettings.enableGSTBilling}
                                    />
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
                                  outline: "1px var(--Stroke, #EAEAEA) solid",
                                  borderRadius: 4,
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
                                  <div
                                    style={{
                                      width: 120,
                                      alignSelf: "stretch",
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
                                    <input
                                      type="number"
                                      className={`table-input ${!taxSettings.enableGSTBilling ? "table-input-disabled" : ""}`}
                                      style={{
                                        width: "100%",
                                        border: "none",
                                        outline: "none",
                                        backgroundColor: "transparent",
                                        color: taxSettings.enableGSTBilling
                                          ? "inherit"
                                          : "#A2A8B8",
                                        cursor: "default",
                                      }}
                                      value={p.taxAmount.toFixed(2)}
                                      readOnly
                                    />
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
                                        updateProduct(
                                          p.id,
                                          "discountPct",
                                          value,
                                        );
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
                                      outline:
                                        "1px var(--Stroke, #C2C9D1) solid",
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
                                        color:
                                          "var(--Black-Secondary, #6C748C)",
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
                                        updateProduct(
                                          p.id,
                                          "discountAmt",
                                          value,
                                        );
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
                                      outline:
                                        "1px var(--Stroke, #C2C9D1) solid",
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
                                        color:
                                          "var(--Black-Secondary, #6C748C)",
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
                                  outline: "1px var(--Stroke, #EAEAEA) solid",
                                  borderRadius: 4,
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
                                  <div
                                    style={{
                                      width: 120,
                                      alignSelf: "stretch",
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
                                    <input
                                      type="number"
                                      className="table-input"
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
                        </div>
                      ))}

                      {/* Add New Product Button */}
                      {/* <div
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
                    </div> */}
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Details */}
              <div
                style={{
                  background: "#fff",
                  padding: "2px",
                  width: "1780px",
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
                      Payment Detail
                    </div>

                    {/* Additional Discount */}
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
                                    const pctValue =
                                      (numValue / subtotal) * 100;
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
                            onChange={(e) => {
                              const value = e.target.value;
                              const numericValue = value.replace(/[^\d.]/g, "");
                              const parts = numericValue.split(".");
                              if (parts.length > 2) {
                                const formattedValue =
                                  parts[0] + "." + parts.slice(1).join("");
                                setChargeAmount(formattedValue);
                              } else {
                                setChargeAmount(numericValue);
                              }
                            }}
                            onKeyPress={(e) => {
                              if (!/[0-9.]/.test(e.key)) {
                                e.preventDefault();
                              }
                            }}
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
                        Upload Images
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
                          document.getElementById("file-upload").click()
                        }
                      >
                        <input
                          id="file-upload"
                          type="file"
                          multiple
                          accept="image/jpeg,image/png,image/jpg"
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
                    {/* e way bill and delivery chalan */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        marginTop: "20px",
                      }}
                    >
                      <label
                        style={{
                          display: "flex",
                          gap: "10px",
                          alignItems: "center",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={checkboxStyle(eway)}
                          onClick={() => setEway(!eway)}
                        >
                          {eway && <span style={tickStyle}>✓</span>}
                        </div>
                        <span
                          style={{
                            color: "#0E101A",
                            fontSize: "12px",
                            fontWeight: 400,
                            fontFamily: "inter, 'sans-serif'",
                          }}
                        >
                          Create E-way Bill
                        </span>
                      </label>

                      <label
                        style={{
                          display: "flex",
                          gap: "10px",
                          alignItems: "center",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={checkboxStyle(chalan)}
                          onClick={() => setChalan(!chalan)}
                        >
                          {chalan && <span style={tickStyle}>✓</span>}
                        </div>
                        <span
                          style={{
                            color: "#0E101A",
                            fontSize: "12px",
                            fontWeight: 400,
                            fontFamily: "inter, 'sans-serif'",
                          }}
                        >
                          Create Delivery Chalan
                        </span>
                      </label>
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
                    {taxSettings.enableGSTBilling ? (
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
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "8px",
                          fontSize: "14px",
                          opacity: 0.5,
                        }}
                      >
                        <span style={{ color: "#A2A8B8" }}>Taxes :</span>
                        <span style={{ color: "#A2A8B8" }}>
                          ₹{totalTax.toFixed(2)}
                        </span>
                      </div>
                    )}

                    {/* Product/Item Discount - ADD THIS */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "8px",
                        fontSize: "13px",
                      }}
                    >
                      <span style={{ color: "#6b7280" }}>
                        Product Discount :
                      </span>
                      <span style={{ color: "#9ca3af" }}>
                        ₹{itemsDiscount.toFixed(2)}
                      </span>
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

                    {/* Shopping Points */}
                    <div
                      style={{
                        display: "flex",
                        width: "100%",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <input
                            type="checkbox"
                            style={{ accentColor: "#ffffffff" }}
                            checked={usePoints}
                            onChange={(e) => {
                              setUsePoints(e.target.checked);
                              if (!e.target.checked) {
                                setShoppingPointsUsed("");
                              }
                            }}
                          />
                          <span>Shopping Points</span>
                        </div>

                        <div style={{ fontSize: "12px", margin: "8px 0" }}>
                          Available - 🪙 {customerPoints} points
                        </div>
                      </div>

                      <div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "end",
                            marginBottom: "12px",
                            gap: "16px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              gap: "6px",
                              flexDirection: "column",
                            }}
                          >
                            <span
                              style={{ fontSize: "14px", color: "#6b7280" }}
                            >
                              Point Used
                            </span>
                            <div
                              style={{
                                display: "flex",
                                border: "1px solid #e5e7eb",
                                justifyContent: "space-between",
                                width: "98px",
                                height: "40px",
                              }}
                            >
                              <input
                                placeholder="0"
                                className=""
                                style={{
                                  width: "30px",
                                  border: "none",
                                  background: "transparent",
                                  textAlign: "center",
                                  fontSize: "14px",
                                  outline: "none",
                                  backgroundColor: "white",
                                }}
                                value={shoppingPointsUsed}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (/^\d*$/.test(value)) {
                                    const points = parseInt(value) || 0;
                                    if (points > customerPoints) {
                                      toast.error(
                                        `Cannot use more than ${customerPoints} points`,
                                      );
                                      setShoppingPointsUsed(
                                        customerPoints.toString(),
                                      );
                                    } else {
                                      setShoppingPointsUsed(value);
                                    }
                                  }
                                }}
                                disabled={!usePoints}
                              />
                              <div
                                style={{
                                  border: "1px solid #e5e7eb",
                                  borderRadius: "1px",
                                  display: "flex",
                                  alignItems: "center",
                                  backgroundColor: "#e5e7eb",
                                  justifyContent: "center",
                                  width: "25px",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "14px",
                                    background: "#e5e7eb",
                                    padding: "0px 1px",
                                  }}
                                >
                                  🪙
                                </span>
                              </div>
                            </div>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            <span style={{ marginTop: "25px" }}>=</span>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              gap: "6px",
                              flexDirection: "column",
                            }}
                          >
                            <span
                              style={{ fontSize: "14px", color: "#6b7280" }}
                            >
                              Amount
                            </span>

                            <div
                              style={{
                                display: "flex",
                                border: "1px solid #e5e7eb",
                                justifyContent: "space-between",
                                width: "98px",
                                height: "40px",
                              }}
                            >
                              <input
                                placeholder="0"
                                className=""
                                style={{
                                  width: "30px",
                                  border: "none",
                                  background: "transparent",
                                  textAlign: "center",
                                  fontSize: "14px",
                                  outline: "none",
                                  backgroundColor: "white",
                                }}
                                value={pointsRedeemedAmount.toFixed(2)}
                                readOnly
                              />
                              <div
                                style={{
                                  border: "1px solid #e5e7eb",
                                  borderRadius: "1px",
                                  display: "flex",
                                  alignItems: "center",
                                  backgroundColor: "#e5e7eb",
                                  justifyContent: "center",
                                  width: "25px",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "14px",
                                    background: "#e5e7eb",
                                    padding: "0px 5px",
                                  }}
                                >
                                  ₹
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

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
                        // checked={autoRoundOff}
                        checked={
                          taxSettings.autoRoundOff !== "0" &&
                          taxSettings.enableGSTBilling
                        }
                        // onChange={(e) => setAutoRoundOff(e.target.checked)}
                        onChange={(e) => {
                          toast.info(
                            "Auto Round-off is controlled from tax setting page",
                          );
                        }}
                        disabled
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

                    {/* Fully Received */}
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
                            setAmountReceived(grandTotal.toFixed(2));
                          }
                        }}
                      />
                      <span>Fully Received</span>
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
                          Amount Received
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
                            value={amountReceived}
                            onChange={(e) => setAmountReceived(e.target.value)}
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
                          Amount to Return
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
                            value={amountToReturn.toFixed(2)}
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
                    {/* SAVE BUTTON - Only one onClick handler */}
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

                    {/* SAVE & PRINT BUTTON - Only one onClick handler */}
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
        {/* Add Customer Modal */}
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
              <AddCustomers
                onClose={() => {
                  setOpenAddModal(false);
                  fetchCustomersForSearch();
                }}
                onSuccess={handleNewCustomerCreated} //Auto selected new customer
              />
            </div>
          </div>
        )}

        {/* Preview Modal open*/}
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
                  height: "auto", // height must match dropdownHeight above
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
                              src={companyData?.companyLogo || CompanyLogo}
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
                            display: "flex",
                            justifyContent: "space-between",
                            marginTop: "2px",
                          }}
                        >
                          <span>
                            DUE Date - {format(dueDate, "dd MMM yyyy")}
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
                            <span>Customer Details</span>
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
                              <span
                                style={{ color: "black", fontWeight: "600" }}
                              >
                                {companyData?.companyName || "N/A"}
                              </span>
                            </div>
                            <div>
                              <b>Address:</b>
                              {companyData?.companyaddress || "N/A"}
                            </div>
                            <div>
                              <b>Phone:</b> {companyData?.companyphone || "N/A"}
                            </div>
                            <div>
                              <b>Email:</b> {companyData?.companyemail || "N/A"}
                            </div>
                            <div>
                              <b>GSTIN:</b> {companyData?.gstin || "N/A"}
                            </div>
                          </div>
                          <div style={{ width: "50%", padding: "3px" }}>
                            <div>
                              Name :{" "}
                              <span
                                style={{ color: "black", fontWeight: "600" }}
                              >
                                {customer.name}
                              </span>
                            </div>
                            <div>
                              Address :{" "}
                              <span
                                style={{ color: "black", fontWeight: "600" }}
                              >
                                {customer.address}
                              </span>
                            </div>
                            <div style={{ marginTop: "8px" }}>
                              Phone :{" "}
                              <span
                                style={{ color: "black", fontWeight: "600" }}
                              >
                                {customer.phone}
                              </span>
                            </div>
                            <div style={{ marginTop: "0px" }}>
                              Email :{" "}
                              <span
                                style={{ color: "black", fontWeight: "600" }}
                              >
                                {customer?.email}
                              </span>
                            </div>
                            <div style={{ marginTop: "0px" }}>
                              GSTIN :{" "}
                              <span
                                style={{ color: "black", fontWeight: "600" }}
                              >
                                {customer?.gstin}
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
                                  Serial No.
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
                                {taxSettings.enableGSTBilling ? (
                                  <>
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
                                  </>
                                ) : (
                                  <>
                                    <th
                                      style={{
                                        borderRight: "1px solid #EAEAEA",
                                        borderBottom: "1px solid #EAEAEA",
                                        fontWeight: "400",
                                        color: "#A2A8B8",
                                        opacity: 0.5,
                                      }}
                                      colSpan="2"
                                    >
                                      Tax
                                    </th>
                                  </>
                                )}
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
                                {taxSettings.enableGSTBilling ? (
                                  <>
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
                                  </>
                                ) : (
                                  <>
                                    <th
                                      style={{
                                        borderRight: "1px solid #EAEAEA",
                                        borderBottom: "1px solid #EAEAEA",
                                        width: "40px",
                                        fontWeight: "400",
                                        color: "#A2A8B8",
                                        opacity: 0.5,
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
                                        color: "#A2A8B8",
                                        opacity: 0.5,
                                      }}
                                    >
                                      ₹
                                    </th>
                                  </>
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {getNonEmptyProducts().map((item, idx) => (
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
                                    {item.hsnCode || "-"}
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
                                      height: "40px",
                                      textAlign: "center",
                                    }}
                                  >
                                    {item.serialno || "-"}
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
                                    style={{
                                      color: "black",
                                      fontWeight: "600",
                                    }}
                                  >
                                    {banks.length > 0
                                      ? banks[0]?.bankName
                                      : "N/A"}
                                  </span>
                                </div>
                                <div>
                                  Branch :{" "}
                                  <span
                                    style={{
                                      color: "black",
                                      fontWeight: "600",
                                    }}
                                  >
                                    {banks.length > 0
                                      ? banks[0]?.branch
                                      : "N/A"}
                                  </span>
                                </div>
                                <div>
                                  Account No.:{" "}
                                  <span
                                    style={{
                                      color: "black",
                                      fontWeight: "600",
                                    }}
                                  >
                                    {banks.length > 0
                                      ? banks[0]?.accountNumber
                                      : "N/A"}
                                  </span>
                                </div>
                                <div>
                                  IFSC :{" "}
                                  <span
                                    style={{
                                      color: "black",
                                      fontWeight: "600",
                                    }}
                                  >
                                    {banks.length > 0 ? banks[0]?.ifsc : "N/A"}
                                  </span>
                                </div>
                                <div>
                                  Upi :{" "}
                                  <span
                                    style={{
                                      color: "black",
                                      fontWeight: "600",
                                    }}
                                  >
                                    {banks.length > 0 ? banks[0]?.upiId : "N/A"}
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
                                  style={{
                                    width: "90px",
                                    objectFit: "contain",
                                  }}
                                >
                                  <img
                                    src={
                                      banks.length > 0
                                        ? banks[0]?.qrCode
                                        : "https://via.placeholder.com/100"
                                    }
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
                              <span>Sub-total</span>
                              <span style={{ color: "black" }}>
                                ₹{subtotal.toFixed(2)}
                              </span>
                            </div>
                            {/* Tax Amount row in preview modal - Update this section */}
                            {taxSettings.enableGSTBilling && (
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
                            )}
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
                              <span>🪙 Shopping Points</span>
                              <span style={{ color: "black" }}>
                                ₹{pointsRedeemedAmount.toFixed(2)}
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
                                ₹
                                {Math.max(
                                  0,
                                  grandTotal -
                                  (parseFloat(amountReceived) || 0),
                                ).toFixed(2)}
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
                            {terms ? terms?.termsText : "N/A"}
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
                          }}
                        >
                          <span style={{ marginTop: "5px" }}>
                            Earned 🪙 {Math.floor(grandTotal / 100)} Shopping
                            Point on this purchase. Redeem on your next
                            purchase.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        {/* Preview Modal end */}
      </div>
    </>
  );
}

export default CustomerCreateInvoice;
