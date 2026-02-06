import React, { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import BASE_URL from "../../../../pages/config/config";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { TbChevronUp, TbEye, TbRefresh } from "react-icons/tb";
import Select from "react-select";
import { MdImageSearch, MdLockOutline } from "react-icons/md";
import { FaArrowLeft } from "react-icons/fa6";
import AiLogo from "../../../../assets/images/AI.png";
import sanitizeHtml from "sanitize-html";
import api from "../../../../pages/config/axiosInstance"
import CreateCategoryModal from "../../category/CreateCategoryModel"

import { RiDeleteBinLine } from "react-icons/ri";
import { FcAddImage } from "react-icons/fc";

const regexPatterns = {
  productName: /^[a-zA-Z0-9\s\-_&()]{2,100}$/, // Alphanumeric, spaces, some special chars, 2-100 chars
  price: /^\d+(\.\d{1,2})?$/, // Positive number with up to 2 decimal places
  quantity: /^(?:[1-9]\d*)$/,
  discountValue: /^\d+(\.\d{1,2})?$/, // Positive number with up to 2 decimal places
  leadTime: /^\d+$/, // Positive integer
  reorderLevel: /^\d+$/, // Positive integer
  initialStock: /^\d+$/, // Positive integer
};

const sanitizeOptions = {
  allowedTags: ["b", "i", "em", "strong", "a", "p", "br"],
  allowedAttributes: {
    a: ["href"],
  },
};

const ProductView = () => {

  const [isOn, setIsOn] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const steps = [
    t("descriptionAndMedia"),
    t("pricing"),
    t("images"),
    t("variants"),
  ];

  const variantTabs = [
    t("color"),
    t("size"),
    t("expiry"),
    t("material"),
    t("model"),
    t("weight"),
    t("skinType"),
    t("packagingType"),
    t("flavour"),
  ];

  const lotColumns = [
    { label: "Lot No.", editableValue: "12" },
    { label: "Lot MRP", editableValue: "₹ 2,367.08/-" },
    { label: "Fabric Batch No.", editableValue: "MO123" },
    { label: "Production Date", editableValue: "22/09/2023", opacity: 0.69 },
    { label: "Design Code", editableValue: "DC-0123" },
    { label: "Quantity", editableValue: "112" },
    { label: "Size", editableValue: "S, M, L, XL, XXL" },
    { label: "Color", editableValue: "Red, Green, Yellow", opacity: 0.83 },
  ];

  const lotFieldKeys = [
    "lotNo",
    "lotmrp",
    "fabricBatchNo",
    "productionDate",
    "designCode",
    "quantity",
    "size",
    "color",
  ];

  const [lotDetails, setLotDetails] = useState({
    lotNo: "",
    lotmrp: "",
    fabricBatchNo: "",
    productionDate: "",
    designCode: "",
    quantity: "",
    size: "",
    color: "",
  });

  const [step, setStep] = useState(0);
  const [stepStatus, setStepStatus] = useState(
    Array(steps.length).fill("pending")
  );
  const [activeTab, setActiveTab] = useState("Color");
  const [formData, setFormData] = useState({
    productName: "",
    category: "",
    subCategory: "",
    // itemBarcode: "",
    purchasePrice: "",
    sellingPrice: "",
    wholesalePrice: "",
    retailPrice: "",
    quantity: "",
    discountType: "",
    discountValue: "",
    variants: {},
    sellingType: "",
    hsn: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedsubCategory, setSelectedsubCategory] = useState(null);
  const [selectedBrands, setSelectedBrands] = useState(null);
  const [selectedUnits, setSelectedUnits] = useState(null);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [brandOptions, setBrandOptions] = useState([]);
  const [unitsOptions, setUnitsOptions] = useState([]);
  const [options, setOptions] = useState([]);
  const [optionsware, setOptionsWare] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [optionsHsn, setOptionsHsn] = useState([]);
  const [selectedHSN, setSelectedHSN] = useState(null);
  const [showHSNModal, setShowHSNModal] = useState(false);
  const [brandId, setBrandId] = useState(null);
  const [categoryId, setCategoryId] = useState(null);
  const [subCategoryId, setSubCategoryId] = useState(null);
  const [supplierId, setSupplierId] = useState(null);
  const [warehouseId, setWarehouseId] = useState(null);
  const [showAddCategoryModel, setShowAddCategoryModel] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [subCategoryName, setSubCategoryName] = useState("");

  const [variants, setVariants] = useState([
    { selectedVariant: "", selectedValue: [], valueDropdown: [] },
  ]);

  const [variantDropdown, setVariantDropdown] = useState([]);
  const [images, setImages] = useState([]);

  const onDrop = (acceptedFiles) => {
    const maxSize = 1 * 1024 * 1024; // 1MB in bytes
    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    const validFiles = [];
    const invalidFiles = [];

    acceptedFiles.forEach((file) => {
      if (!validTypes.includes(file.type)) {
        invalidFiles.push({ file, error: `Invalid file type for ${file.name}. Only JPEG, PNG, or JPG allowed.` });
      } else if (file.size > maxSize) {
        invalidFiles.push({ file, error: `Image ${file.name} exceeds 1MB limit.` });
      } else {
        validFiles.push(Object.assign(file, { preview: URL.createObjectURL(file) }));
      }
    });

    if (invalidFiles.length > 0) {
      invalidFiles.forEach(({ error }) => toast.error(error));
      setErrors((prev) => ({ ...prev, images: "Image size should not exceeded 1MB." }));
    }

    if (validFiles.length > 0) {
      setImages((prev) => [...prev, ...validFiles]);
      setErrors((prev) => ({ ...prev, images: "" }));
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: { "image/*": [] },
    onDrop,
  });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/api/products/${id}`);
        const data = res.data;
        const sanitizedData = {
          ...data,
          productName: sanitizeHtml(data.productName || "", sanitizeOptions),
        };
        // setFormData(sanitizedData);
        // setFormData({ ...formData, ...data });
        let computedDiscountValue = "";
        if (data.discountType === "Fixed") {
          computedDiscountValue = data.discountAmount;
        } else if (data.discountType === "Percentage") {
          computedDiscountValue = data.discountAmount;
        }

        setFormData((prev) => ({
          ...prev,
          ...sanitizedData,
          ...data,
          discountValue: computedDiscountValue, // Explicitly set discountValue
        }));

        if (data.lotDetails) {
          let details = data.lotDetails;
          if (typeof details === 'string') {
            try {
              details = JSON.parse(details);
            } catch (e) {
              // console.error("Error parsing lotDetails", e);
              details = {};
            }
          }
          setLotDetails({
            lotNo: details.lotNo || "",
            lotmrp: details.lotmrp || "",
            fabricBatchNo: details.fabricBatchNo || "",
            productionDate: details.productionDate || "",
            designCode: details.designCode || "",
            quantity: details.quantity || "",
            size: details.size || "",
            color: details.color || "",
          });
        }

        // if (data.brand)  setSelectedBrands({ value: data.brand._id || data.brand, label: data.brand.brandName || data.brand });
        if (data.brand) {
          setBrandId(data.brand._id || data.brand);
        }

        if (data.subcategory) {
          setSubCategoryId(data.subcategory._id || data.subcategory);
        }
        if (data.category) {
          setCategoryId(data.category._id || data.category);
        }

        if (data.unit) setSelectedUnits({ value: data.unit, label: data.unit });
        // if (data.supplier) setSelectedSupplier({ value: data.supplier._id || data.supplier, label: data.supplier.firstName ? `${data.supplier.firstName}${data.supplier.lastName} (${data.supplier.supplierCode})` : data.supplier });
        if (data.supplier) {
          setSupplierId(data.supplier._id || data.supplier);
        }

        // if (data.warehouse) setSelectedWarehouse({ value: data.warehouse._id || data.warehouse, label: data.warehouse.warehouseName || data.warehouse });
        if (data.warehouse) {
          setWarehouseId(data.warehouse._id || data.warehouse);
        }
        if (data.hsn) {
          const hsnOption = optionsHsn.find(
            (opt) => opt.value === (data.hsn._id || data.hsn)
          );
          if (hsnOption) setSelectedHSN(hsnOption);
        }



        // --- VARIANTS PATCH ---
        // Map root product data to the first variant entry
        const existingVariant = {
          selectedVariant: "",
          selectedValue: [],
          valueDropdown: [],
          purchasePrice: data.purchasePrice,
          mrp: data.mrp,
          sellingPrice: data.sellingPrice,
          tax: data.tax,
          size: data.size,
          color: data.color,
          openingQuantity: data.openingQuantity,
          minStockToMaintain: data.minStockToMaintain,
          discountAmount: data.discountAmount,
          discountType: data.discountType,
          expiryDate: data.expiryDate ? data.expiryDate.split("T")[0] : "",
          unit: data.unit,
        };
        setVariants([existingVariant]);

        if (data.images && data.images.length > 0) {
          const existingImages = data.images.map((img) => ({
            preview: img.url, // Dropzone expects `preview`
            url: img.url, // Keep original URL if you need
            public_id: img.public_id,
          }));
          setImages(existingImages);
        }

        // if (data.hsnCode) setSelectedHSN({ value: data.hsnCode._id || data.hsnCode, label: data.hsnCode.hsnCode ? `${data.hsnCode.hsnCode} - ${data.hsnCode.description || ''}` : data.hsnCode });
        setLoading(false);
      } catch (err) {
        toast.error("Failed to fetch product");
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {

    api.get("/api/variant-attributes/active-variants")
      .then(res => {
        const data = res.data;
        setVariantDropdown(data)
      })
      .catch(err => console.error("Error fetching variant dropdown:", err));
  }, [BASE_URL]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/api/category/categories");
        const data = res.data;

        // Filter only active (non-deleted) categories
        const activeCategories = (Array.isArray(data) ? data : data?.categories || [])
          .filter(cat => cat.isDelete !== true);

        const options = activeCategories.map((category) => ({
          value: category._id,
          label: sanitizeHtml(category.categoryName, sanitizeOptions),
        }));

        setCategories(options);
      } catch (error) {
        // console.error("Error fetching categories:", error);
        toast.error("Failed to load categories");
      }
    };
    const fetchBrands = async () => {
      try {
        // const token = localStorage.getItem("token");
        const res = await api.get("/api/brands/active-brands");
        const options = res.data.brands.map((brand) => ({
          value: brand._id,
          label: sanitizeHtml(brand.brandName, sanitizeOptions), // Commented out: Sanitization
          // label: brand.brandName,
          // label: brand.brandName,
        }));
        setBrandOptions(options);
      } catch (error) { }
    };
    const fetchUnits = async () => {
      try {
        // const token = localStorage.getItem("token");
        const res = await api.get(
          "/api/unit/units/status/active");
        const options = res.data.units.map((unit) => ({
          value: unit.shortName,
          label: sanitizeHtml(
            `${unit.unitsName} (${unit.shortName})`,
            sanitizeOptions
          ), // Commented out: Sanitization
          // label: `${unit.unitsName} (${unit.shortName})`,
        }));
        setUnitsOptions(options);
      } catch (error) { }
    };

    const fetchWarehouses = async () => {
      try {
        // const token = localStorage.getItem("token");
        const res = await api.get("/api/warehouse/active");
        if (res.data.success) {
          const options = res.data.data.map((wh) => ({
            value: wh._id,
            label: sanitizeHtml(wh.warehouseName, sanitizeOptions),
            // label: wh.warehouseName,
          }));
          setOptionsWare(options);
        }
      } catch (error) { }
    };
    const fetchHSN = async () => {
      try {
        // const token = localStorage.getItem("token");
        const res = await api.get("/api/hsn/all");
        // console.log("hsnd", res.data.data);
        if (res.data.success) {
          const options = res.data.data.map((item) => ({
            value: item._id,
            label: sanitizeHtml(
              `${item.hsnCode} - ${item.description || ""}`,
              sanitizeOptions
            ),
            // label: `${item.hsnCode} - ${item.description || ""}`,
          }));
          setOptionsHsn(options);
        }
      } catch (error) { }
    };

    fetchCategories();
    fetchBrands();
    fetchUnits();
    // fetchSuppliers();
    fetchWarehouses();
    fetchHSN();
  }, []);

  useEffect(() => {
    if (brandOptions.length > 0 && brandId) {
      const found = brandOptions.find((opt) => opt.value === brandId);
      if (found) {
        setSelectedBrands(found);
      }
    }
  }, [brandOptions, brandId]);

  useEffect(() => {
    if (categoryId && categories.length > 0) {
      const foundCat = categories.find((opt) => opt.value === categoryId);
      if (foundCat) {
        setSelectedCategory(foundCat);
        fetchSubcategoriesByCategory(foundCat.value); // Now filtered!
      }
    } else {
      setSelectedCategory(null);
      setSelectedsubCategory(null);
      setSubcategories([]);
      setSubCategoryId(null);
    }
  }, [categoryId, categories]);

  const fetchSubcategoriesByCategory = async (categoryId) => {
    if (!categoryId) {
      setSubcategories([]);
      return;
    }

    try {
      const res = await api.get(`/api/subcategory/by-category/${categoryId}`);
      const data = res.data;

      // Filter only active subcategories
      const activeSubcats = (Array.isArray(data) ? data : data?.subcategories || [])
        .filter(sub => sub.isDelete !== true);

      const options = activeSubcats.map((subcat) => ({
        value: subcat._id,
        label: subcat.name,
      }));

      setSubcategories(options);
    } catch (error) {
      // console.error("Error fetching subcategories:", error);
      toast.error("Failed to load subcategories");
      setSubcategories([]);
    }
  };

  useEffect(() => {
    if (subCategoryId && subcategories.length > 0) {
      const found = subcategories.find((opt) => opt.value === subCategoryId);
      if (found) {
        setSelectedsubCategory(found);
      }
    }
  }, [subCategoryId, subcategories]);

  useEffect(() => {
    if (supplierId && options.length > 0) {
      const found = options.find((opt) => opt.value === supplierId);
      if (found) {
        setSelectedSupplier(found);
      }
    }
  }, [supplierId, options]);

  useEffect(() => {
    if (warehouseId && optionsware.length > 0) {
      const found = optionsware.find((opt) => opt.value === warehouseId);
      if (found) setSelectedWarehouse(found);
    }
  }, [warehouseId, optionsware]);

  useEffect(() => {
    if (optionsHsn.length > 0 && formData.hsn) {
      const hsnValue =
        typeof formData.hsn === "object" ? formData.hsn._id : formData.hsn;
      const found = optionsHsn.find((opt) => opt.value === hsnValue);
      if (found) setSelectedHSN(found);
    }
  }, [optionsHsn, formData.hsn]);

  const handleBrandChange = (selectedOption) =>
    setSelectedBrands(selectedOption);
  const handleUnitChange = (selectedOption) => setSelectedUnits(selectedOption);
  const handleWarehouseChange = (selectedOption) =>
    setSelectedWarehouse(selectedOption);
  const handleHSNChange = (selectedOption) => setSelectedHSN(selectedOption);
  const subCategoryChange = (selectedOption) =>
    setSelectedsubCategory(selectedOption);

  const handleSubmitCategory = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!categoryName || !categoryName.trim()) {
      newErrors.categoryName = "Category Name is required";
    }
    setErrors((prev) => ({ ...prev, ...newErrors }));
    if (Object.keys(newErrors).length > 0) return;
    try {
      const payload = { categoryName };
      if (subCategoryName && subCategoryName.trim()) {
        payload.subCategoryName = subCategoryName;
      }

      const resCat = await api.post("/api/category/categories", payload);
      const createdCat = resCat.data?.category || resCat.data;

      if (createdCat?._id) {
        const resAll = await api.get("/api/category/categories");
        const optionsAll = resAll.data.map((c) => ({
          value: c._id,
          label: sanitizeHtml(c.categoryName, sanitizeOptions),
        }));
        setCategories(optionsAll);

        const found = optionsAll.find((o) => o.value === createdCat._id);
        if (found) {
          setSelectedCategory(found);
          setCategoryId(found.value);

          const resSub = await api.get(`/api/subcategory/by-category/${found.value}`);
          const dataSub = resSub.data;
          const listSub = Array.isArray(dataSub) ? dataSub : dataSub?.subcategories || [];
          const optionsSub = listSub.map((subcat) => ({
            value: subcat._id,
            label: subcat.name,
          }));
          setSubcategories(optionsSub);

          if (subCategoryName && subCategoryName.trim()) {
            const createdSub = optionsSub.find((s) => s.label === subCategoryName.trim()) || (optionsSub.length === 1 ? optionsSub[0] : null);
            if (createdSub) {
              setSelectedsubCategory(createdSub);
              setSubCategoryId(createdSub.value);
            } else {
              setSelectedsubCategory(null);
              setSubCategoryId(null);
            }
          } else {
            setSelectedsubCategory(null);
            setSubCategoryId(null);
          }
        }
      }

      setShowAddCategoryModel(false);
      setCategoryName("");
      setSubCategoryName("");
      toast.success("Category created successfully");
    } catch (error) {
      if (error.response?.status === 409) {
        toast.error("Category already exists");
      } else {
        toast.error("Failed to create category");
      }
    }
  };

  const handleGenerateBarcode = async () => {
    try {
      const res = await api.post("/api/products/generate-barcode", { productId: id });
      const code = res.data?.barcode;
      if (code) {
        setFormData((prev) => ({ ...prev, itemBarcode: code }));
        toast.success("Barcode generated");
      } else {
        toast.error("Failed to generate barcode");
      }
    } catch (err) {
      toast.error("Failed to generate barcode");
    }
  };

  const validateInput = (name, value) => {
    if (regexPatterns[name]) {
      return regexPatterns[name].test(value) ? "" : `Invalid ${name}`;
    }
    return "";
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const sanitizedValue =
      type !== "checkbox" ? sanitizeHtml(value, sanitizeOptions) : value;
    const error =
      type !== "checkbox" ? validateInput(name, sanitizedValue) : "";
    setErrors((prev) => ({ ...prev, [name]: error }));
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : sanitizedValue,
    }));
  };

  const inputChange = (key, value) => {
    const sanitizedValue = sanitizeHtml(value, sanitizeOptions);
    if (step === 3) {
      const parsedValues = sanitizedValue
        .split(",")
        .map((v) => v.trim())
        .filter((v) => v);
      setFormData((prev) => ({
        ...prev,
        variants: { ...prev.variants, [key]: parsedValues },
      }));
    } else {
      const error = validateInput(key, sanitizedValue);
      setErrors((prev) => ({ ...prev, [key]: error }));
      setFormData((prev) => ({ ...prev, [key]: sanitizedValue }));
    }
  };

  const validateStep = () => {
    const newErrors = {};

    if (!formData.productName) newErrors.productName = "Product Name is required";
    if (formData.productName && !regexPatterns.productName.test(formData.productName)) newErrors.productName = "Invalid Product Name";
    if (!selectedCategory) newErrors.category = "Category is required";
    if (!selectedsubCategory) newErrors.subCategory = "Subcategory is required";
    if (!selectedHSN) newErrors.hsn = "HSN Code is required";
    if (formData.isAdvanced) {
      if (!formData.leadTime) newErrors.leadTime = "Lead Time is required";
      if (formData.leadTime && !regexPatterns.leadTime.test(formData.leadTime)) newErrors.leadTime = "Invalid Lead Time";
      if (!formData.reorderLevel) newErrors.reorderLevel = "Reorder Level is required";
      if (formData.reorderLevel && !regexPatterns.reorderLevel.test(formData.reorderLevel)) newErrors.reorderLevel = "Invalid Reorder Level";
      if (!formData.initialStock) newErrors.initialStock = "Initial Stock is required";
      if (formData.initialStock && !regexPatterns.initialStock.test(formData.initialStock)) newErrors.initialStock = "Invalid Initial Stock";
      if (formData.trackType === "serial" && !formData.serialNumber)
        newErrors.serialNumber = "Serial Number is required";
      if (formData.serialNumber && !regexPatterns.serialNumber.test(formData.serialNumber)) newErrors.serialNumber = "Invalid Serial Number";
      if (formData.trackType === "batch" && !formData.batchNumber)
        newErrors.batchNumber = "Batch Number is required";
      if (formData.batchNumber && !regexPatterns.batchNumber.test(formData.batchNumber)) newErrors.batchNumber = "Invalid Batch Number";
    }

    if (!formData.purchasePrice) newErrors.purchasePrice = "Purchase Price is required";
    if (formData.purchasePrice && !regexPatterns.price.test(formData.purchasePrice)) newErrors.purchasePrice = "Purchase Price must be a positive number with up to 2 decimal places";
    if (!formData.sellingPrice) newErrors.sellingPrice = "Selling Price is required";
    if (formData.sellingPrice && !regexPatterns.price.test(formData.sellingPrice)) newErrors.sellingPrice = "Selling Price must be a positive number with up to 2 decimal places";
    if (!formData.tax) newErrors.tax = "Tax Rate is required";

    // NEW: Update errors state with validation results
    setErrors(newErrors);
    return Object.values(newErrors).filter(Boolean); // Return array of error messages for toast notifications
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateStep();

    if (validationErrors.length > 0) {
      validationErrors.forEach((error) => toast.error(error));
      return;
    }

    const formPayload = new FormData();
    // Append fields as before
    if (formData.productName) formPayload.append("productName", formData.productName);
    if (formData.sku) formPayload.append("sku", formData.sku);
    formPayload.append("brand", selectedBrands?.value || "");
    formPayload.append("category", selectedCategory?.value || "");
    formPayload.append("subcategory", selectedsubCategory?.value || "");
    // formPayload.append("supplier", selectedSupplier?.value || "");
    if (formData.store) formPayload.append("store", formData.store);
    formPayload.append("warehouse", selectedWarehouse?.value || "");
    // Use variants[0] for fields managed in the Variants section
    const primaryVariant = variants[0] || {};

    if (primaryVariant.purchasePrice) formPayload.append("purchasePrice", primaryVariant.purchasePrice);
    if (primaryVariant.mrp) formPayload.append("mrp", primaryVariant.mrp);
    if (primaryVariant.sellingPrice) formPayload.append("sellingPrice", primaryVariant.sellingPrice);

    if (formData.retailPrice) formPayload.append("retailPrice", formData.retailPrice);

    if (primaryVariant.openingQuantity) formPayload.append("openingQuantity", primaryVariant.openingQuantity);
    if (primaryVariant.minStockToMaintain) formPayload.append("minStockToMaintain", primaryVariant.minStockToMaintain);

    if (primaryVariant.size) formPayload.append("size", primaryVariant.size);
    if (primaryVariant.color) formPayload.append("color", primaryVariant.color);

    formPayload.append("unit", selectedUnits?.value || "");
    if (primaryVariant.tax) formPayload.append("tax", primaryVariant.tax);

    if (primaryVariant.discountType) formPayload.append("discountType", primaryVariant.discountType);
    if (primaryVariant.discountAmount) formPayload.append("discountAmount", primaryVariant.discountAmount);
    if (formData.itemType) formPayload.append("itemType", formData.itemType);
    if (formData.isAdvanced) formPayload.append("isAdvanced", formData.isAdvanced ? true : false);
    if (formData.trackType) formPayload.append("trackType", formData.trackType);
    formPayload.append("isReturnable", formData.isReturnable ? true : false);
    if (formData.leadTime) formPayload.append("leadTime", formData.leadTime);
    if (formData.reorderLevel) formPayload.append("reorderLevel", formData.reorderLevel);
    if (formData.initialStock) formPayload.append("initialStock", formData.initialStock);
    if (formData.serialNumber) formPayload.append("serialNumber", formData.serialNumber);
    if (formData.batchNumber) formPayload.append("batchNumber", formData.batchNumber);
    if (formData.returnable) formPayload.append("returnable", formData.returnable ? true : false);
    if (formData.expirationDate) formPayload.append("expirationDate", formData.expirationDate);
    formPayload.append("hsn", selectedHSN?.value || "");
    if (formData.itemBarcode) formPayload.append("itemBarcode", formData.itemBarcode);

    formPayload.append(
      "lotDetails",
      JSON.stringify({
        lotNo: lotDetails.lotNo,
        lotmrp: lotDetails.lotmrp,
        fabricBatchNo: lotDetails.fabricBatchNo,
        productionDate: lotDetails.productionDate || null,
        designCode: lotDetails.designCode,
        quantity: lotDetails.quantity,
        size: lotDetails.size,
        color: lotDetails.color,
      })
    );

    if (formData.variants && Object.keys(formData.variants).length > 0)
      formPayload.append("variants", JSON.stringify(formData.variants));

    const filesToUpload = [];
    images.forEach((imgFile) => {
      if (!imgFile.public_id) filesToUpload.push(imgFile);
    });
    variants.forEach((v) => {
      (v.images || []).forEach((f) => {
        filesToUpload.push(f);
      });
    });
    filesToUpload.forEach((f) => formPayload.append("images", f));

    const existingImageUrls = images
      .filter((img) => img.public_id)
      .map((img) => ({ url: img.url, public_id: img.public_id }));
    formPayload.append("existingImages", JSON.stringify(existingImageUrls));

    try {
      // const token = localStorage.getItem("token");
      await api.put(`/api/products/${id}`, formPayload);
      toast.success("Product updated successfully!");
      const returnPath = location.state?.from || '/product';
      navigate(returnPath);
    } catch (err) {
      // console.log(err.response?.data);
      toast.error("Failed to update product");
    }
  };

  const handleRemoveImage = async (file) => {
    if (file.public_id) {
      try {
        const res = await api.delete(`/api/products/${id}`, {
          data: { public_id: file.public_id },
        });
        setImages(res.data.images);
      } catch (error) {
        // console.error("Failed to delete image", error);
      }
    } else {
      setImages((prev) => prev.filter((f) => f !== file));
    }
  };

  const handleVariantChange = (index, fieldOrVariant, maybeValue) => {
    if (typeof maybeValue !== "undefined") {
      setVariants(prev =>
        prev.map((v, i) => (i === index ? { ...v, [fieldOrVariant]: maybeValue } : v))
      );
      return;
    }
    const value = (fieldOrVariant || "").trim();
    setVariants(prev =>
      prev.map((v, i) =>
        i === index ? { ...v, selectedVariant: value, selectedValue: [], valueDropdown: [] } : v
      )
    );
    if (!value) return;
    api
      .get(`/api/variant-attributes/values/${encodeURIComponent(value)}`)
      .then(res => {
        const data = res.data;
        const values = [];
        data.forEach(val => {
          if (typeof val === "string") {
            values.push(...val.split(",").map(v => v.trim()).filter(Boolean));
          }
        });
        setVariants(prev =>
          prev.map((v, i) => (i === index ? { ...v, valueDropdown: values } : v))
        );
      })
      .catch(err => console.error("Error fetching value dropdown:", err));
  };

  const handleValueChange = (index, value) => {
    setVariants(prev =>
      prev.map((v, i) => (i === index ? { ...v, selectedValue: value } : v))
    );
  };

  const handleAddVariant = () => {
    setVariants(prev => [
      ...prev,
      { selectedVariant: "", selectedValue: [], valueDropdown: [] }
    ]);
  };

  const handleRemoveVariant = index => {
    if (variants.length > 1) {
      setVariants(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleVariantImageChange = (index, e) => {
    const files = Array.from(e.target.files || []);
    const maxSize = 1 * 1024 * 1024;
    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    const validFiles = [];
    const invalidErrors = [];
    files.forEach(file => {
      if (!validTypes.includes(file.type)) {
        invalidErrors.push(`Invalid file type for ${file.name}. Only JPEG, PNG, or JPG allowed.`);
      } else if (file.size > maxSize) {
        invalidErrors.push(`Image ${file.name} exceeds 1MB limit.`);
      } else {
        validFiles.push(Object.assign(file, { preview: URL.createObjectURL(file) }));
      }
    });
    if (invalidErrors.length) {
      invalidErrors.forEach(msg => toast.error(msg));
    }
    if (validFiles.length) {
      setVariants(prev =>
        prev.map((v, i) =>
          i === index ? { ...v, images: [...(v.images || []), ...validFiles] } : v
        )
      );
    }
  };

  useEffect(() => {
    if (variants && variants.length > 0) {
      const updatedVariants = variants.reduce((acc, v) => {
        if (v.selectedVariant && v.selectedValue?.length > 0) {
          acc[v.selectedVariant.trim()] = v.selectedValue;
        }
        return acc;
      }, {});
      setFormData((prev) => ({ ...prev, variants: updatedVariants }))
    }
  }, [variants]);
  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-4"
      style={{ height: '100vh' }}
    >

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
          }}
        >
          <Link
            to={location.state?.from || "/dashboard"}
            style={{
              width: 32,
              height: 32,
              background: "white",
              borderRadius: 53,
              border: "1.07px solid #EAEAEA",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              textDecoration: "none",
            }}
          >
            <FaArrowLeft style={{ color: "#A2A8B8" }} />
          </Link>
          <h2
            style={{
              margin: 0,
              color: "black",
              fontSize: 22,
              fontWeight: 500,
              lineHeight: "26.4px",
            }}
          >
            View Product
          </h2>
        </div>
      </div>

      {/* body */}
      <div>
        <form onSubmit={handleSubmit}>
          <div
            style={{
              width: "100%",
              padding: "16px 0px 16px 16px",
              background: "var(--White, white)",
              borderRadius: "16px",
              border: "1px var(--Stroke, #EAEAEA) solid",
              flexDirection: "column",
              justifyContent: "flex-start",
              alignItems: "flex-start",
              gap: "24px",
              display: "flex",
              overflowX: 'auto',
              overflowY: "auto",
              maxHeight: "calc(100vh - 160px)",
              position: 'relative'
            }}
          >
            <div style={{
              width: "100%",
              background: "var(--White, white)",
              flexDirection: "column",
              justifyContent: "flex-start",
              alignItems: "flex-start",
              gap: "24px",
              display: "flex",
              overflowX: 'auto',
              overflowY: "auto",
              maxHeight: "calc(100vh - 160px)",
              position: 'relative'
            }}
            >
              {/* General Details */}
              <div style={{ width: "1832px" }}>
                <div
                  style={{
                    color: "black",
                    fontSize: "16px",
                    fontFamily: "Inter",
                    fontWeight: "500",
                    lineHeight: "19.20px",
                  }}
                >
                  General Details
                </div>
                <div
                  style={{
                    gap: "60px",
                    width: "100%",
                    marginTop: "16px",
                    display: "flex",
                  }}
                >
                  {/* Product Name */}
                  <div
                    style={{
                      minWidth: "400px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: "4px",
                      }}
                    >
                      <span
                        style={{
                          color: "var(--Black-Grey, #727681)",
                          fontSize: "12px",
                          fontFamily: "Inter",
                          fontWeight: "400",
                          lineHeight: "14.40px",
                        }}
                      >
                        Product Name
                      </span>
                      <span
                        style={{
                          color: "var(--Danger, #D00003)",
                          fontSize: "12px",
                          fontFamily: "Inter",
                          fontWeight: "400",
                          lineHeight: "14.40px",
                        }}
                      >
                        *
                      </span>
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: "40px",
                        padding: "0 12px",
                        background: "white",
                        borderRadius: "8px",
                        border: "1px var(--White-Stroke, #EAEAEA) solid",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "8px",
                        display: "flex",
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          border: "none",
                          background: "transparent",
                          color: "var(--Black-Black, #0E101A)",
                          fontSize: "14px",
                          fontFamily: "Inter",
                          fontWeight: "400",
                          outline: "none",
                        }}
                      >{formData.productName}</div>
                    </div>
                  </div>

                  {/* category + sub-category */}
                  <div
                    style={{
                      width: "400px",
                      display: "flex",
                      gap: "16px",
                    }}
                  >
                    <div
                      style={{
                        width: "192px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: "4px",
                          width: '210px'
                        }}
                      >
                        <span
                          style={{
                            color: "var(--Black-Grey, #727681)",
                            fontSize: "12px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            lineHeight: "14.40px",
                          }}
                        >
                          Category
                        </span>
                        <span
                          style={{
                            color: "var(--Danger, #D00003)",
                            fontSize: "12px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            lineHeight: "14.40px",
                          }}
                        >
                          *
                        </span>
                      </div>
                      <div
                        style={{
                          width: "100%",
                          height: "40px",
                          padding: "0 12px",
                          background: "white",
                          borderRadius: "8px",
                          border: "1px var(--White-Stroke, #EAEAEA) solid",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "8px",
                          display: "flex",
                        }}
                      ><div
                        style={{
                          width: "100%",
                          fontSize: "14px",
                          fontFamily: "Inter",
                          fontWeight: "400",
                          color: "var(--Black-Black, #0E101A)",
                        }}
                      >
                          {selectedCategory?.label || "-"}
                        </div>

                      </div>
                    </div>

                    <div
                      style={{
                        width: "192px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: "4px",
                          width: '210px',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span
                          style={{
                            color: "var(--Black-Grey, #727681)",
                            fontSize: "12px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            lineHeight: "14.40px",
                          }}
                        >
                          Sub - Category <span
                            style={{
                              color: "var(--Danger, #D00003)",
                              fontSize: "12px",
                              fontFamily: "Inter",
                              fontWeight: "400",
                              lineHeight: "14.40px",
                            }}
                          >
                            *
                          </span>
                        </span>

                      </div>
                      <div
                        style={{
                          width: "100%",
                          height: "40px",
                          padding: "0 12px",
                          background: "white",
                          borderRadius: "8px",
                          border: "1px var(--White-Stroke, #EAEAEA) solid",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "8px",
                          display: "flex",
                        }}
                      ><div
                        style={{
                          width: "100%",
                          fontSize: "14px",
                          fontFamily: "Inter",
                          fontWeight: "400",
                          color: "var(--Black-Black, #0E101A)",
                        }}
                      >
                          {selectedsubCategory?.label || ""}
                        </div>

                      </div>
                    </div>
                  </div>

                  {/* item code / bar code */}
                  <div
                    style={{
                      minWidth: "400px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: "4px",
                      }}
                    >
                      <span
                        style={{
                          color: "var(--Black-Grey, #727681)",
                          fontSize: "12px",
                          fontFamily: "Inter",
                          fontWeight: "400",
                          lineHeight: "14.40px",
                        }}
                      >
                        Item code / Bar code
                      </span>
                      <span
                        style={{
                          color: "var(--Danger, #D00003)",
                          fontSize: "12px",
                          fontFamily: "Inter",
                          fontWeight: "400",
                          lineHeight: "14.40px",
                        }}
                      >
                        *
                      </span>
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: "40px",
                        padding: "0 12px",
                        background: "white",
                        borderRadius: "8px",
                        border: "1px var(--White-Stroke, #EAEAEA) solid",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "8px",
                        display: "flex",
                      }}
                    >
                      <div
                        style={{
                          flex: 1,
                          border: "none",
                          background: "transparent",
                          color: "var(--Black-Black, #0E101A)",
                          fontSize: "14px",
                          fontFamily: "Inter",
                          fontWeight: "400",
                          outline: "none",
                        }}
                      >{formData.itemBarcode || ""}
                      </div>
                    </div>
                  </div>

                  {/* hsn code */}
                  {selectedHSN ? <div
                    style={{
                      minWidth: "400px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: "4px",
                      }}
                    >
                      <span
                        style={{
                          color: "var(--Black-Grey, #727681)",
                          fontSize: "12px",
                          fontFamily: "Inter",
                          fontWeight: "400",
                          lineHeight: "14.40px",
                        }}
                      >
                        HSN
                      </span>
                      <span
                        style={{
                          color: "var(--Danger, #D00003)",
                          fontSize: "12px",
                          fontFamily: "Inter",
                          fontWeight: "400",
                          lineHeight: "14.40px",
                        }}
                      >
                        *
                      </span>
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: "40px",
                        padding: "0 12px",
                        background: "white",
                        borderRadius: "8px",
                        border: "1px var(--White-Stroke, #EAEAEA) solid",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "8px",
                        display: "flex",
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          fontSize: "14px",
                          fontFamily: "Inter",
                          fontWeight: "400",
                          color: "var(--Black-Black, #0E101A)",
                        }}
                      >
                        {selectedHSN?.label.length > 50 ? selectedHSN?.label.slice(0, 50) + "..." : selectedHSN?.label}
                      </div>
                    </div>
                  </div> : ("")}
                </div>
              </div>

              {/* Lot No. Section */}
              {lotDetails?.lotNo || lotDetails?.lotmrp || lotDetails?.fabricBatchNo || lotDetails?.productionDate || lotDetails?.designCode || lotDetails?.quantity || lotDetails?.size || lotDetails?.color ? <div style={{ width: "1660px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "7px",
                    marginBottom: "8px",
                  }}
                >
                  <label
                    onClick={() => setIsOn(!isOn)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      fontSize: "16px",
                      // fontFamily: "Inter",
                      fontWeight: "500",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    {/* Toggle Switch */}
                    <div
                      style={{
                        width: "40px",
                        height: "22px",
                        borderRadius: "50px",
                        backgroundColor: isOn ? "#1F7FFF" : "#ccc",
                        position: "relative",
                        transition: "background-color 0.3s ease",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: "2px",
                          left: isOn ? "20px" : "2px",
                          width: "18px",
                          height: "18px",
                          borderRadius: "50%",
                          background: "white",
                          transition: "left 0.3s ease",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                        }}
                      ></div>
                    </div>

                    {/* Label Text */}
                    <span style={{ color: "#212436" }}>Lot No</span>
                  </label>
                </div>

                {isOn && (
                  <>
                    <div
                      style={{
                        width: "100%",
                        padding: "10px 30px",
                        background: "white",
                        borderRadius: "8px",
                        justifyContent: "center",
                        alignItems: "flex-start",
                        display: "flex",
                        overflowX: "auto",
                        backgroundColor: "#E5F0FF",
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: `repeat(${lotColumns.length}, minmax(100px, 1fr))`,
                          gap: "0 8px",
                          alignItems: "center",
                          width: "100%",
                        }}
                      >
                        {lotColumns.map((col, index) => (
                          <div
                            key={index}
                            style={{
                              height: "auto",
                              padding: "8px 0px",
                              justifyContent: "center",
                              alignItems: "center",
                              gap: "0px",
                              display: "flex",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                width: "100%",
                                alignItems: "center",
                              }}
                            >
                              <span
                                style={{
                                  padding: "4px",
                                }}
                              >
                                {col.label}
                              </span>
                              <div
                                style={{
                                  borderTopLeftRadius:
                                    index < lotColumns.length - 7 ? "8px" : "none",
                                  borderBottomLeftRadius:
                                    index < lotColumns.length - 7 ? "8px" : "none",
                                  borderTopRightRadius:
                                    index < lotColumns.length - 1 ? "" : "8px",
                                  borderBottomRightRadius:
                                    index < lotColumns.length - 1 ? "" : "8px",
                                  backgroundColor: "white",
                                  width: "200px",
                                  padding: "8px 16px",
                                  borderRight: index < lotColumns.length - 1 ? "1px solid #EAEAEA" : "none",
                                }}
                              >
                                <div
                                  style={{
                                    padding: "0 12px",
                                    borderRadius: "8px",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    display: "flex",
                                    border: "1px solid gray",
                                  }}
                                >
                                  <div
                                    style={{
                                      color: "var(--Black, #212436)",
                                      fontSize: "18px",
                                      outline: "none",
                                      fontFamily: "Inter",
                                      fontWeight: "500",
                                      textAlign: "center",
                                      border: "none",
                                      background: "transparent",
                                      width: "100%",
                                    }}
                                  >{lotDetails[lotFieldKeys[index]] || "-"}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div
                      style={{
                        width: "1832px",
                        height: "1px",
                        background: "var(--Stroke, #EAEAEA)",
                        marginTop: "15px",
                      }}
                    />
                  </>
                )}
              </div> : ("")}

              {/* Pricing & Variants */}
              <div style={{}} className="delete-hover">
                <div
                  style={{
                    color: "black",
                    fontSize: "16px",
                    fontFamily: "Inter",
                    fontWeight: "500",
                    lineHeight: "19.20px",
                  }}
                >
                  Pricing & Variants
                </div>

                {/* variant section */}
                {variants.map((variant, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      gap: "16px",
                      // marginTop:'16px',
                      width: '1830px',
                      overflowX: 'scroll',
                      padding: '16px 8px',
                    }}
                  // className="row"
                  >
                    {/* Purchasing Price*/}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        width: "195px",
                      }}
                      className="col-1"
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: "4px",
                        }}
                      >
                        <span
                          style={{
                            color: "var(--Black-Grey, #727681)",
                            fontSize: "12px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            lineHeight: "14.40px",
                          }}
                        >
                          Purchasing Price
                        </span>
                        <span
                          style={{
                            color: "var(--Danger, #D00003)",
                            fontSize: "12px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            lineHeight: "14.40px",
                          }}
                        >
                          *
                        </span>
                      </div>
                      <div
                        style={{
                          height: "40px",
                          padding: "0 12px",
                          background: "white",
                          borderRadius: "8px",
                          border: "1px var(--White-Stroke, #EAEAEA) solid",
                          justifyContent: "flex-start",
                          alignItems: "center",
                          gap: "8px",
                          display: "flex",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <div
                            style={{
                              width: "100%",
                              border: "none",
                              background: "transparent",
                              color: "var(--Black-Black, #0E101A)",
                              fontSize: "14px",
                              fontFamily: "Inter",
                              fontWeight: "400",
                              outline: "none",
                            }}
                          >{variant.purchasePrice || ""}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* MRP */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        width: "195px",
                      }}
                      className="col-1"
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: "4px",
                        }}
                      >
                        <span
                          style={{
                            color: "var(--Black-Grey, #727681)",
                            fontSize: "12px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            lineHeight: "14.40px",
                          }}
                        >
                          MRP
                        </span>
                        <span
                          style={{
                            color: "var(--Danger, #D00003)",
                            fontSize: "12px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            lineHeight: "14.40px",
                          }}
                        >
                          *
                        </span>
                      </div>
                      <div
                        style={{
                          height: "40px",
                          padding: "0 12px",
                          background: "white",
                          borderRadius: "8px",
                          border: "1px var(--White-Stroke, #EAEAEA) solid",
                          justifyContent: "flex-start",
                          alignItems: "center",
                          gap: "8px",
                          display: "flex",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <div
                            style={{
                              width: "100%",
                              border: "none",
                              background: "transparent",
                              color: "var(--Black-Black, #0E101A)",
                              fontSize: "14px",
                              fontFamily: "Inter",
                              fontWeight: "400",
                              outline: "none",
                            }}
                          >{variant.mrp || ""}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Selling Price */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        width: "195px",
                      }}
                      className="col-1"
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: "4px",
                        }}
                      >
                        <span
                          style={{
                            color: "var(--Black-Grey, #727681)",
                            fontSize: "12px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            lineHeight: "14.40px",
                          }}
                        >
                          Selling Price
                        </span>
                        <span
                          style={{
                            color: "var(--Danger, #D00003)",
                            fontSize: "12px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            lineHeight: "14.40px",
                          }}
                        >
                          *
                        </span>
                      </div>
                      <div
                        style={{
                          height: "40px",
                          padding: "0 12px",
                          background: "white",
                          borderRadius: "8px",
                          border: "1px var(--White-Stroke, #EAEAEA) solid",
                          justifyContent: "flex-start",
                          alignItems: "center",
                          gap: "8px",
                          display: "flex",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <div
                            style={{
                              width: "100%",
                              border: "none",
                              background: "transparent",
                              color: "var(--Black-Black, #0E101A)",
                              fontSize: "14px",
                              fontFamily: "Inter",
                              fontWeight: "400",
                              outline: "none",
                            }}
                          >{variant.sellingPrice || ""}
                          </div>
                        </div>
                      </div>
                      <span
                        style={{
                          color: "var(--Black-Black, #0E101A)",
                          fontSize: "11px",
                          fontFamily: "Inter",
                          fontWeight: "400",
                          lineHeight: "14.40px",
                        }}
                      >
                        Profit -{" "}
                        <span
                          style={{
                            color: "var(--Black-Black, green)",
                            fontSize: "11px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            lineHeight: "14.40px",
                          }}
                        >
                          ₹ {(variant.sellingPrice - variant.purchasePrice).toFixed(2)} (
                          {(((variant.sellingPrice - variant.purchasePrice) / variant.purchasePrice) * 100).toFixed(2)}%)
                        </span>
                      </span>
                    </div>

                    {/* TAX */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        width: "195px",
                      }}
                      className="col-1"
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: "4px",
                        }}
                      >
                        <span
                          style={{
                            color: "var(--Black-Grey, #727681)",
                            fontSize: "12px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            lineHeight: "14.40px",
                          }}
                        >
                          Tax
                        </span>
                        <span
                          style={{
                            color: "var(--Danger, #D00003)",
                            fontSize: "12px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            lineHeight: "14.40px",
                          }}
                        >
                          *
                        </span>
                      </div>
                      <div
                        style={{
                          height: "40px",
                          padding: "0 12px",
                          background: "white",
                          borderRadius: "8px",
                          border: "1px var(--White-Stroke, #EAEAEA) solid",
                          justifyContent: "flex-start",
                          alignItems: "center",
                          gap: "8px",
                          display: "flex",
                        }}
                      >
                        <div
                          style={{
                            width: "100%",
                            border: "none",
                            background: "transparent",
                            color: "var(--Black-Black, #0E101A)",
                            fontSize: "14px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            outline: "none",
                          }}
                        >{variant.tax || ""}%
                        </div>
                      </div>
                      <span
                        style={{
                          color: "var(--Black-Black, #0E101A)",
                          fontSize: "11px",
                          fontFamily: "Inter",
                          fontWeight: "400",
                          lineHeight: "14.40px",
                        }}
                      >
                        TAX amount -{" "}
                        <span
                          style={{
                            color: "var(--Black-Black, red)",
                            fontSize: "11px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            lineHeight: "14.40px",
                          }}
                        >
                          ₹{(variant.sellingPrice * variant.tax / 100).toFixed(2)}/-
                        </span>
                      </span>
                    </div>

                    {/* Size */}
                    {variant.size ? <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        width: "195px",
                      }}
                      className="col-1"
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: "4px",
                        }}
                      >
                        <span
                          style={{
                            color: "var(--Black-Grey, #727681)",
                            fontSize: "12px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            lineHeight: "14.40px",
                          }}
                        >
                          Size
                        </span>
                        <span
                          style={{
                            color: "var(--Danger, #D00003)",
                            fontSize: "12px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            lineHeight: "14.40px",
                          }}
                        >
                          *
                        </span>
                      </div>
                      <div
                        style={{
                          height: "40px",
                          padding: "0 12px",
                          background: "white",
                          borderRadius: "8px",
                          border: "1px var(--White-Stroke, #EAEAEA) solid",
                          justifyContent: "flex-start",
                          alignItems: "center",
                          gap: "8px",
                          display: "flex",
                        }}
                      >
                        <div
                          style={{
                            width: "100%",
                            border: "none",
                            background: "transparent",
                            color: "var(--Black-Black, #0E101A)",
                            fontSize: "14px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            outline: "none",
                          }}
                        >{variant.size === 'XS' ? 'Extra Small (XS)' : variant.size === 'S' ? 'Small (S)' : variant.size === 'M' ? 'Medium (M)' : variant.size === 'L' ? 'Large (L)' : variant.size === 'XL' ? 'Extra Large (XL)' : '-' || "-"}
                        </div>
                      </div>
                    </div> : ("")}

                    {/* Color */}
                    {variant.color ? <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        width: "195px",
                      }}
                      className="col-1"
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: "4px",
                        }}
                      >
                        <span
                          style={{
                            color: "var(--Black-Grey, #727681)",
                            fontSize: "12px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            lineHeight: "14.40px",
                          }}
                        >
                          Color
                        </span>
                        <span
                          style={{
                            color: "var(--Danger, #D00003)",
                            fontSize: "12px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            lineHeight: "14.40px",
                          }}
                        >
                          *
                        </span>
                      </div>
                      <div
                        style={{
                          height: "40px",
                          padding: "0 12px",
                          background: "white",
                          borderRadius: "8px",
                          border: "1px var(--White-Stroke, #EAEAEA) solid",
                          justifyContent: "flex-start",
                          alignItems: "center",
                          gap: "8px",
                          display: "flex",
                        }}
                      >
                        <div
                          style={{
                            width: "100%",
                            border: "none",
                            background: "transparent",
                            color: "var(--Black-Black, #0E101A)",
                            fontSize: "14px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            outline: "none",
                          }}
                        >{variant.color || ""}
                        </div>
                      </div>
                    </div> : ("")}

                    {/* expiry */}
                    {variant.expiryDate ? <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        width: "195px",
                      }}
                      className="col-1"
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: "4px",
                        }}
                      >
                        <span
                          style={{
                            color: "var(--Black-Grey, #727681)",
                            fontSize: "12px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            lineHeight: "14.40px",
                          }}
                        >
                          Expiry Date
                        </span>
                        <span
                          style={{
                            color: "var(--Danger, #D00003)",
                            fontSize: "12px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            lineHeight: "14.40px",
                          }}
                        >
                          *
                        </span>
                      </div>
                      <div
                        style={{
                          height: "40px",
                          padding: "0 12px",
                          background: "white",
                          borderRadius: "8px",
                          border: "1px var(--White-Stroke, #EAEAEA) solid",
                          justifyContent: "flex-start",
                          alignItems: "center",
                          gap: "8px",
                          display: "flex",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <input
                            type="date"
                            name="expiryDate"
                            value={variant.expiryDate || ""}
                            onChange={(e) => handleVariantChange(index, "expiryDate", e.target.value)}
                            style={{
                              width: "145px",
                              border: "none",
                              background: "transparent",
                              color: "var(--Black-Black, #0E101A)",
                              fontSize: "14px",
                              fontFamily: "Inter",
                              fontWeight: "400",
                            }}
                          />
                        </div>
                      </div>
                    </div> : ("")}

                    {/* unit */}
                    {variant.unit ? <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        width: "195px",
                      }}
                      className="col-1"
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: "4px",
                        }}
                      >
                        <span
                          style={{
                            color: "var(--Black-Grey, #727681)",
                            fontSize: "12px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            lineHeight: "14.40px",
                          }}
                        >
                          Unit
                        </span>
                        <span
                          style={{
                            color: "var(--Danger, #D00003)",
                            fontSize: "12px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            lineHeight: "14.40px",
                          }}
                        >
                          *
                        </span>
                      </div>
                      <div
                        style={{
                          height: "40px",
                          padding: "0 12px",
                          background: "white",
                          borderRadius: "8px",
                          border: "1px var(--White-Stroke, #EAEAEA) solid",
                          justifyContent: "flex-start",
                          alignItems: "center",
                          gap: "8px",
                          display: "flex",
                        }}
                      >
                        <select
                          name="unit"
                          value={variant.unit || ""}
                          onChange={(e) => handleVariantChange(index, "unit", e.target.value)}
                          style={{
                            width: "100%",
                            border: "none",
                            background: "transparent",
                            color: "var(--Black-Black, #0E101A)",
                            fontSize: "14px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            outline: "none",
                          }}
                        >
                          <option value="">Select Unit</option>
                          <option value="Piece">Piece</option>
                          <option value="Kg">Kg</option>
                          <option value="Liter">Liter</option>
                          <option value="Metre">Metre</option>
                        </select>
                      </div>
                    </div> : ("")}

                    {/* Opening Quantity */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        width: "195px",
                      }}
                      className="col-1"
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: "4px",
                        }}
                      >
                        <span
                          style={{
                            color: "var(--Black-Grey, #727681)",
                            fontSize: "12px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            lineHeight: "14.40px",
                          }}
                        >
                          Opening Quantity
                        </span>
                        <span
                          style={{
                            color: "var(--Danger, #D00003)",
                            fontSize: "12px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            lineHeight: "14.40px",
                          }}
                        >
                          *
                        </span>
                      </div>
                      <div
                        style={{
                          height: "40px",
                          padding: "0 12px",
                          background: "white",
                          borderRadius: "8px",
                          border: "1px var(--White-Stroke, #EAEAEA) solid",
                          justifyContent: "flex-start",
                          alignItems: "center",
                          gap: "8px",
                          display: "flex",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <div
                            style={{
                              width: "100%",
                              border: "none",
                              background: "transparent",
                              color: "var(--Black-Black, #0E101A)",
                              fontSize: "14px",
                              fontFamily: "Inter",
                              fontWeight: "400",
                            }}
                          >{variant.openingQuantity || ""}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Min. Stock to Maintain */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        width: "195px",
                      }}
                      className="col-1"
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: "4px",
                        }}
                      >
                        <span
                          style={{
                            color: "var(--Black-Grey, #727681)",
                            fontSize: "12px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            lineHeight: "14.40px",
                          }}
                        >
                          Min. Stock to Maintain
                        </span>
                        <span
                          style={{
                            color: "var(--Danger, #D00003)",
                            fontSize: "12px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            lineHeight: "14.40px",
                          }}
                        >
                          *
                        </span>
                      </div>
                      <div
                        style={{
                          height: "40px",
                          padding: "0 12px",
                          background: "white",
                          borderRadius: "8px",
                          border: "1px var(--White-Stroke, #EAEAEA) solid",
                          justifyContent: "flex-start",
                          alignItems: "center",
                          gap: "8px",
                          display: "flex",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <div
                            style={{
                              width: "100%",
                              border: "none",
                              background: "transparent",
                              color: "var(--Black-Black, #0E101A)",
                              fontSize: "14px",
                              fontFamily: "Inter",
                              fontWeight: "400",
                            }}
                          >{variant.minStockToMaintain || ""}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Discount Section */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        width: "195px",
                      }}
                      className="col-2"
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: "4px",
                        }}
                      >
                        <span
                          style={{
                            color: "var(--Black-Grey, #727681)",
                            fontSize: "12px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            lineHeight: "14.40px",
                          }}
                        >
                          Discount Price
                        </span>
                        <span
                          style={{
                            color: "var(--Danger, #D00003)",
                            fontSize: "12px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            lineHeight: "14.40px",
                          }}
                        >
                          *
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }} className="">
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
                          <div
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
                              display: "flex",
                              alignItems: "center",
                            }}
                          >{variant.discountAmount || ""}
                          </div>
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
                            }}
                          >
                            <span
                              style={{
                                color: "var(--Black-Secondary, #6C748C)",
                                fontSize: "14px",
                                fontFamily: "Poppins",
                                fontWeight: "400",
                              }}
                            >
                              <div
                                style={{
                                  color: "var(--Black-Secondary, #6C748C)",
                                  fontSize: "14px",
                                  fontFamily: "Poppins",
                                  fontWeight: "400",
                                  border: "none",
                                  background: "transparent",
                                }}
                              >{variant.discountType === 'Fixed' ? '₹' : variant.discountType === 'Percentage' ? '%' : '-' || "-"}
                              </div>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Delete button */}
                    {/* <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        width: "50px",
                      }}
                      className="col-1"
                    >
                      <div
                        className=""
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          height: "100%",
                          cursor: index === 0 ? "not-allowed" : "pointer",
                        }}
                        onClick={() => {
                          if (index === 0) return;
                          if (variants.length <= 1) return;
                          setVariants(variants.filter((_, i) => i !== index));
                        }}
                      >
                        <RiDeleteBinLine className="delete-hover-icon text-danger fs-5" />
                      </div>
                    </div> */}
                  </div>
                ))}

                {/* add variant button */}
                {/* <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "7px",
                    marginTop: "16px",
                  }}
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
                      cursor: "pointer",
                      borderRadius: "4px",
                    }}
                    onClick={() => setVariants([...variants, {}])}
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
                      lineHeight: "19.20px",
                    }}
                  >
                    Add New Variant
                  </span>
                </div> */}
              </div>

              {images.length > 0 && (
                <>
                  <div
                    style={{
                      width: "1832px",
                      height: "1px",
                      background: "var(--Stroke, #EAEAEA)",
                    }}
                  />

                  {/* Import Images */}
                  <div
                    style={{
                      width: "auto",
                      minWidth: "280px",
                      borderRadius: "8px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                      border: "1px solid #EAEAEA",
                      padding: "16px",
                    }}
                  >
                    <div className="d-flex justify-content-start align-items-center gap-4">
                      <div
                        style={{
                          color: "black",
                          fontSize: "16px",
                          fontFamily: "Inter",
                          fontWeight: "500",
                        }}
                      >
                        Imported Images
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-start",
                        alignItems: "flex-start",
                        gap: "24px",
                        width: "100%",
                        flexWrap: "wrap",
                      }}
                    >
                      {variants.map((variant, index) => (
                        <div
                          key={index}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "16px",
                          }}
                        >

                          {images.length === 0 ? (
                            <>
                              <label
                                htmlFor={`variant-image-${index}`}
                                style={{
                                  width: "350px",
                                  height: "200px",
                                  cursor: "pointer",
                                  display: "flex",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  border: "2px dashed #EAEAEA",
                                  borderRadius: "8px",
                                }}
                              >
                                {/* Preview OR placeholder */}
                                {variant.images?.length ? (
                                  variant.images.map((f, i) => (
                                    <img
                                      key={i}
                                      src={f.preview}
                                      alt="preview"
                                      style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        pointerEvents: "none",
                                      }}
                                    />
                                  ))
                                ) : (
                                  <div
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      justifyContent: "center",
                                      alignItems: "center",
                                      gap: 8,
                                      color: "#727681",
                                      pointerEvents: "none",
                                    }}
                                  >
                                    <FcAddImage size={30} />
                                    <span style={{ color: "#727681" }}>
                                      Drag image here or <span style={{ color: "#1F7FFF" }}>browse</span>
                                    </span>
                                    <span style={{ fontSize: 12, color: "#727681" }}>
                                      JPEG, PNG, JPG (max 1MB)
                                    </span>
                                  </div>
                                )}

                                <input
                                  id={`variant-image-${index}`}
                                  type="file"
                                  multiple
                                  accept="image/jpeg,image/png,image/jpg"
                                  onChange={(e) => handleVariantImageChange(index, e)}
                                  style={{ display: "none" }}
                                />
                              </label>
                            </>
                          ) : (
                            <>
                              <div className="row mt-2" style={{ gap: 12 }}>
                                {images.map((file, i) => (
                                  <div
                                    className="col-auto"
                                    key={i}
                                    style={{ position: "relative", }}
                                  >
                                    <img
                                      src={file.url || file.preview}
                                      className="img-thumbnail"
                                      style={{
                                        height: 100,
                                        width: 100,
                                        objectFit: "cover",
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>)}

            </div>
          </div>
        </form>

      </div>

      {showAddCategoryModel && (
        <CreateCategoryModal
          closeModal={() => setShowAddCategoryModel(false)}
          modalId="categoryModal"
          title={[t("Add Category")]}
          categoryName={categoryName}
          onCategoryChange={(e) => setCategoryName(e.target.value)}
          subCategoryName={subCategoryName}
          onSubCategoryChange={(e) => setSubCategoryName(e.target.value)}
          onSubmit={handleSubmitCategory}
          submitLabel={[t("Save")]}
          errors={errors}
        />
      )}

    </div>

  );
};

export default ProductView;
