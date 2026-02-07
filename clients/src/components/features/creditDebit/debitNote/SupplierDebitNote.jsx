import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import DatePicker from "../../../layouts/DatePicker";
import total_orders_icon from "../../../../assets/images/totalorders-icon.png";
import api from "../../../../pages/config/axiosInstance";
import { toast } from "react-toastify";
import { IoChevronDownOutline } from "react-icons/io5";
import { RiArrowDropDownLine, RiDeleteBinLine } from "react-icons/ri";
import { FaCheckSquare, FaSquare } from "react-icons/fa";
import { PiCaretUpDownLight } from "react-icons/pi";
import { FiSearch } from "react-icons/fi";
import { IoClose } from "react-icons/io5";

const SupplierDebitNote = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { supplierId } = useParams();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [supplierInvoices, setSupplierInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [availableItems, setAvailableItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  // for  navbar create debit nte
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  // Determine where we're coming from
  const isFromPurchase = location.state?.type === "purchase";
  const isFromSupplier = location.state?.type === "supplier";
  const isFromNavbar =
    !supplierId &&
    !location.state?.supplier &&
    !isFromPurchase &&
    !isFromSupplier;

  // Form state
  const [formData, setFormData] = useState({
    supplierId: "",
    supplierName: "",
    phone: "",
    invoiceId: "",
    invoiceNumber: "",
    date: new Date().toISOString().split("T")[0],
    subtotal: 0,
    discount: 0,
    shippingCharges: 0,
    autoRoundOff: false,
    roundOff: 0,
    totalAmount: 0,
    fullyReceived: false,
    notes: "",
  });

  // Main useEffect
  useEffect(() => {
    console.log("Loading with state:", {
      isFromPurchase,
      isFromSupplier,
      supplierId,
      invoice: location.state?.invoice,
      supplierInInvoice: location.state?.invoice?.supplierId,
    });

    if (isFromSupplier && supplierId) {
      fetchSupplierFromId(supplierId);
    } else if (isFromPurchase && location.state?.invoice) {
      const invoice = location.state.invoice;
      console.log("Loading from purchase:", {
        invoice,
        supplierId: invoice.supplierId,
        type: typeof invoice.supplierId,
      });

      // First, try to load invoice immediately
      handleInvoiceSelect(invoice);

      // Then handle supplier
      if (invoice.supplierId) {
        if (typeof invoice.supplierId === "object" && invoice.supplierId._id) {
          // console.log(
          //   "Using supplier from invoice object:",
          //   invoice.supplierId,
          // );
          handleSupplierSelect(invoice.supplierId);
        } else if (typeof invoice.supplierId === "string") {
          // console.log("Fetching supplier by ID:", invoice.supplierId);
          fetchSupplierFromId(invoice.supplierId).catch((err) => {
            console.warn("Supplier fetch failed, using invoice data:", err);
            if (invoice.supplierName) {
              handleSupplierSelect({
                _id: invoice.supplierId,
                supplierName: invoice.supplierName,
                name: invoice.supplierName,
                phone: "",
              });
            }
          });
        }
      } else if (invoice.supplierName) {
        // console.log("Using supplier name from invoice:", invoice.supplierName);
        handleSupplierSelect({
          _id: "temp_" + Date.now(),
          supplierName: invoice.supplierName,
          name: invoice.supplierName,
          phone: "",
        });
      } else {
        toast.error("Invoice has no supplier information");
      }
    } else if (location.state?.supplier) {
      handleSupplierSelect(location.state.supplier);
    } else if (supplierId) {
      fetchSupplierFromId(supplierId);
    }
  }, [supplierId, location.state]);

  // When supplierId from URL params changes, fetch supplier details
  useEffect(() => {
    if (supplierId) {
      fetchSupplierFromId(supplierId);
    }
  }, [supplierId]);

  // Also check if supplier passed from navigation (as backup)
  useEffect(() => {
    if (location.state?.supplier) {
      handleSupplierSelect(location.state.supplier);
    }
  }, [location.state]);

  useEffect(() => {
    if (isFromNavbar) {
      fetchAllSuppliers();
    }
  }, []);

  const fetchAllSuppliers = async () => {
    try {
      setLoadingSuppliers(true);
      const response = await api.get("/api/suppliers");

      let suppliersData = [];
      if (Array.isArray(response.data)) {
        suppliersData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        suppliersData = response.data.data;
      } else if (
        response.data?.suppliers &&
        Array.isArray(response.data.suppliers)
      ) {
        suppliersData = response.data.suppliers;
      }

      setSuppliers(suppliersData);
      setFilteredSuppliers(suppliersData);
    } catch (error) {
      console.error("Failed to load suppliers:", error);
      toast.error("Failed to load suppliers");
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const handleSupplierSearch = (searchTerm) => {
    setSupplierSearch(searchTerm);
    setShowSupplierDropdown(true);

    if (!searchTerm.trim()) {
      setFilteredSuppliers(suppliers);
      return;
    }

    const filtered = suppliers.filter((supplier) => {
      const name =
        supplier.supplierName || supplier.name || supplier.company || "";
      const phone = supplier.phone || supplier.mobile || "";
      const searchLower = searchTerm.toLowerCase();

      return (
        name.toLowerCase().includes(searchLower) || phone.includes(searchTerm)
      );
    });

    setFilteredSuppliers(filtered);
  };

  // Fetch supplier invoices when supplier changes
  useEffect(() => {
    if (formData.supplierId) {
      fetchSupplierInvoices(formData.supplierId);
    } else {
      setSupplierInvoices([]);
      setFormData((prev) => ({
        ...prev,
        invoiceId: "",
        invoiceNumber: "",
      }));
      setAvailableItems([]);
      setSelectedItems([]);
    }
  }, [formData.supplierId]);

  // Recalculate totals when selected items or other values change
  useEffect(() => {
    calculateTotals();
  }, [selectedItems, formData.shippingCharges, formData.autoRoundOff]);

  const fetchSupplierFromId = async (id) => {
    try {
      if (!id) {
        toast.error("No supplier ID provided");
        return;
      }

      setLoading(true);
      const response = await api.get(`/api/suppliers/${id}`);

      if (!response.data) {
        toast.error("Supplier not found or invalid response");
        return;
      }

      const supplier = response.data.supplier || response.data;

      if (supplier) {
        handleSupplierSelect(supplier);
        if (!isFromPurchase) {
          fetchSupplierInvoices(supplier._id);
        }
      } else {
        toast.error("Supplier data is empty");
      }
    } catch (error) {
      console.error("Failed to fetch supplier:", error);
      if (!isFromPurchase) {
        toast.error("Failed to load supplier details");
      } else {
        console.warn("Supplier not found, but continuing with invoice data...");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get("/api/products");
      let productsData = [];
      if (Array.isArray(response.data)) {
        productsData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        productsData = response.data.data;
      } else if (
        response.data?.products &&
        Array.isArray(response.data.products)
      ) {
        productsData = response.data.products;
      }
      setProducts(productsData);
    } catch (error) {
      console.error("Failed to load products:", error);
      toast.error("Failed to load products");
    }
  };

  const fetchSupplierInvoices = async (supplierId) => {
    try {
      setLoadingInvoices(true);
      const response = await api.get(
        `/api/purchase-orders?supplierId=${supplierId}`,
      );

      let invoicesData = [];

      if (response.data && Array.isArray(response.data)) {
        invoicesData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        invoicesData = response.data.data;
      } else if (
        response.data?.purchaseOrders &&
        Array.isArray(response.data.purchaseOrders)
      ) {
        invoicesData = response.data.purchaseOrders;
      } else if (
        response.data?.invoices &&
        Array.isArray(response.data.invoices)
      ) {
        invoicesData = response.data.invoices;
      }

      const filteredInvoices = invoicesData.filter(
        (invoice) =>
          invoice.status !== "cancelled" && invoice.status !== "draft",
      );

      setSupplierInvoices(filteredInvoices);
    } catch (error) {
      console.error("Failed to load purchase orders:", error);
      try {
        const altResponse = await api.get(
          `/api/purchase-orders/supplier/${supplierId}`,
        );
        if (altResponse.data) {
          let altData = [];
          if (Array.isArray(altResponse.data)) {
            altData = altResponse.data;
          } else if (altResponse.data.data) {
            altData = altResponse.data.data;
          }
          setSupplierInvoices(altData);
        }
      } catch (secondError) {
        console.error("Alternative endpoint also failed:", secondError);
        setSupplierInvoices([]);
      }
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleSupplierSelect = (supplier) => {
    if (!supplier) {
      console.warn("handleSupplierSelect called with null/undefined supplier");
      return;
    }

    const supplierData = {
      _id: supplier._id || supplier.id || "unknown",
      supplierName:
        supplier.supplierName ||
        supplier.name ||
        supplier.company ||
        "Unknown Supplier",
      phone: supplier.phone || supplier.mobile || supplier.contactNumber || "",
    };

    setFormData((prev) => ({
      ...prev,
      supplierId: supplierData._id,
      supplierName: supplierData.supplierName,
      phone: supplierData.phone,
      invoiceId: "",
      invoiceNumber: "",
    }));

    // Clear items when supplier changes
    setAvailableItems([]);
    setSelectedItems([]);

    if (isFromNavbar) {
      setSupplierSearch(supplierData.supplierName || "");
      setShowSupplierDropdown(false);
    }
  };

  const handleInvoiceSelect = async (invoice) => {
    try {
      let invoiceDetails = invoice;

      if (typeof invoice === "string" || (invoice._id && !invoice.items)) {
        const invoiceResponse = await api.get(
          `/api/purchase-orders/${invoice._id || invoice}`,
        );
        if (invoiceResponse.data?.purchaseOrder) {
          invoiceDetails = invoiceResponse.data.purchaseOrder;
        } else if (invoiceResponse.data?.invoice) {
          invoiceDetails = invoiceResponse.data.invoice;
        } else {
          invoiceDetails = invoiceResponse.data;
        }
      }

      if (!invoiceDetails || !invoiceDetails.items) {
        toast.error("Could not load invoice items");
        return;
      }

      // Map purchase order items to debit note items
      const itemsFromInvoice = await Promise.all(
        invoiceDetails.items.map(async (item, index) => {
          let productName = item.itemName || item.name || "Product";

          if (item.productId && !item.itemName && !item.name) {
            try {
              const productResponse = await api.get(
                `/api/products/${item.productId}`,
              );
              if (productResponse.data) {
                const product =
                  productResponse.data.product || productResponse.data;
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
        }),
      );

      // Set all items as available initially
      setAvailableItems(itemsFromInvoice);
      setSelectedItems([]);

      setFormData((prev) => ({
        ...prev,
        invoiceId: invoiceDetails._id,
        invoiceNumber:
          invoiceDetails.invoiceNo || invoiceDetails.invoiceNumber || "",
      }));

      // toast.success(`Loaded ${itemsFromInvoice.length} items from invoice`);
    } catch (error) {
      console.error("Failed to load invoice details:", error);
      toast.error("Failed to load invoice details");
    }
  };

  // Toggle item selection between available and selected
  // Toggle item selection between available and selected - PARTIAL SELECTION
  const toggleItemSelection = (item, fromAvailable = true) => {
    if (fromAvailable) {
      // Moving from available to selected - PARTIAL SELECTION
      const updatedAvailable = [...availableItems];
      const itemIndex = updatedAvailable.findIndex(
        (avItem) => avItem.id === item.id,
      );

      if (itemIndex !== -1) {
        // Create a selected item copy
        const itemToSelect = {
          ...item,
          isSelected: true,
          returnQuantity: 1, // Start with 1 quantity by default
          originalQuantity: item.quantity, // Store original total
          // Note: We're NOT removing from available yet
        };

        setSelectedItems([...selectedItems, itemToSelect]);
      }
    } else {
      // Moving from selected back to available
      const updatedSelected = selectedItems.filter(
        (selectedItem) => selectedItem.id !== item.id,
      );
      setSelectedItems(updatedSelected);
    }
  };

  // Handle partial quantity selection
  const handlePartialSelection = (item, returnQuantity) => {
    // Remove from available items if user is taking some quantity
    const updatedAvailable = availableItems
      .map((avItem) => {
        if (avItem.id === item.id) {
          return {
            ...avItem,
            quantity: Math.max(0, avItem.quantity - returnQuantity), // Reduce available quantity
          };
        }
        return avItem;
      })
      .filter((avItem) => avItem.quantity > 0); // Remove if quantity becomes 0

    // Add to selected items
    const itemToSelect = {
      ...item,
      isSelected: true,
      returnQuantity: returnQuantity,
      originalQuantity: item.quantity, // Store original total
    };

    setAvailableItems(updatedAvailable);
    setSelectedItems([...selectedItems, itemToSelect]);
  };

  // Handle selecting an item with quantity
  const handleSelectItem = (item, quantity) => {
    if (quantity <= 0) return;

    const maxAllowed = item.quantity;
    const actualQty = Math.min(quantity, maxAllowed);

    // Check if already selected
    const existingIndex = selectedItems.findIndex(
      (selItem) => selItem.id === item.id,
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
        : selItem,
    );

    setSelectedItems(updatedSelected);
  };

  // Remove item from selected
  const handleRemoveItem = (itemId) => {
    const updatedSelected = selectedItems.filter(
      (selItem) => selItem.id !== itemId,
    );
    setSelectedItems(updatedSelected);
  };

  // Handle return quantity change in selected items
  const handleReturnQuantityChange = (itemId, value) => {
    const parsedValue = parseInt(value) || 0;
    const updatedSelected = selectedItems.map((item) => {
      if (item.id === itemId) {
        const maxQuantity = item.originalQuantity || item.quantity;
        const returnQuantity = Math.min(Math.max(0, parsedValue), maxQuantity);
        const updatedItem = {
          ...item,
          returnQuantity,
        };
        calculateItemTotal(updatedItem);
        return updatedItem;
      }
      return item;
    });
    setSelectedItems(updatedSelected);
  };

  // Handle item field change in selected items
  const handleSelectedItemChange = (itemId, field, value) => {
    const updatedSelected = selectedItems.map((item) => {
      if (item.id === itemId) {
        const updatedItem = {
          ...item,
          [field]: field === "unit" ? value : parseFloat(value) || 0,
        };
        calculateItemTotal(updatedItem);
        return updatedItem;
      }
      return item;
    });
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
    const taxAmount = taxableAmount * ((item.taxRate || 0) / 100);
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

    let totalAmount =
      subtotal + totalTax - totalDiscount + (formData.shippingCharges || 0);

    let roundOff = 0;
    if (formData.autoRoundOff) {
      roundOff = Math.round(totalAmount) - totalAmount;
      totalAmount = Math.round(totalAmount);
    }

    setFormData((prev) => ({
      ...prev,
      subtotal: parseFloat(subtotal.toFixed(2)),
      discount: parseFloat(totalDiscount.toFixed(2)),
      roundOff: parseFloat(roundOff.toFixed(2)),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
    }));
  };

  // Handle form submission
  const handleSubmit = async (action) => {
    try {
      // Validation
      if (!formData.supplierId) {
        toast.error(
          isFromNavbar
            ? "Please search and select a supplier first"
            : "Please select a supplier",
        );
        return;
      }

      if (!formData.invoiceId) {
        toast.error("Please select an invoice");
        return;
      }

      // Check if any selected items have return quantity > 0
      const validItems = selectedItems.filter(
        (item) => (item.returnQuantity || 0) > 0,
      );
      if (validItems.length === 0) {
        toast.error("Please set return quantity for selected items");
        return;
      }

      setLoading(true);

      const debitNoteData = {
        supplierId: formData.supplierId,
        supplierName: formData.supplierName,
        phone: formData.phone,
        invoiceId: formData.invoiceId,
        supplierInvoiceNo: formData.invoiceNumber,
        date: formData.date,
        reason: "defective_goods",
        items: validItems.map((item) => ({
          productId: item.productId,
          name: item.name,
          description: item.description || "",
          quantity: item.returnQuantity,
          originalQuantity: item.originalQuantity || item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          taxAmount: item.taxAmount,
          discountPercent: item.discountPercent,
          discountAmount: item.discountAmount,
          total: item.amount,
        })),
        subtotal: formData.subtotal,
        totalDiscount: formData.discount,
        additionalCharges: formData.shippingCharges,
        roundOff: formData.roundOff,
        totalAmount: formData.totalAmount,
        status: action === "save" ? "draft" : "issued",
        notes: formData.notes,
        fullyReceived: formData.fullyReceived,
      };

      // console.log("Submitting debit note:", debitNoteData);

      const response = await api.post(
        "/api/supplier-debit-notes",
        debitNoteData,
      );

      toast.success(
        `Debit note ${action === "save" ? "saved as draft" : "issued successfully"}`,
      );

      // Navigate based on action
      navigate("/skeleton?redirect=/debit-note");
    } catch (error) {
      console.error("Submit error:", error);
      toast.error(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to save debit note",
      );
    } finally {
      setLoading(false);
    }
  };

  // Render Available Items Table with checkbox and number input spinner
  const renderAvailableItemsTable = () => (
    <div className="mb-4">
      <h6 className="section-title">Available for Debit Notes</h6>
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
                (selItem) => selItem.id === item.id,
              );
              const isSelected = !!selectedItem;
              const selectedQty = selectedItem
                ? selectedItem.returnQuantity
                : 0;

              // Calculate remaining available quantity
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
                          // Checkbox checked - select with quantity 1
                          handleSelectItem(item, 1);
                        } else {
                          // Checkbox unchecked - remove from selected
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
      <h6 className="section-title">Selected for Debit Notes</h6>
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
            selectedItems.map((item, index) => (
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
            ))
          ) : (
            <tr>
              <td colSpan="9" className="text-center text-muted py-3">
                No items selected. Select items using checkboxes and quantity
                controls above.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  // Handle click outside for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsInvoiceOpen(false);
      }
      if (
        showSupplierDropdown &&
        !event.target.closest(".supplier-search-container")
      ) {
        setShowSupplierDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSupplierDropdown]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showSupplierDropdown &&
        !event.target.closest(".supplier-search-container")
      ) {
        setShowSupplierDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSupplierDropdown]);

  return (
    <div>
      <div className="p-4" style={{ height: "100vh", overflow: "auto" }}>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center">
            <Link
              to={
                location.state?.from === "/purchase-list"
                  ? "/purchase-list"
                  : location.state?.from === "/supplier-list"
                    ? "/supplier-list"
                    : "/dashboard"
              }
              style={{ marginRight: "10px" }}
            >
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
                }}
              >
                <img src={total_orders_icon} alt="total_orders_icon" />
              </span>
            </Link>
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
              Create Debit Notes
            </h4>
          </div>
        </div>

        {/* Supplier Details Section */}
        <div
          className="section-card"
          style={{
            padding: "20px",
            height: "auto",
            overflow: "auto",
            maxHeight: "calc(100vh - 160px)",
          }}
        >
          <h6 className="section-title">Supplier Details</h6>

          <div className="d-flex justify-content-between mb-4">
            {/* LEFT AREA (Supplier + Phone) */}
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <div className="col-md-7">
                <label className="form-label supplierlabel">
                  Supplier Name <span className="text-danger">*</span>
                </label>
                <div
                  className="supplier-search-container"
                  style={{ position: "relative" }}
                >
                  <input
                    type="text"
                    className="form-control supplierinput shadow-none"
                    placeholder={
                      isFromPurchase
                        ? "Supplier loaded from purchase order"
                        : isFromSupplier
                          ? "Supplier loaded from supplier page"
                          : isFromNavbar
                            ? "Search and select supplier"
                            : "Supplier"
                    }
                    style={{
                      border: "1px solid #A2A8B8",
                      backgroundColor: isFromNavbar ? "#fff" : "#f8f9fa",
                      cursor: isFromNavbar ? "text" : "default",
                      paddingRight: isFromNavbar ? "40px" : "10px", // Only extra padding for icon
                      width: "100%", // Takes full width of parent
                      boxSizing: "border-box", // Important: includes padding in width calculation
                    }}
                    value={
                      isFromNavbar ? supplierSearch : formData.supplierName
                    }
                    readOnly={!isFromNavbar}
                    onChange={(e) => {
                      if (isFromNavbar) {
                        handleSupplierSearch(e.target.value);
                      }
                    }}
                    onFocus={() => {
                      if (isFromNavbar && suppliers.length === 0) {
                        fetchAllSuppliers();
                      }
                      if (isFromNavbar) {
                        setShowSupplierDropdown(true);
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
                      {/* Show search icon when no supplier selected */}
                      {!formData.supplierId && (
                        <FiSearch
                          style={{
                            color: "#666",
                            pointerEvents: "none",
                          }}
                        />
                      )}

                      {/* Show cross icon when supplier is selected */}
                      {formData.supplierId && (
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
                            // Clear supplier and reset form for non-ID route
                            setFormData((prev) => ({
                              ...prev,
                              supplierId: "",
                              supplierName: "",
                              phone: "",
                              invoiceId: "",
                              invoiceNumber: "",
                              subtotal: 0,
                              discount: 0,
                              totalAmount: 0,
                            }));
                            setSupplierSearch("");
                            setAvailableItems([]);
                            setSelectedItems([]);
                            setSupplierInvoices([]);
                            setShowSupplierDropdown(true);

                            // Focus back on the input
                            setTimeout(() => {
                              const input = document.querySelector(
                                ".supplier-search-container input",
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
                          title="Clear supplier and search another"
                        />
                      )}
                    </div>
                  )}

                  {/* Supplier Dropdown (only in non-ID route) */}
                  {isFromNavbar && showSupplierDropdown && (
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
                        width: "100%", // Match input width
                        boxSizing: "border-box", // Same as input
                      }}
                    >
                      {loadingSuppliers ? (
                        <div className="p-3 text-center text-muted">
                          Loading suppliers...
                        </div>
                      ) : filteredSuppliers.length === 0 ? (
                        <div className="p-3 text-center text-muted">
                          {supplierSearch.trim()
                            ? "No suppliers found"
                            : "Type to search suppliers"}
                        </div>
                      ) : (
                        filteredSuppliers.map((supplier) => (
                          <div
                            key={supplier._id}
                            className="supplier-dropdown-item"
                            style={{
                              padding: "12px 16px",
                              cursor: "pointer",
                              borderBottom: "1px solid #f0f0f0",
                              transition: "background-color 0.2s",
                            }}
                            onClick={() => {
                              handleSupplierSelect(supplier);
                              setSupplierSearch(
                                supplier.supplierName || supplier.name || "",
                              );
                              setShowSupplierDropdown(false);
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
                                  {supplier.supplierName ||
                                    supplier.name ||
                                    supplier.company}
                                </div>
                                <div
                                  style={{ fontSize: "12px", color: "#666" }}
                                >
                                  {supplier.phone ||
                                    supplier.mobile ||
                                    "No phone"}
                                </div>
                              </div>
                              <small
                                style={{ color: "#888", fontSize: "12px" }}
                              >
                                {supplier.email || ""}
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
                    style={{ border: "1px solid #A2A8B8" }}
                    value={formData.phone}
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* Middle line */}
            <div
              style={{
                width: "1px",
                height: "70px",
                backgroundColor: "#E0E0E0",
                margin: "0 20px",
              }}
            ></div>

            {/* RIGHT SIDE (Supplier Invoice No + Date) */}
            <div className="d-flex flex-column gap-3">
              {/* Invoice Dropdown */}
              <div className="d-flex justify-content-end">
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
    Purchase Invoice No
  </span>

                <div
                  ref={dropdownRef}
                  style={{ position: "relative", width: "100%" }}
                >
                  <div
                    onClick={() =>
                      !isFromPurchase && setIsInvoiceOpen(!isInvoiceOpen)
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 14px",
                      border: "1px solid #D1D5DB",
                      borderRadius: "12px",
                      backgroundColor: isFromPurchase ? "#f8f9fa" : "#FFFFFF",
                      cursor: isFromPurchase ? "default" : "pointer",
                      fontSize: "14px",
                      fontFamily: '"Inter", sans-serif',
                      color: isFromPurchase ? "#6b7280" : "#374151",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      transition: "all 0.2s",
                      height: "37px",
                      opacity: isFromPurchase ? 0.8 : 1,
                    }}
                    onMouseEnter={(e) =>
                      !isFromPurchase &&
                      (e.currentTarget.style.boxShadow =
                        "0 4px 12px rgba(0,0,0,0.15)")
                    }
                    onMouseLeave={(e) =>
                      !isFromPurchase &&
                      (e.currentTarget.style.boxShadow =
                        "0 1px 3px rgba(0,0,0,0.1)")
                    }
                  >
                    <span style={{ flex: 1 }}>
                      {formData.invoiceNumber
                        ? formData.invoiceNumber
                        : isFromPurchase
                          ? "Invoice loaded from purchase"
                          : ""}
                    </span>
                    {!isFromPurchase && (
                      <span style={{ fontSize: "12px", color: "#9CA3AF" }}>
                        <IoChevronDownOutline />
                      </span>
                    )}
                  </div>

                  {!isFromPurchase && isInvoiceOpen && (
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
                        maxHeight: "240px",
                        overflowY: "auto",
                      }}
                    >
                      {loadingInvoices ? (
                        <div
                          style={{
                            padding: "12px",
                            textAlign: "center",
                            color: "#6b7280",
                          }}
                        >
                          Loading invoices...
                        </div>
                      ) : supplierInvoices.length === 0 ? (
                        <div
                          style={{
                            padding: "12px",
                            textAlign: "center",
                            color: "#6b7280",
                          }}
                        >
                          No invoices found
                        </div>
                      ) : (
                        supplierInvoices.map((invoice) => (
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
                                formData.invoiceId === invoice._id
                                  ? "600"
                                  : "500",
                              backgroundColor:
                                formData.invoiceId === invoice._id
                                  ? "#e5f0ff"
                                  : "transparent",
                              transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "#e5f0ff")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                formData.invoiceId === invoice._id
                                  ? "#e5f0ff"
                                  : "transparent")
                            }
                          >
                            {invoice.invoiceNo || invoice.invoiceNumber}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                </div>
              </div>

              {/* Date */}
              <div className="d-flex justify-content-end gap-2">
                <div className="" style={{ marginLeft: "-10px" }}>
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
    Debit Date
  </span>

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
            </div>
          </div>

          {/* Available Items Table */}
          {renderAvailableItemsTable()}

          {/* Selected Items Table */}
          {renderSelectedItemsTable()}

          {/* Payment + Summary */}
          <div className="row">
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

            <div className="col-md-5">
              <div className="p-4">
                <div className="summary-line">
                  <span
                    style={{
                      color: "#0E101A",
                      fontWeight: 400,
                      fontSize: "16px",
                      lineHeight: "120%",
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
                    }}
                  >
                    {formData.roundOff >= 0 ? "+" : "-"}₹
                    {Math.abs(formData.roundOff).toFixed(2)}
                  </span>
                </div>
                <hr style={{ color: "#727681" }} />
                <div className="summary-line">
                  <h5 style={{ color: "#0E101A", lineHeight: "120%" }}>
                    Total Amount :-
                  </h5>
                  <h4
                    style={{
                      color: "#0E101A",
                      fontWeight: 500,
                      fontSize: "16px",
                      lineHeight: "120%",
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
                      border: "1px solid #1F7FFF",
                    }}
                    onClick={() => handleSubmit("save")}
                    disabled={
                      loading ||
                      !formData.supplierId ||
                      !formData.invoiceId ||
                      selectedItems.filter(
                        (item) => (item.returnQuantity || 0) > 0,
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
                    }}
                    onClick={() => handleSubmit("saveAndPrint")}
                    disabled={
                      loading ||
                      !formData.supplierId ||
                      !formData.invoiceId ||
                      selectedItems.filter(
                        (item) => (item.returnQuantity || 0) > 0,
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
      </div>
    </div>
  );
};

export default SupplierDebitNote;

