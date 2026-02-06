import React, { useState, useEffect, useRef, useCallback } from "react";
import "./CreditNote.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import InvoicePreviewModal from "../../../layouts/InvoicePreviewModal";
import DatePicker from "../../../layouts/DatePicker";
import total_orders_icon from "../../../../assets/images/totalorders-icon.png";
import api from "../../../../pages/config/axiosInstance";
import { toast } from "react-toastify";
import { IoChevronDownOutline } from "react-icons/io5";
import { FiSearch } from "react-icons/fi";
import { IoClose } from "react-icons/io5";
import { RiDeleteBinLine } from "react-icons/ri";
import { PiCaretUpDownLight } from "react-icons/pi";


const CustomerCreditNote = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // State for customer selection
  const [customerSearch, setCustomerSearch] = useState("");
  const [allCustomers, setAllCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  
  // modal state
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [customerInvoices, setCustomerInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Add taxSettings state
  const [taxSettings, setTaxSettings] = useState({
    enableGSTBilling: true,
  priceIncludeGST: true,
  defaultGSTRate: "18",
  autoRoundOff: "0"
  })

  // Check if we're in "create from navbar" mode
  const isFromNavbar = !location.state?.customer;

  // NEW STATE: Dual-table structure like Supplier Debit Note
  const [availableItems, setAvailableItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    customerId: "",
    customerName: "",
    phone: "",
    invoiceId: "", // This will store the actual invoice ID
    invoiceNumber: "", // This will store the invoice number for display
    date: new Date().toISOString().split("T")[0],
    subtotal: 0,
    discount: 0,
    totalTax:0,
    shippingCharges: 0,
    // autoRoundOff: false,
    roundOff: 0,
    totalAmount: 0,
    fullyReceived: false,
    notes: "",
  });

  // Fetch customers and products on component mount
  useEffect(() => {
    fetchCustomers();
    fetchProducts();

    // If customer passed from navigation
    if (location.state?.customer) {
      handleCustomerSelect(location.state.customer);
    }
  }, []);

  // Fetch customer invoices when customer changes
  useEffect(() => {
    if (formData.customerId) {
      fetchCustomerInvoices(formData.customerId);
    } else {
      setCustomerInvoices([]);
      setFormData((prev) => ({
        ...prev,
        invoiceId: "",
        invoiceNumber: "",
      }));
      setAvailableItems([]);
      setSelectedItems([]);
    }
  }, [formData.customerId]);

  // Recalculate totals when selected items or other values change
  useEffect(() => {
    calculateTotals();
  }, [selectedItems, formData.shippingCharges, formData.autoRoundOff]);

  // Fetch customers for search (when in navbar mode)
  useEffect(() => {
    if (isFromNavbar) {
      fetchCustomers();
    }
  }, [isFromNavbar]);

  // Handle click outside for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsInvoiceOpen(false);
      }
      if (!event.target.closest('.customer-search-container')) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle customer search
  useEffect(() => {
    if (!customerSearch.trim()) {
      setFilteredCustomers(allCustomers);
      return;
    }
    const searchTerm = customerSearch.toLowerCase();
    const filtered = allCustomers.filter((cust) => 
      cust.name?.toLowerCase().includes(searchTerm) || 
      cust.phone?.includes(customerSearch) || 
      cust.email?.toLowerCase().includes(searchTerm)
    );
    setFilteredCustomers(filtered);
  }, [customerSearch, allCustomers]);

  const handleBack = () => {
    navigate(location.state?.from || -1);
  }
  // fetch tax settings on component mount
  useEffect(() => {
  const loadTaxSettings = async () => {
    try {
      const response = await api.get('/api/tax-gst-settings');
      if (response.data.success) {
        const data = response.data.data;
        setTaxSettings({
          enableGSTBilling: data.enableGSTBilling !== false,
          priceIncludeGST: data.priceIncludeGST !== false,
          defaultGSTRate: data.defaultGSTRate || "18",
          autoRoundOff: data.autoRoundOff || "0"
        });
      }
    } catch (error) {
      console.error("Error fetching tax settings:", error);
    }
  };
  loadTaxSettings();
}, []);



  const fetchCustomers = async () => {
    try {
      const response = await api.get("/api/customers");
      // Handle different response structures
      let customersData = [];
      if (Array.isArray(response.data)) {
        customersData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        customersData = response.data.data;
      }
      setCustomers(customersData);
      setAllCustomers(customersData);
      setFilteredCustomers(customersData);
    } catch (error) {
      console.error("Failed to load customers:", error);
      toast.error("Failed to load customers");
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get("/api/products");
      // Handle different response structures
      let productsData = [];
      if (Array.isArray(response.data)) {
        productsData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        productsData = response.data.data;
      } else if (response.data?.products && Array.isArray(response.data.products)) {
        productsData = response.data.products;
      }
      setProducts(productsData);
    } catch (error) {
      console.error("Failed to load products:", error);
      toast.error("Failed to load products");
    }
  };

  const fetchCustomerInvoices = async (customerId) => {
    try {
      setLoadingInvoices(true);
      // Try different endpoints
      let response;
      try {
        response = await api.get(`/api/invoices/customer/${customerId}`);
      } catch (firstError) {
        try {
          response = await api.get(`/api/invoices?customerId=${customerId}`);
        } catch (secondError) {
          console.error("No invoice endpoint found");
          setCustomerInvoices([]);
          return;
        }
      }

      // Handle response structure
      let invoicesData = [];
      if (Array.isArray(response.data)) {
        invoicesData = response.data;
      } else if (response.data?.invoices && Array.isArray(response.data.invoices)) {
        invoicesData = response.data.invoices;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        invoicesData = response.data.data;
      }

      const validInvoices = invoicesData.filter(
        (invoice) =>
          invoice.status !== 'cancelled' &&
          invoice.status !== 'draft' &&
          invoice.status !== 'void'
      );

      // Sort by date (newest first)
      const sortedInvoices = validInvoices.sort((a, b) =>
        new Date(b.invoiceDate || b.createdAt) - new Date(a.invoiceDate || a.createdAt)
      );

      setCustomerInvoices(sortedInvoices);
      
      if (sortedInvoices.length === 0) {
        toast.info("No invoices found for this customer");
      }
    } catch (error) {
      console.error("Failed to load customer invoices:", error);
      setCustomerInvoices([]);
    } finally {
      setLoadingInvoices(false);
    }
  };

  
  const handleCustomerSearch = (searchTerm) => {
  setCustomerSearch(searchTerm);
  setShowCustomerDropdown(true);

  if (!searchTerm.trim()) {
    setFilteredCustomers(customers);
    return;
  }

  const filtered = customers.filter((customer) => {
    const name = customer.name || customer.customerName || "";
    const phone = customer.phone || customer.mobile || "";
    const searchLower = searchTerm.toLowerCase();

    return (
      name.toLowerCase().includes(searchLower) || phone.includes(searchTerm)
    );
  });

  setFilteredCustomers(filtered);
};

  const handleCustomerSelect = (customer) => {
    setFormData((prev) => ({
      ...prev,
      customerId: customer._id,
      customerName: customer.name,
      phone: customer.phone || "",
      invoiceId: "",
      invoiceNumber: "",
    }));
    
    // Clear items when customer changes
    setAvailableItems([]);
    setSelectedItems([]);
    
    if (isFromNavbar) {
      setCustomerSearch(customer.name);
      setShowCustomerDropdown(false);
    }
  };

  const handleClearCustomer = () => {
    setFormData((prev) => ({
      ...prev,
      customerId: "",
      customerName: "",
      phone: "",
      invoiceId: "",
      invoiceNumber: "",
    }));
    setAvailableItems([]);
    setSelectedItems([]);
    
    if (isFromNavbar) {
      setCustomerSearch("");
    }
  };


  const handleInvoiceSelect = async (invoice) => {
    try {
      // Fetch full invoice details with items
      const invoiceResponse = await api.get(`/api/invoices/${invoice._id}`);
      const invoiceDetails = invoiceResponse.data.invoice || invoiceResponse.data;

      if (!invoiceDetails || !invoiceDetails.items) {
        toast.error("Could not load invoice items");
        return;
      }

      // Map invoice items to available items
      const itemsFromInvoice = await Promise.all(
        invoiceDetails.items.map(async (item, index) => {
          let productName = item.itemName || item.name || "Product";

          if (item.productId && !item.itemName && !item.name) {
            try {
              const productResponse = await api.get(`/api/products/${item.productId}`);
              if (productResponse.data) {
                const product = productResponse.data.product || productResponse.data;
                productName = product.productName || product.name || "Product";
              }
            } catch (err) {
              console.error("Failed to fetch product details:", err);
            }
          }

          return {
            id: index + 1,
            productId: item.productId?._id || item.productId,
            name: productName,
            description: item.description || "",
            quantity: item.qty || item.quantity || 1,
            originalQuantity: item.qty || item.quantity || 1,
            unit: item.unit || "Pcs",
            unitPrice: item.unitPrice || item.price || 0,
            tax: item.taxType || `GST @ ${item.taxRate || 5}%`,
            taxRate: item.taxRate || 5,
            taxAmount: item.taxAmount || 0,
            discountPercent: item.discountPct || 0,
            discountAmount: item.discountAmt || 0,
            amount: item.amount || 0,
            isSelected: false,
          };
        })
      );

      // Set all items as available initially
      setAvailableItems(itemsFromInvoice);
      setSelectedItems([]);

      setFormData((prev) => ({
        ...prev,
        invoiceId: invoiceDetails._id,
        invoiceNumber: invoiceDetails.invoiceNo || invoiceDetails.invoiceNumber || "",
      }));

      toast.success(`Loaded ${itemsFromInvoice.length} items from invoice`);
    } catch (error) {
      console.error("Failed to load invoice details:", error);
      toast.error("Failed to load invoice details");
    }
  };

  // ===== DUAL-TABLE HANDLERS (Same as Supplier Debit Note) =====

  // Select item with quantity
  const handleSelectItem = (item, quantity) => {
    if (quantity <= 0) return;

    const maxAllowed = item.quantity;
    const actualQty = Math.min(quantity, maxAllowed);

    // Check if already selected
    const existingIndex = selectedItems.findIndex(
      (selItem) => selItem.id === item.id
    );

    if (existingIndex !== -1) {
      // Update existing
      const updatedSelected = [...selectedItems];
      updatedSelected[existingIndex] = {
        ...updatedSelected[existingIndex],
        returnQuantity: actualQty,
      };
      setSelectedItems(updatedSelected);
    } else {
      // Add new
      const itemToSelect = {
        ...item,
        isSelected: true,
        returnQuantity: actualQty,
        originalQuantity: item.quantity,
      };
      calculateItemTotal(itemToSelect);
      setSelectedItems([...selectedItems, itemToSelect]);
    }
  };

  // Update quantity of already selected item
  const handleUpdateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }

    const item = availableItems.find((avItem) => avItem.id === itemId);
    if (!item) return;

    const maxAllowed = item.quantity;
    const actualQty = Math.min(newQuantity, maxAllowed);

    const updatedSelected = selectedItems.map((selItem) =>
      selItem.id === itemId
        ? { ...selItem, returnQuantity: actualQty }
        : selItem
    );

    setSelectedItems(updatedSelected);
  };

  // Remove item from selected
  const handleRemoveItem = (itemId) => {
    const updatedSelected = selectedItems.filter(
      (selItem) => selItem.id !== itemId
    );
    setSelectedItems(updatedSelected);
  };

  // Calculate individual item total
  const calculateItemTotal = (item) => {
    if (!item) return;

    const subtotal = (item.returnQuantity || 0) * (item.unitPrice || 0);
    let discountAmount = item.discountAmount || 0;

    if (item.discountPercent > 0) {
      discountAmount = subtotal * (item.discountPercent / 100);
    }

    const taxableAmount = Math.max(0, subtotal - discountAmount);

    // Apply tax only if GST billing is enabled

    // const taxAmount = taxableAmount * ((item.taxRate || 0) / 100);
    const taxAmount = taxSettings.enableGSTBilling ? taxableAmount * ((item.taxRate || 0) / 100) : 0;
    const total = taxableAmount + taxAmount;

    item.discountAmount = parseFloat(discountAmount.toFixed(2));
    item.taxAmount = parseFloat(taxAmount.toFixed(2));
    item.amount = parseFloat(total.toFixed(2));
  };

  // Calculate totals based on selected items
  const calculateTotals = () => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    selectedItems.forEach((item) => {
      const itemSubtotal = (item.returnQuantity || 0) * (item.unitPrice || 0);
      subtotal += itemSubtotal;
      totalDiscount += item.discountAmount || 0;
      totalTax += item.taxAmount || 0;
    });

    // let totalAmount =
    //   subtotal + totalTax - totalDiscount + (formData.shippingCharges || 0);

      let totalAmount = subtotal - totalDiscount + (formData.shippingCharges || 0);

      // Add tax only if GST billing is enabled
      if(taxSettings.enableGSTBilling) {
        totalAmount += totalTax;
      }

    let roundOff = 0;
    // if (formData.autoRoundOff) {
    //   roundOff = Math.round(totalAmount) - totalAmount;
    //   totalAmount = Math.round(totalAmount);
    // }
    if(taxSettings.autoRoundOff  !== "0" && taxSettings.enableGSTBilling) {
    const roundValue = parseInt(taxSettings.autoRoundOff);
    if (roundValue > 0) {
      const roundedTotal = Math.round(totalAmount / roundValue) * roundValue;
      roundOff = roundedTotal - totalAmount;
      totalAmount = roundedTotal;
    }
  }

    setFormData((prev) => ({
      ...prev,
      subtotal: parseFloat(subtotal.toFixed(2)),
      discount: parseFloat(totalDiscount.toFixed(2)),
      totalTax: parseFloat(totalTax.toFixed(2)),
      roundOff: parseFloat(roundOff.toFixed(2)),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
    }));
  };

  // Handle form submission
  const handleSubmit = async (action) => {
    try {
      // Validation
      if (!formData.customerId) {
        toast.error(
          isFromNavbar
            ? "Please search and select a customer first"
            : "Please select a customer"
        );
        return;
      }

      if (!formData.invoiceId) {
        toast.error("Please select an invoice");
        return;
      }

      // Check if any selected items have return quantity > 0
      const validItems = selectedItems.filter(
        (item) => (item.returnQuantity || 0) > 0
      );
      if (validItems.length === 0) {
        toast.error("Please set return quantity for selected items");
        return;
      }

      setLoading(true);

      const creditNoteData = {
        customerId: formData.customerId,
        customerName: formData.customerName,
        phone: formData.phone,
        invoiceId: formData.invoiceId,
        invoiceNumber: formData.invoiceNumber,
        date: formData.date,
        reason: "returned_goods",
        items: validItems.map((item) => ({
          productId: item.productId,
          name: item.name,
          description: item.description || "",
          quantity: item.returnQuantity,
          originalQuantity: item.originalQuantity || item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          taxRate: taxSettings.enableGSTBilling ? item.taxRate : 0,
          taxAmount: item.taxAmount,
           taxType: `GST ${item.taxRate}%`,
          discountPercent: item.discountPercent,
          discountAmount: item.discountAmount,
          total: item.amount,
        })),


        subtotal: formData.subtotal,
        totalTax: formData.totalTax,
        taxSettings: taxSettings,
        totalDiscount: formData.discount,
        shippingCharges: formData.shippingCharges,
        roundOff: formData.roundOff,
        totalAmount: formData.totalAmount,
        status: action === "save" ? "draft" : "issued",
        notes: formData.notes,
        fullyReceived: formData.fullyReceived,
      };

      console.log("Submitting credit note:", creditNoteData);

      const response = await api.post("/api/credit-notes", creditNoteData);

      toast.success(
        `Credit note ${action === "save" ? "saved as draft" : "issued successfully"}`
      );

      // Navigate based on action
      navigate("/skeleton?redirect=/creditnotelist");
    } catch (error) {
      console.error("Submit error:", error);
      toast.error(
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to save credit note"
      );
    } finally {
      setLoading(false);
    }
  };

  // ===== RENDER FUNCTIONS =====

  // Render Available Items Table
  const renderAvailableItemsTable = () => (
    <div className="mb-4">
      <h6 className="section-title">Available for Credit Notes</h6>
      <table className="table po-table mt-3 table-bordered-custom">
        <thead style={{ textAlign: "center" }}>
          <tr>
            <th style={{ width: "70px", position: "relative" }}>Sl No.</th>
            <th style={{ textAlign: "left", position: "relative" }}>Items</th>
            <th style={{ position: "relative" }}>Available Qty</th>
            <th style={{ position: "relative" }}>Unit</th>
            <th style={{ position: "relative" }}>Unit Price</th>
            <th style={{ position: "relative" }}>Tax</th>
            <th style={{ position: "relative" }}>Tax Amount</th>
            <th style={{ position: "relative" }}>Discount</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {availableItems.length > 0 ? (
            availableItems.map((item) => {
              const selectedItem = selectedItems.find(
                (selItem) => selItem.id === item.id
              );
              const isSelected = !!selectedItem;
              const selectedQty = selectedItem ? selectedItem.returnQuantity : 0;
              const remainingQty = Math.max(0, item.quantity - selectedQty);

              return (
                <tr key={item.id}>
                  <td
                    className="numslno"
                    style={{
                      border: "2px solid #1F7FFF",
                      position: "relative",
                      textAlign: "center",
                    }}
                  >
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleSelectItem(item, 1);
                        } else {
                          handleRemoveItem(item.id);
                        }
                      }}
                      style={{
                        cursor: "pointer",
                        width: "18px",
                        height: "18px",
                        margin: "0 10px",
                      }}
                    />
                    {item.id}
                  </td>
                  <td
                    className="itemsno items-cell"
                    style={{ position: "relative" }}
                  >
                    <input
                      type="text"
                      className="form-control supplierinput shadow-none"
                      style={{
                        outline: "none !important",
                        border: "none",
                      }}
                      value={item.name}
                      readOnly
                    />
                  </td>
                  <td style={{ width: "130px" }}>
                    <div
                      style={{
                        height: "40px",
                        padding: "4px 12px",
                        border: "1px solid #A2A8B8",
                        width: "120px",
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <input
                          min="0"
                          max={item.quantity}
                          value={selectedQty}
                          onChange={(e) => {
                            let qty = Number(e.target.value);
                            if (qty < 0) qty = 0;
                            if (qty > item.quantity) qty = item.quantity;

                            if (qty === 0) {
                              handleRemoveItem(item.id);
                            } else if (isSelected) {
                              handleUpdateQuantity(item.id, qty);
                            } else {
                              handleSelectItem(item, qty);
                            }
                          }}
                          type="text"
                          placeholder="0"
                          style={{
                            border: "none",
                            outline: "none",
                            backgroundColor: "transparent",
                            width: "15px",
                          }}
                        />
                        <span
                          style={{
                            paddingRight: "5px",
                            fontSize: "13px",
                            color: "#555",
                            pointerEvents: "none",
                            fontWeight: 500,
                          }}
                        >
                          / {item.quantity}
                        </span>
                      </div>
                      <PiCaretUpDownLight
                        style={{
                          width: "20px",
                          height: "20px",
                          cursor: "pointer",
                        }}
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const clickY = e.clientY - rect.top;
                          const isUp = clickY < rect.height / 2;

                          let qty = isUp ? selectedQty + 1 : selectedQty - 1;
                          if (qty < 0) qty = 0;
                          if (qty > item.quantity) qty = item.quantity;

                          if (qty === 0) {
                            handleRemoveItem(item.id);
                          } else if (isSelected) {
                            handleUpdateQuantity(item.id, qty);
                          } else {
                            handleSelectItem(item, qty);
                          }
                        }}
                      />
                    </div>
                  </td>

                  <td
                    className="items-cell"
                    style={{ width: "100px", position: "relative" }}
                  >
                    <select
                      className="form-select form-select-sm shadow-none"
                      style={{
                        width: "100%",
                        border: "1px solid #A2A8B8",
                        backgroundColor: "white",
                      }}
                      value={item.unit}
                      disabled
                    >
                      <option>{item.unit}</option>
                    </select>
                  </td>
                  <td
                    className="items-cell"
                    style={{ width: "150px", position: "relative" }}
                  >
                    <input
                      type="text"
                      className="form-control shadow-none"
                      style={{
                        border: "1px solid #A2A8B8",
                        backgroundColor: "white",
                      }}
                      value={`₹${item.unitPrice.toFixed(2)}`}
                      readOnly
                    />
                  </td>
                  <td
                    className="items-cell"
                    style={{ width: "150px", position: "relative" }}
                  >
                    <select
                      className="form-select supplierselect shadow-none"
                      style={{
                        border: "1px solid #A2A8B8",
                        backgroundColor: "white",
                      }}
                      value={item.tax}
                      disabled
                    >
                      <option>{item.tax}</option>
                    </select>
                  </td>
                  <td
                    className="items-cell"
                    style={{ width: "130px", position: "relative" }}
                  >
                    <input
                      type="text"
                      placeholder="₹0.00"
                      className="form-control shadow-none"
                      style={{
                        border: "1px solid #A2A8B8",
                        backgroundColor: "#f8f9fa",
                      }}
                      value={`₹${item.taxAmount.toFixed(2)}`}
                      readOnly
                    />
                  </td>
                  <td
                    className="items-cell"
                    style={{ width: "200px", position: "relative" }}
                  >
                    <div
                      className="discount-box"
                      style={{ display: "flex", gap: "10px" }}
                    >
                      <div style={{ position: "relative" }}>
                        <input
                          type="text"
                          className="form-control small shadow-none"
                          style={{
                            paddingRight: "30px",
                            width: "100%",
                            border: "1px solid #A2A8B8",
                            backgroundColor: "white",
                          }}
                          value={`${item.discountPercent}%`}
                          readOnly
                        />
                        <div
                          className="symbol"
                          style={{
                            position: "absolute",
                            right: "0px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            pointerEvents: "none",
                            color: "#555",
                          }}
                        >
                          %{" "}
                        </div>
                      </div>
                      <div style={{ position: "relative" }}>
                        <input
                          type="text"
                          className="form-control small shadow-none"
                          style={{
                            width: "100%",
                            border: "1px solid #A2A8B8",
                            backgroundColor: "white",
                          }}
                          value={`₹${item.discountAmount.toFixed(2)}`}
                          readOnly
                        />
                        <div
                          style={{
                            position: "absolute",
                            right: "0px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            pointerEvents: "none",
                            color: "#555",
                          }}
                          className="symbol"
                        >
                          ₹{" "}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ width: "150px" }}>
                    <input
                      type="text"
                      className="form-control shadow-none"
                      style={{
                        width: "100%",
                        border: "1px solid #A2A8B8",
                        backgroundColor: "#f8f9fa",
                      }}
                      placeholder="₹0.00"
                      value={`₹${item.amount.toFixed(2)}`}
                      readOnly
                    />
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="11" className="text-center text-muted py-3">
                No items available. Please select an invoice to load items.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  // Render Selected Items Table
  const renderSelectedItemsTable = () => (
    <div className="mb-4">
      <h6 className="section-title">Selected for Credit Notes</h6>
      <table className="table po-table mt-3 table-bordered-custom">
        <thead style={{ textAlign: "center" }}>
          <tr>
            <th style={{ width: "70px", position: "relative" }}>Sl No.</th>
            <th style={{ textAlign: "left", position: "relative" }}>Items</th>
            <th style={{ position: "relative" }}>Return Qty</th>
            <th style={{ position: "relative" }}>Unit</th>
            <th style={{ position: "relative" }}>Unit Price</th>
            <th style={{ position: "relative" }}>Tax</th>
            <th style={{ position: "relative" }}>Tax Amount</th>
            <th style={{ position: "relative" }}>Discount</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {selectedItems.length > 0 ? (
            selectedItems.map((item, index) => {
              calculateItemTotal(item);
              return (
                <tr key={item.id}>
                  <td
                    className="numslno"
                    style={{
                      border: "2px solid #1F7FFF",
                      position: "relative",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        justifyContent: "center",
                      }}
                    >
                      <RiDeleteBinLine
                        className="text-danger"
                        style={{
                          cursor: "pointer",
                          fontSize: "16px",
                        }}
                        onClick={() => handleRemoveItem(item.id)}
                        title="Remove item"
                      />
                      {index + 1}
                    </div>
                  </td>
                  <td
                    className="itemsno items-cell"
                    style={{ position: "relative" }}
                  >
                    <input
                      type="text"
                      className="form-control supplierinput shadow-none"
                      style={{
                        outline: "none !important",
                        border: "none",
                      }}
                      value={item.name}
                      readOnly
                    />
                  </td>
                  <td
                    className="items-cell"
                    style={{ width: "100px", position: "relative" }}
                  >
                    <input
                      type="text"
                      className="form-control center shadow-none"
                      style={{
                        width: "100%",
                        border: "1px solid #A2A8B8",
                        backgroundColor: "#f8f9fa",
                      }}
                      value={item.returnQuantity}
                      readOnly
                    />
                  </td>
                  <td
                    className="items-cell"
                    style={{ width: "100px", position: "relative" }}
                  >
                    <select
                      className="form-select form-select-sm shadow-none"
                      style={{
                        width: "100%",
                        border: "1px solid #A2A8B8",
                        backgroundColor: "#f8f9fa",
                      }}
                      value={item.unit}
                      disabled
                    >
                      <option>{item.unit}</option>
                    </select>
                  </td>
                  <td
                    className="items-cell"
                    style={{ width: "150px", position: "relative" }}
                  >
                    <input
                      type="text"
                      className="form-control shadow-none"
                      style={{
                        border: "1px solid #A2A8B8",
                        backgroundColor: "#f8f9fa",
                      }}
                      value={`₹${item.unitPrice.toFixed(2)}`}
                      readOnly
                    />
                  </td>
                  <td
                    className="items-cell"
                    style={{ width: "150px", position: "relative" }}
                  >
                    <input
                      type="text"
                      className="form-control shadow-none"
                      style={{
                        border: "1px solid #A2A8B8",
                        backgroundColor: "#f8f9fa",
                      }}
                      value={item.tax}
                      readOnly
                    />
                  </td>
                  <td
                    className="items-cell"
                    style={{ width: "130px", position: "relative" }}
                  >
                    <input
                      type="text"
                      placeholder="₹0.00"
                      className="form-control shadow-none"
                      style={{
                        border: "1px solid #A2A8B8",
                        backgroundColor: "#f8f9fa",
                      }}
                      value={`₹${item.taxAmount.toFixed(2)}`}
                      readOnly
                    />
                  </td>
                  <td
                    className="items-cell"
                    style={{ width: "200px", position: "relative" }}
                  >
                    <div
                      className="discount-box"
                      style={{ display: "flex", gap: "10px" }}
                    >
                      <div style={{ position: "relative" }}>
                        <input
                          type="text"
                          className="form-control small shadow-none"
                          style={{
                            paddingRight: "30px",
                            width: "100%",
                            border: "1px solid #A2A8B8",
                            backgroundColor: "#f8f9fa",
                          }}
                          value={`${item.discountPercent}%`}
                          readOnly
                        />
                        <div
                          className="symbol"
                          style={{
                            position: "absolute",
                            right: "0px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            pointerEvents: "none",
                            color: "#555",
                          }}
                        >
                          %{" "}
                        </div>
                      </div>
                      <div style={{ position: "relative" }}>
                        <input
                          type="text"
                          className="form-control small shadow-none"
                          style={{
                            width: "100%",
                            border: "1px solid #A2A8B8",
                            backgroundColor: "#f8f9fa",
                          }}
                          value={`₹${item.discountAmount.toFixed(2)}`}
                          readOnly
                        />
                        <div
                          style={{
                            position: "absolute",
                            right: "0px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            pointerEvents: "none",
                            color: "#555",
                          }}
                          className="symbol"
                        >
                          ₹{" "}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ width: "150px" }}>
                    <input
                      type="text"
                      className="form-control shadow-none"
                      style={{
                        width: "100%",
                        border: "1px solid #A2A8B8",
                        backgroundColor: "#f8f9fa",
                      }}
                      value={`₹${item.amount.toFixed(2)}`}
                      readOnly
                    />
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="9" className="text-center text-muted py-3">
                No items selected. Select items using checkboxes and quantity controls above.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="p-4" style={{ overflowY: "auto", height: "100vh" }}>
      <div className="">
        <div className="">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="d-flex align-items-center">
              {/* <Link to="/creditnotelist" style={{ marginRight: "10px" }}> */}
                <span
                onClick={handleBack}
                  style={{
                    backgroundColor: "white",
                    width: "32px",
                    height: "32px",
                    borderRadius: "50px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    border: "1px solid #FCFCFC",
                  }}
                >
                  <img src={total_orders_icon} alt="total_orders_icon" />
                </span>
              {/* </Link> */}
              <h4
                className="m-0"
                style={{
                  fontSize: "22px",
                  color: "#0E101A",
                  fontFamily: '"Inter", sans-serif',
                  fontWeight: 500,
                  lineHeight: "120%",
                }}
              >
                Create Credit Notes
              </h4>
            </div>

            <button
              style={{
                fontFamily: '"Inter", sans-serif',
                fontWeight: 500,
                fontSize: "15px",
                lineHeight: "120%",
                color: "#FFFFFF",
                backgroundColor: "#1F7FFF",
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid #1F7FFF",
              }}
              onClick={() => setShowPreview(true)}
              disabled={!formData.customerId || selectedItems.length === 0}
            >
              View Invoice
            </button>
          </div>

          {/* Customer Section */}
          <div
            className="section-card"
            style={{ padding: "20px", overflow: "auto", maxHeight: "calc(100vh - 160px)" }}
          >
            <h6 className="section-title">Customer Details</h6>

            {/* Main Horizontal Wrapper */}
            <div className="d-flex justify-content-between mb-4">
              {/* LEFT AREA (Customer + Phone) */}
              <div
                style={{ display: "flex", alignItems: "center", gap: "20px" }}
              >

               {/* Customer Name */}
{/* Customer Name */}
<div className="col-md-7">
  <label className="form-label supplierlabel">
    Customer Name <span className="text-danger">*</span>
  </label>
  <div
    className="customer-search-container"
    style={{ position: "relative" }}
  >
    <input
      type="text"
      className="form-control supplierinput shadow-none"
      placeholder={
        isFromNavbar
          ? "Search and select customer"
          : location.state?.customer
          ? "Customer loaded from customer page"
          : "Customer"
      }
      style={{
        border: "1px solid #A2A8B8",
        backgroundColor: isFromNavbar ? "#fff" : "#f8f9fa",
        cursor: isFromNavbar ? "text" : "default",
        paddingRight: isFromNavbar ? "40px" : "10px",
        width: "100%",
        boxSizing: "border-box",
      }}
      value={
        isFromNavbar ? customerSearch : formData.customerName
      }
      readOnly={!isFromNavbar}
      onChange={(e) => {
        if (isFromNavbar) {
          setCustomerSearch(e.target.value);
          handleCustomerSearch(e.target.value);
        }
      }}
      onFocus={() => {
        if (isFromNavbar && customers.length === 0) {
          fetchCustomers();
        }
        if (isFromNavbar) {
          setShowCustomerDropdown(true);
        }
      }}
    />

    {/* ONLY FOR NON-ID ROUTE (isFromNavbar) */}
    {isFromNavbar && (
      <div
        style={{
          position: "absolute",
          right: "10px",
          top: "50%",
          transform: "translateY(-50%)",
        }}
      >
        {/* Show search icon when no customer selected */}
        {!formData.customerId && (
          <FiSearch
            style={{
              color: "#666",
              pointerEvents: "none",
            }}
          />
        )}

        {/* Show cross icon when customer is selected */}
        {formData.customerId && (
          <IoClose
            style={{
              color: "#666",
              cursor: "pointer",
              fontSize: "20px",
              padding: "2px",
              borderRadius: "50%",
              backgroundColor: "#f0f0f0",
              transition: "all 0.2s",
            }}
            onClick={() => {
              // Clear customer and reset form for non-ID route
              setFormData((prev) => ({
                ...prev,
                customerId: "",
                customerName: "",
                phone: "",
                invoiceId: "",
                invoiceNumber: "",
                subtotal: 0,
                discount: 0,
                totalAmount: 0,
              }));
              setCustomerSearch("");
              setAvailableItems([]);
              setSelectedItems([]);
              setCustomerInvoices([]);
              setShowCustomerDropdown(true);

              // Focus back on the input
              setTimeout(() => {
                const input = document.querySelector(
                  ".customer-search-container input",
                );
                if (input) input.focus();
              }, 100);
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#e0e0e0";
              e.currentTarget.style.color = "#ff4444";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#f0f0f0";
              e.currentTarget.style.color = "#666";
            }}
            title="Clear customer and search another"
          />
        )}
      </div>
    )}

    {/* Customer Dropdown (only in non-ID route) */}
    {isFromNavbar && showCustomerDropdown && (
      <div
        style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          marginTop: "2px",
          backgroundColor: "#FFFFFF",
          borderRadius: "8px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          border: "1px solid #E5E7EB",
          overflow: "hidden",
          zIndex: 1000,
          maxHeight: "300px",
          overflowY: "auto",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {loading ? (
          <div className="p-3 text-center text-muted">
            Loading customers...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-3 text-center text-muted">
            {customerSearch.trim()
              ? "No customers found"
              : "Type to search customers"}
          </div>
        ) : (
          filteredCustomers.map((customer) => (
            <div
              key={customer._id}
              className="customer-dropdown-item"
              style={{
                padding: "12px 16px",
                cursor: "pointer",
                borderBottom: "1px solid #f0f0f0",
                transition: "background-color 0.2s",
              }}
              onClick={() => {
                handleCustomerSelect(customer);
                setCustomerSearch(
                  customer.name || customer.customerName || "",
                );
                setShowCustomerDropdown(false);
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor =
                  "#f5f5f5")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "white")
              }
            >
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div
                    style={{ fontWeight: "500", color: "#333" }}
                  >
                    {customer.name || customer.customerName || ""}
                  </div>
                  <div
                    style={{ fontSize: "12px", color: "#666" }}
                  >
                    {customer.phone || customer.mobile || "No phone"}
                  </div>
                </div>
                <small
                  style={{ color: "#888", fontSize: "12px" }}
                >
                  {customer.email || ""}
                </small>
              </div>
            </div>
          ))
        )}
      </div>
    )}
  </div>
</div>

                {/* Phone Number */}
                <div className="col-md-7">
                  <label className="form-label supplierlabel">Phone No.</label>

                  <div className="input-group">
                    <span
                      className="input-group-text bg-white"
                      style={{ border: "1px solid #A2A8B8" }}
                    >
                      <img
                        src="https://flagcdn.com/in.svg"
                        alt="India"
                        width="20"
                        className="me-1"
                      />
                      +91
                    </span>

                    <input
                      type="tel"
                      className="form-control supplierinput shadow-none"
                      placeholder="Enter Phone"
                      style={{
                        border: "1px solid #A2A8B8",
                      }}
                      value={formData.phone}
                      readOnly
                    />
                  </div>
                </div>
              </div>
              {/* LEFT END */}

              {/* middle line */}
              <div
                style={{
                  width: "1px",
                  height: "70px",
                  backgroundColor: "#E0E0E0",
                  margin: "0 20px",
                }}
              ></div>

              {/* RIGHT SIDE (Customer Invoice No + Date) */}
              <div className="d-flex flex-column gap-3">
                {/* Customer Invoice No */}
                <div className="d-flex justify-content-end">
                  {/* customer invoice selector start*/}
                  <div ref={dropdownRef} style={{ position: "relative", width: "100%" }}>
                    <div
                      onClick={() => setIsInvoiceOpen(!isInvoiceOpen)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "10px 14px",
                        border: "1px solid #D1D5DB",
                        borderRadius: "12px",
                        backgroundColor: "#FFFFFF",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontFamily: '"Inter", sans-serif',
                        color: "#374151",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                        transition: "all 0.2s",
                        height: "37px",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)")
                      }
                    >
                      <span style={{ flex: 1 }}>
                        {formData.invoiceNumber || "Customer Invoice No"}
                      </span>

                      <span style={{ fontSize: "12px", color: "#9CA3AF" }}>
                        <IoChevronDownOutline />
                      </span>
                    </div>
                    {isInvoiceOpen && (
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          marginTop: "8px",
                          backgroundColor: "#FFFFFF",
                          borderRadius: "12px",
                          boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                          border: "1px solid #E5E7EB",
                          overflow: "hidden",
                          zIndex: 9999,
                          animation: "fadeIn 0.2s ease-out",
                          maxHeight: "240px",
                          overflowY: "auto",
                          scrollbarWidth: "none",
                          msOverflowStyle: "none",
                        }}
                      >
                        {customerInvoices.map((invoice) => (
                          <div
                            key={invoice._id}
                            onClick={() => {
                              handleInvoiceSelect(invoice);
                              setIsInvoiceOpen(false);
                            }}
                            style={{
                              padding: "12px 16px",
                              fontSize: "12px",
                              fontFamily: '"Inter", sans-serif',
                              cursor: "pointer",
                              color:
                                formData.invoiceId === invoice._id
                                  ? "#0E101A"
                                  : "#374151",
                              fontWeight:
                                formData.invoiceId === invoice._id ? "600" : "500",
                              backgroundColor:
                                formData.invoiceId === invoice._id
                                  ? "#e5f0ff"
                                  : "transparent",
                              transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.backgroundColor = "#e5f0ff")
                            }
                            onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              formData.invoiceId === invoice._id
                                ? "#e5f0ff"
                                : "transparent")
                            }
                          >
                            {invoice.invoiceNo}
                            {invoice.dueAmount > 0 &&
                              ` — Due ₹${invoice.dueAmount.toFixed(2)}`}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Date */}
                <div className="d-flex justify-content-end gap-2">
                  <div className="" style={{ marginLeft: "-10px" }}>
                    <DatePicker
                      padding="6px 10px"
                      value={formData.date}
                      onChange={(selectedDate) =>
                        setFormData((prev) => ({
                          ...prev,
                          date: selectedDate,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
              {/* RIGHT END */}
            </div>

            {/* Available Items Table */}
            {renderAvailableItemsTable()}

            {/* Selected Items Table */}
            {renderSelectedItemsTable()}

            {/* Payment + Summary */}
            <div className="row">
              {/* Payment Left */}
              <div className="col-md-7">
                <div className="">
                  <h6 className="section-title" style={{ color: "#0E101A" }}>
                    Payment Details
                  </h6>
                  <div className="mt-3">
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Add any notes or payment details..."
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Summary Right */}
              <div className="col-md-5">
                <div className="p-4">
                  <div className="summary-line">
                    <span
                      style={{
                        color: "#0E101A",
                        fontWeight: 400,
                        fontSize: "16px",
                        lineHeight: "120%",
                        fontFamily: 'Inter", sans-serif',
                      }}
                    >
                      Subtotal (with GST):
                    </span>
                    <span
                      style={{
                        color: "#0E101A",
                        fontWeight: 400,
                        fontSize: "16px",
                        lineHeight: "120%",
                        fontFamily: 'Inter", sans-serif',
                      }}
                    >
                      ₹{formData.subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="summary-line">
                    <span
                      style={{
                        color: "#727681",
                        fontWeight: 400,
                        fontSize: "16px",
                        lineHeight: "120%",
                        fontFamily: 'Inter", sans-serif',
                      }}
                    >
                      Discount:
                    </span>
                    <span
                      style={{
                        color: "#727681",
                        fontWeight: 400,
                        fontSize: "16px",
                        lineHeight: "120%",
                        fontFamily: 'Inter", sans-serif',
                      }}
                    >
                      ₹{formData.discount.toFixed(2)}
                    </span>
                  </div>
                  <div className="summary-line">
                    <span
                      style={{
                        color: "#727681",
                        fontWeight: 400,
                        fontSize: "16px",
                        lineHeight: "120%",
                        fontFamily: 'Inter", sans-serif',
                      }}
                    >
                      Shipping Charges:
                    </span>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span>₹</span>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        style={{ width: "80px", padding: "2px 8px" }}
                        value={formData.shippingCharges}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            shippingCharges: parseFloat(e.target.value) || 0,
                          }))
                        }
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className="summary-line">
                    <span>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={formData.autoRoundOff}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            autoRoundOff: e.target.checked,
                          }))
                        }
                      />
                      <span
                        style={{
                          color: "#0E101A",
                          fontWeight: 400,
                          fontSize: "16px",
                          lineHeight: "120%",
                          fontFamily: 'Inter", sans-serif',
                          marginLeft: "10px",
                        }}
                      >
                        Auto Round-off
                      </span>
                    </span>
                    <span
                      style={{
                        color: "#0E101A",
                        fontWeight: 400,
                        fontSize: "16px",
                        lineHeight: "120%",
                        fontFamily: 'Inter", sans-serif',
                      }}
                    >
                      {formData.roundOff >= 0 ? "+" : "-"}₹
                      {Math.abs(formData.roundOff).toFixed(2)}
                    </span>
                  </div>
                  <hr style={{ color: "#727681" }} />
                  <div className="summary-line">
                    <h5
                      style={{
                        color: "#0E101A",
                        lineHeight: "120%",
                        fontFamily: 'Inter", sans-serif',
                      }}
                    >
                      Total Credit Amount :-
                    </h5>
                    <h4
                      style={{
                        color: "#0E101A",
                        fontWeight: 500,
                        fontSize: "16px",
                        lineHeight: "120%",
                        fontFamily: 'Inter", sans-serif',
                      }}
                    >
                      ₹{formData.totalAmount.toFixed(2)}
                    </h4>
                  </div>

                  <div className="form-check mb-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={formData.fullyReceived}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          fullyReceived: e.target.checked,
                        }))
                      }
                    />
                    <label
                      className="form-check-label"
                      style={{
                        color: "#727681",
                        fontWeight: 400,
                        fontSize: "16px",
                      }}
                    >
                      Fully Settled
                    </label>
                  </div>

                  {/* Buttons */}
                  <div className="d-flex justify-content-end gap-2 mt-3">
                    <button
                      className="btn btn-outline-primary"
                      style={{
                        fontWeight: 500,
                        padding: "10px",
                        fontSize: "14px",
                        lineHeight: "120%",
                        fontFamily: '"Inter" sans-serif',
                        border: "1px solid #1F7FFF",
                        boxShadow: "rgba(0, 0, 0, 0.25)",
                      }}
                      onClick={() => handleSubmit("save")}
                      disabled={
                        loading ||
                        !formData.customerId ||
                        !formData.invoiceId ||
                        selectedItems.filter(
                          (item) => (item.returnQuantity || 0) > 0
                        ).length === 0
                      }
                    >
                      {loading ? "Saving..." : "Save"}
                    </button>
                    <button
                      className="btn btn-primary"
                      style={{
                        padding: "10px",
                        color: "#FFFFFF",
                        fontWeight: 500,
                        fontSize: "14px",
                        lineHeight: "120%",
                        fontFamily: '"Inter" sans-serif',
                        boxShadow: "rgba(0, 0, 0, 0.25)",
                      }}
                      onClick={() => handleSubmit("saveAndPrint")}
                      disabled={
                        loading ||
                        !formData.customerId ||
                        !formData.invoiceId ||
                        selectedItems.filter(
                          (item) => (item.returnQuantity || 0) > 0
                        ).length === 0
                      }
                    >
                      {loading ? "Saving..." : "Save & Print"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <InvoicePreviewModal
            isOpen={showPreview}
            onClose={() => setShowPreview(false)}
            data={formData}
            type="credit-note"
          />
        </div>
      </div>
    </div>
  );
};

export default CustomerCreditNote;
