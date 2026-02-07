import React, { useEffect, useState, useRef } from "react";
import "./product.css";
import Select from "react-select";
import { Link, useNavigate } from "react-router-dom";
import BASE_URL from "../../../../pages/config/config";
import axios from "axios";
import { toast } from "react-toastify";
import { MdImageSearch } from "react-icons/md";
import { TbTrash } from "react-icons/tb";
import CategoryModal from "../../../../pages/Modal/categoryModals/CategoryModal";
import { TbChevronUp, TbEye, TbRefresh } from "react-icons/tb";
import { useTranslation } from "react-i18next";
import DOMPurify from "dompurify";

//Full Redesign-------------------------------------------------------------------------------------------------
import { NavLink } from "react-router-dom";

import { FaArrowLeft } from "react-icons/fa6";
import { FiUpload, FiCheck, FiChevronDown } from "react-icons/fi";
import { RiDeleteBinLine } from "react-icons/ri";
import { FcAddImage } from "react-icons/fc";
import { MdLockOutline } from "react-icons/md";
import { BsThreeDotsVertical } from "react-icons/bs";

import AiLogo from "../../../../assets/images/AI.png";
import api from "../../../../pages/config/axiosInstance"
import { useAuth } from "../../../auth/AuthContext";
import CreateCategoryModal from "../../category/CreateCategoryModel"
import CreateSubCategoryModel from "../../category/CreateSubCategoryModel";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";

const ProductForm = () => {
  const { t } = useTranslation();

  const [dropdown, setDropDown] = useState(false);
  const [dropdownSubCat, setDropDownSubCat] = useState(false);
  const dropdownRef = useRef(null);
  const dropdownSubCatRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropDown(false);
      }
      if (dropdownSubCatRef.current && !dropdownSubCatRef.current.contains(event.target)) {
        setDropDownSubCat(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const [isOn, setIsOn] = useState(false);
  const [showAddCategoryModel, setShowAddCategoryModel] = useState(false);
  const [showAddSubCategoryModel, setShowAddSubCategoryModel] = useState(false);
  const modelAddRef = useRef(null);
  const [subCategoryName, setSubCategoryName] = useState("");
  const [errors, setErrors] = useState({});
  const [highlightedFields, setHighlightedFields] = useState([]);

  const [settings, setSettings] = useState({
    brand: false,
    description: false,
    category: false,
    subcategory: false,
    itembarcode: false,
    hsn: false,
    lotno: false,
    supplier: false,
    status: false,
    serialno: false,
    units: false,
    expiry: false,
  });

  useEffect(() => {
    fetchSettings();
    fetchBrands();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/api/system-settings');
      if (response.data.success) {
        const data = response.data.data;
        setSettings({
          brand: data.brand || false,
          description: data.description || false,
          category: data.category || false,
          subcategory: data.subcategory || false,
          itembarcode: data.itembarcode || false,
          hsn: data.hsn || false,
          lotno: data.lotno || false,
          supplier: data.supplier || false,
          status: data.status || false,
          serialno: data.serialno || false,
          units: data.units || false,
          expiry: data.expiry || false,
        });
      }
    } catch (error) {
      // console.error("Error fetching system settings:", error);
      toast.error("Failed to fetch system settings");
    }
  };

  const fetchBrands = async () => {
    try {
      const res = await api.get("/api/brands/active-brands");
      const options = res.data.brands.map((brand) => ({
        value: brand._id,
        label: sanitizeInput(brand.brandName, true),
      }));
      setBrandOptions(options);
    } catch (error) {
      // console.error("Fetch Brands Error:",error.response?.data || error.message);
    }
  };

  const handleBrandChange = (selectedOption) => {
    setSelectedBrands(selectedOption);
  };

  const [suppliers, setSuppliers] = useState([]);

  const fetchSuppliers = async () => {
    try {
      const res = await api.get("/api/suppliers");
      // console.log('ressssss', res.data)
      setSuppliers(res.data.suppliers || []);
    } catch (err) {
      // console.error(err);
    } finally {
      // setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const [addserialpopup, setAddSerialPopup] = useState(false);
  const [currentVariantIndex, setCurrentVariantIndex] = useState(null);

  const handleAddSerialField = () => {
    if (currentVariantIndex === null) return;
    setVariants((prev) => {
      const updated = [...prev];
      const variant = { ...updated[currentVariantIndex] };
      const serials = variant.serialNumbers ? [...variant.serialNumbers] : [];
      serials.push("");
      variant.serialNumbers = serials;
      variant.openingQuantity = serials.length; // Update quantity
      updated[currentVariantIndex] = variant;
      return updated;
    });
  };

  const handleSerialChange = (sIndex, value) => {
    setVariants((prev) => {
      const updated = [...prev];
      const variant = { ...updated[currentVariantIndex] };
      const serials = [...(variant.serialNumbers || [])];
      serials[sIndex] = value;
      variant.serialNumbers = serials;
      updated[currentVariantIndex] = variant;
      return updated;
    });
  };

  const handleRemoveSerial = (sIndex) => {
    setVariants((prev) => {
      const updated = [...prev];
      const variant = { ...updated[currentVariantIndex] };
      const serials = [...(variant.serialNumbers || [])];
      serials.splice(sIndex, 1);
      variant.serialNumbers = serials;
      variant.openingQuantity = serials.length; // Update quantity
      updated[currentVariantIndex] = variant;
      return updated;
    });
  };

  useEffect(() => {
    if (addserialpopup && currentVariantIndex !== null) {
      const variant = variants[currentVariantIndex];
      if (!variant.serialNumbers || variant.serialNumbers.length === 0) {
        handleAddSerialField();
      }
    }
  }, [addserialpopup, currentVariantIndex]);

  const [lotDetails, setLotDetails] = useState({
    lotNo: "",
    quantity: "",
  });

  const validationPatterns = {
    productName: /^[A-Za-z0-9\s\-]{2,50}$/,
    price: /^\d+(\.\d{1,2})?$/,
    quantity: /^(?:[1-9]\d*)$/,
    description: /^[\w\s.,!?\-]{0,300}$/,
    seoTitle: /^[a-zA-Z0-9\s\-]{2,60}$/,
    seoDescription: /^[a-zA-Z0-9\s\-,.]{2,160}$/,
    serialNumber: /^[A-Z0-9\-]{1,50}$/,
    categoryName: /^[A-Za-z\s]{2,50}$/,
    categorySlug: /^[a-z0-9\-]{2,50}$/,
    variantValue: /^[a-zA-Z0-9\s,]{1,100}$/,
  };

  const sanitizeInput = (value, preserveSpaces = false) => {
    if (typeof value !== "string") return value;
    let input = value;
    // Remove HTML tags
    input = input.replace(/<[^>]*>?/gm, "");
    // Normalize whitespace
    input = preserveSpaces
      ? input.replace(/\s+/g, " ")
      : input.trim().replace(/\s+/g, " ");
    // Remove dangerous characters (optional)
    input = input.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
    // DOMPurify fallback for extra safety
    input = DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
    return input;
  };

  const steps = [
    t("descriptionAndMedia"),
    t("pricing"),
    t("images"),
    t("variants"),
  ];

  // const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [stepStatus, setStepStatus] = useState(
    Array(steps.length).fill("pending")
  );
  // const [images, setImages] = useState([]); // Removed unused global images
  // const variantImageInputRef = useRef(null); // Removed unused ref
  const objectUrlsRef = useRef([]);
  const [formErrors, setFormErrors] = useState({});
  const [variants, setVariants] = useState([
    { selectedVariant: "", selectedValue: "", valueDropdown: [] },
  ]);

  const inputChange = (key, value) => {
    // setFormData((prev) => ({ ...prev, [key]: value }));
    const sanitizedValue = sanitizeInput(value, true);
    const error = validateField(key, sanitizedValue);
    setFormErrors((prev) => ({ ...prev, [key]: error }));
    setFormData((prev) => ({ ...prev, [key]: sanitizedValue }));
  };

  useEffect(() => {
    return () => {
      // Cleanup object URLs
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const validateStep = () => {
    const newErrors = {};

    // Step 0: Basic Info
    if (!formData.productName)
      newErrors.productName = "Product Name is required";
    if (
      formData.productName &&
      !validationPatterns.productName.test(formData.productName)
    )
      newErrors.productName = "Invalid Product Name";
    if (!selectedCategory) newErrors.category = "Category is required";
    if (!selectedsubCategory)
      newErrors.subCategory = "Subcategory is required";
    if (!formData.store) newErrors.store = "Store is required";
    if (!selectedWarehouse) newErrors.warehouse = "Warehouse is required";
    if (!selectedHSN) newErrors.hsn = "HSN Code is required";
    if (formData.itemType === "Good" && !selectedBrands)
      newErrors.brand = "Brand is required";
    if (formData.isAdvanced) {
      if (formData.trackType === "serial" && !formData.serialNumber)
        newErrors.serialNumber = "Serial Number is required";
      if (settings.supplier && !formData.supplier)
        newErrors.supplier = "Supplier is required";
      if (
        formData.serialNumber &&
        !validationPatterns.serialNumber.test(formData.serialNumber)
      )
        newErrors.serialNumber = "Invalid Serial Number";
    }
    // Step 1: Pricing

    if (!formData.quantity) newErrors.quantity = "Quantity must be at least 1";
    if (
      formData.quantity &&
      !validationPatterns.quantity.test(formData.quantity)
    )
      newErrors.quantity = "Quantity atleast should be 1";
    if (!formData.tax) newErrors.sellingPrice = "Selling Price is required";
    if (
      formData.tax &&
      !validationPatterns.price.test(formData.tax)
    )
      newErrors.sellingPrice = "Selling Price must be a positive number with up to 2 decimal places";
    if (!formData.wholesalePrice)
      newErrors.wholesalePrice = "Wholesale Price must be a positive number with up to 2 decimal places";
    if (
      formData.wholesalePrice &&
      !validationPatterns.price.test(formData.wholesalePrice)
    )
      newErrors.wholesalePrice = "Wholesale Price is required";
    if (!formData.retailPrice) newErrors.retailPrice = "Retail Price must be a positive number with up to 2 decimal places";
    if (
      formData.retailPrice &&
      !validationPatterns.price.test(formData.retailPrice)
    )
      newErrors.retailPrice = "Retail Price is required";
    if (!selectedUnits) newErrors.unit = "Unit is required";
    if (!formData.taxType) newErrors.taxType = "Tax Type is required";
    if (!formData.tax) newErrors.tax = "Tax Rate is required";

    if (!formData.description) newErrors.description = "Description is required";
    if (
      formData.description &&
      (!validationPatterns.description.test(formData.description) || formData.description.length > 20)
    )
      newErrors.description = "Description must be valid and under 20 characters";
    if (
      formData.seoTitle &&
      !validationPatterns.seoTitle.test(formData.seoTitle)
    )
      newErrors.seoTitle = "Invalid SEO Title";
    if (
      formData.seoDescription &&
      !validationPatterns.seoDescription.test(formData.seoDescription)
    )
      newErrors.seoDescription = "Invalid SEO Description";
    // Optional: Add image validation if required
    // if (images.length === 0) newErrors.images = t("atLeastOneImageRequired");

    // Step 3: Variants
    const hasValidVariant = variants.some(
      (variant) => variant.selectedVariant && variant.selectedValue
    );
    if (!hasValidVariant) {
      newErrors.variants = "At least one variant with a valid value is required";
    }
    variants.forEach((variant, index) => {
      if (
        variant.selectedValue &&
        !validationPatterns.variantValue.test(variant.selectedValue)
      ) {
        newErrors[`variantValue_${index}`] = t("invalidVariantFormat");
      }
    });

    // Update formErrors state with new validation errors
    setFormErrors(newErrors);

    // Return array of error messages for toast notifications
    return Object.values(newErrors).filter(Boolean);
  };

  const handleNext = () => {
    const errors = validateStep();
    const updatedStatus = [...stepStatus];
    updatedStatus[step] = errors.length === 0 ? "complete" : "incomplete";
    setStepStatus(updatedStatus);

    if (errors.length === 0 && step < steps.length - 1) {
      setStep((prev) => prev + 1);
    } else if (errors.length > 0) {
      errors.forEach((error) => toast.error(error));
    }
  };
  const handlePrev = () => {
    if (step > 0) setStep((prev) => prev - 1);
  };

  const handleVariantImageChange = (index, event) => {
    const files = Array.from(event.target.files || []);
    const currentImages = variants[index]?.images || [];

    if (currentImages.length + files.length > 6) {
      toast.error("Maximum 6 images allowed per variant");
      event.target.value = "";
      return;
    }

    const maxSize = 1 * 1024 * 1024;
    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    const validFiles = [];
    const invalidFiles = [];
    files.forEach((file) => {
      if (!validTypes.includes(file.type)) {
        invalidFiles.push({
          file,
          error: `Invalid file type for ${file.name}. Only JPEG, PNG, or JPG allowed.`,
        });
      } else if (file.size > maxSize) {
        invalidFiles.push({
          file,
          error: `Image ${file.name} exceeds 1MB limit.`,
        });
      } else {
        const url = URL.createObjectURL(file);
        objectUrlsRef.current.push(url);
        validFiles.push(Object.assign(file, { preview: url }));
      }
    });
    if (invalidFiles.length > 0) {
      invalidFiles.forEach(({ error }) => toast.error(error));
      setFormErrors((prev) => ({
        ...prev,
        [`variantImages_${index}`]: "Image size should not exceeded 1MB.",
      }));
    }
    if (validFiles.length > 0) {
      setVariants((prev) => {
        const updated = [...prev];
        const variant = { ...updated[index] };
        variant.images = [...(variant.images || []), ...validFiles];
        updated[index] = variant;
        return updated;
      });

      setFormErrors((prev) => ({ ...prev, [`variantImages_${index}`]: "" }));
    }
    event.target.value = "";
  };

  const handleRemoveImage = (variantIndex, fileToRemove) => {
    setVariants((prev) => {
      const updated = [...prev];
      const variant = { ...updated[variantIndex] };
      if (fileToRemove.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      variant.images = (variant.images || []).filter((f) => f !== fileToRemove);
      updated[variantIndex] = variant;
      return updated;
    });
  };

  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedsubCategory, setSelectedsubCategory] = useState(null);
  const [selectedBrands, setSelectedBrands] = useState(null);
  const [selectedUnits, setSelectedUnits] = useState(null);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [brandOptions, setBrandOptions] = useState([]);
  const [, setSelectedSubcategory] = useState(null);
  const [unitsOptions, setUnitsOptions] = useState([]);
  const [options, setOptions] = useState([]);
  const [optionsware, setOptionsWare] = useState([]);
  // const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);

  const [formData, setFormData] = useState({
    productName: "",
    itemBarcode: "",   // ✅ ADD
    purchasePrice: "",
    sellingPrice: "",
    tax: "",
    units: "",
    openingQuantity: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    const sanitizedValue = sanitizeInput(value, true);
    const error = validateField(name, sanitizedValue);
    setFormErrors((prev) => ({ ...prev, [name]: error }));

    // If switching itemType, reset fields specific to the other type
    if (name === "itemType") {
      if (value === "Service") {
        // Clear all Good-specific fields
        setFormData((prev) => ({
          ...prev,
          itemType: value,
          wholesalePrice: "",
          retailPrice: "",
          quantity: "",
          unit: "",
          taxType: "",
          tax: "",
          description: "",
          seoTitle: "",
          seoDescription: "",
          sellingType: "",
          barcodeSymbology: "",
          productType: "Single",
          isAdvanced: false,
          trackType: "serial",
          isReturnable: false,
          serialNumber: "",
          supplier: "",
          returnable: false,
        }));
      } else if (value === "Good") {
        // Clear all Service-specific fields (if any in future)
        setFormData((prev) => ({
          ...prev,
          itemType: value,
          // Add service-specific fields here if needed
        }));
      } else {
        setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
    }
  };

  const handleVariantChange = (index, field, value) => {
    const updatedVariants = [...variants];
    updatedVariants[index] = { ...updatedVariants[index], [field]: value };
    setVariants(updatedVariants);
  };

  const validateField = (name, value) => {
    if (
      !value &&
      [
        "productName",
        "quantity",
      ].includes(name)
    ) {
      return t("fieldRequired");
    }

    switch (name) {
      case "productName":
        return validationPatterns.productName.test(value)
          ? ""
          : t("invalidProductName");
      // case "itemBarcode":
      //   return validationPatterns.itemBarcode.test(value) ? "" : t("invalidBarcodeFormat");
      case "purchasePrice":
      case "sellingPrice":
      case "wholesalePrice":
      case "retailPrice":
        return validationPatterns.price.test(value)
          ? ""
          : t("invalidPriceFormat");
      case "quantity":
        return validationPatterns.quantity.test(value)
          ? ""
          : t("invalidQuantityFormat");
      case "description":
        return validationPatterns.description.test(value)
          ? ""
          : t("invalidDescriptionFormat");
      case "seoTitle":
        return validationPatterns.seoTitle.test(value)
          ? ""
          : t("invalidSeoTitleFormat");
      case "seoDescription":
        return validationPatterns.seoDescription.test(value)
          ? ""
          : t("invalidSeoDescriptionFormat");
      case "serialNumber":
        return validationPatterns.serialNumber.test(value)
          ? ""
          : t("invalidSerialNumberFormat");
      case "supplier":
        return validationPatterns.supplier.test(value)
          ? ""
          : t("invalidSupplierFormat");
      case "batchNumber":
        return validationPatterns.batchNumber.test(value)
          ? ""
          : t("invalidBatchNumberFormat");
      case "discountValue":
        return validationPatterns.discountValue.test(value)
          ? ""
          : t("invalidDiscountValueFormat");
      case "categoryName":
        return validationPatterns.categoryName.test(value)
          ? ""
          : t("invalidCategoryName");
      case "categorySlug":
        return validationPatterns.categorySlug.test(value)
          ? ""
          : t("invalidCategorySlug");
      case "variantValue":
        return validationPatterns.variantValue.test(value)
          ? ""
          : t("invalidVariantFormat");
      default:
        return "";
    }
  };

  const handleSubmitCategory = async (e) => {
    e.preventDefault();

    let newErrors = {};
    const hasSelectedCategory = !!selectedCategory?.value;

    if (hasSelectedCategory && !categoryName.trim()) {
      if (!subCategoryName.trim()) {
        newErrors.subCategoryName = "Subcategory name is required";
      }
    } else {
      newErrors.categoryName = validateField("categoryName", categoryName);
    }
    setErrors(newErrors);

    if (Object.values(newErrors).some(Boolean)) return;

    try {
      if (hasSelectedCategory && !categoryName.trim() && subCategoryName.trim()) {
        await api.post(
          `/api/subcategory/categories/${selectedCategory.value}/subcategories`,
          { name: subCategoryName.trim() }
        );
        toast.success("Subcategory created successfully!");
      } else {
        await api.post("/api/category/categories", {
          categoryName: categoryName.trim(),
          subCategoryName: subCategoryName?.trim() || "",
        });
        toast.success("Category created successfully!");
      }

      setCategoryName("");
      setSubCategoryName("");
      setErrors({});
      fetchCategories();
      if (selectedCategory?.value) {
        await fetchSubcategoriesByCategory(selectedCategory.value);
      }
      setShowAddCategoryModel(false);
    } catch (err) {
      // console.error(err);
      toast.error(
        err.response?.data?.message || "Error creating category/subcategory"
      );
    }
  };

  const handleAddSubCategory = async (e) => {
    e.preventDefault();

    if (!selectedCategory?.value) {
      toast.error("Please select a category first");
      return;
    }

    if (!subCategoryName.trim()) {
      toast.error("Subcategory name is required");
      return;
    }

    try {
      await api.post(
        `/api/subcategory/categories/${selectedCategory.value}/subcategories`,
        { name: subCategoryName.trim() }
      );
      toast.success("Subcategory created successfully!");
      setSubCategoryName("");
      await fetchSubcategoriesByCategory(selectedCategory.value);
      setShowAddSubCategoryModel(false);
    } catch (err) {
      // console.error(err);
      toast.error(err.response?.data?.message || "Error creating subcategory");
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/api/category/categories");
      const data = res.data;

      // Ensure only active categories
      const activeCategories = (Array.isArray(data) ? data : data?.categories || [])
        .filter(cat => cat.isDelete !== true);

      const options = activeCategories.map((category) => ({
        value: category._id,
        label: sanitizeInput(category.categoryName, true),
      }));

      setCategories(options);
    } catch (error) {
      // console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
    }
  };

  useEffect(() => {
    if (selectedCategory) {
      fetchSubcategoriesByCategory(selectedCategory.value);
    } else {
      setSubcategories([]);
      setSelectedsubCategory(null); // ← Important!
    }
  }, [selectedCategory]);

  const fetchSubcategoriesByCategory = async (categoryId) => {
    try {
      const res = await api.get(`/api/subcategory/by-category/${categoryId}`);
      const data = res.data;

      // Extra safety: filter client-side too
      const activeSubcats = (Array.isArray(data) ? data : data?.subcategories || [])
        .filter(sub => sub.isDelete !== true);

      const options = activeSubcats.map((subcat) => ({
        value: subcat._id,
        label: sanitizeInput(subcat.name, true),
      }));

      setSubcategories(options);
    } catch (error) {
      // console.error("Error fetching subcategories:", error);
      toast.error("Failed to load subcategories");
      setSubcategories([]);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const subCategoryChange = (selectedOption) => {
    setSelectedsubCategory(selectedOption);
    // console.log("Selected subcategory:", selectedOption);
  };

  const validateFinalSubmit = () => {
    const newErrors = {};
    const emptyFields = [];

    // REQUIRED FIELDS ONLY (Global)
    if (!formData.productName) {
      newErrors.productName = "Product Name is required";
      emptyFields.push("productName");
    }
    if (!selectedCategory && settings.category) {
      newErrors.category = "Category is required";
      emptyFields.push("category");
    }
    if (!selectedsubCategory && settings.subcategory) {
      newErrors.subCategory = "Sub-category is required";
      emptyFields.push("subCategory");
    }
    if (!selectedBrands && settings.brand) {
      newErrors.brand = "Brand is required";
      emptyFields.push("brand");
    }
    if (!selectedHSN && settings.hsn) {
      newErrors.hsn = "HSN is required";
      emptyFields.push("hsn");
    }
    if (!formData.itemBarcode && settings.itembarcode) {
      newErrors.itemBarcode = "Item Barcode is required";
      emptyFields.push("itemBarcode");
    }

    // Determine Mode: Single Product vs Variants
    // If first variant has selectedVariant/Value, treat as Variant Mode.
    const isVariantMode = (variants.length > 0 && variants[0].selectedVariant && variants[0].selectedValue) || variants.length > 1;

    if (isVariantMode) {
      // Validate Variants
      variants.forEach((variant, index) => {
        if (!variant.purchasePrice || Number(variant.purchasePrice) < 1) {
          newErrors[`variant_${index}_purchasePrice`] = `Purchase Price must be at least 1 for variant ${index + 1}`;
          emptyFields.push(`variant_${index}_purchasePrice`);
        }

        if (!variant.sellingPrice || Number(variant.sellingPrice) < 1) {
          newErrors[`variant_${index}_sellingPrice`] = `Selling Price must be at least 1 for variant ${index + 1}`;
          emptyFields.push(`variant_${index}_sellingPrice`);
        }
        if (!variant.unit && settings.units) {
          newErrors[`variant_${index}_unit`] = `Unit is required for variant ${index + 1}`;
          emptyFields.push(`variant_${index}_unit`);
        }
        if (!variant.openingQuantity || Number(variant.openingQuantity) < 1) {
          newErrors[`variant_${index}_openingQuantity`] = `Opening Quantity must be at least 1 for variant ${index + 1}`;
          emptyFields.push(`variant_${index}_openingQuantity`);
        }
        if ((!variant.serialNumbers || variant.serialNumbers.length === 0) && settings.serialno) {
          newErrors[`variant_${index}_serialNumber`] = `Serial Number is required for variant ${index + 1}`;
          emptyFields.push(`variant_${index}_serialNumber`);
        }
        if (!variant.supplier && settings.supplier) {
          newErrors[`variant_${index}_supplier`] = `Supplier is required for variant ${index + 1}`;
          emptyFields.push(`variant_${index}_supplier`);
        }
        if (!variant.lotNumber && settings.lotno) {
          newErrors[`variant_${index}_lotNumber`] = `Lot No. is required for variant ${index + 1}`;
          emptyFields.push(`variant_${index}_lotNumber`);
        }
      });
    } else {
      // Validate Main Form Fields (Single Product)
      const mainVariant = variants[0] || {};
      if (!mainVariant.purchasePrice || Number(mainVariant.purchasePrice) < 1) {
        newErrors.purchasePrice = "Purchase Price must be at least 1";
        emptyFields.push("variant_0_purchasePrice");
      }

      if (!mainVariant.sellingPrice || Number(mainVariant.sellingPrice) < 1) {
        newErrors.sellingPrice = "Selling Price must be at least 1";
        emptyFields.push("variant_0_sellingPrice");
      }
      
      if (settings.units && !mainVariant.unit) {
        newErrors.units = "Unit is required";
        emptyFields.push("variant_0_unit");
      }
      if (!mainVariant.openingQuantity || Number(mainVariant.openingQuantity) < 1) {
        newErrors.openingQuantity = "Opening Quantity must be at least 1";
        emptyFields.push("variant_0_openingQuantity");
      }
      if (settings.serialno && (!mainVariant.serialNumbers || mainVariant.serialNumbers.length === 0)) {
        newErrors.serialNumber = "Serial Number is required";
        emptyFields.push("variant_0_serialNumber");
      }
      if (settings.supplier && !mainVariant.supplier) {
        newErrors.supplier = "Supplier is required";
        emptyFields.push("variant_0_supplier");
      }
      if (settings.lotno && !mainVariant.lotNumber) {
        newErrors.lotNumber = "Lot No. is required";
        emptyFields.push("variant_0_lotNumber");
      }
    }

    setHighlightedFields(emptyFields);
    setFormErrors(newErrors);
    return Object.values(newErrors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateFinalSubmit();

    if (errors.length > 0) {
      toast.error(`Missing fields: ${errors.join(", ")}`);
      console.log("Validation Failed. Errors:", errors);
      return;
    }

    const formPayload = new FormData();

    formPayload.append("productName", sanitizeInput(formData.productName, true));

    // Use first variant if available (Single Product Mode uses variant input fields)
    const mainVariant = variants[0] || {};

    if (settings.brand) formPayload.append("brand", selectedBrands?.value || "");
    if (settings.category) formPayload.append("category", selectedCategory?.value || "");
    if (settings.subcategory) formPayload.append("subCategory", selectedsubCategory?.value || "");
    if (settings.hsn && selectedHSN?.value) {
      formPayload.append("hsn", selectedHSN.value);
    }

    // Append itemBarcode
    if (settings.itembarcode) formPayload.append("itemBarcode", formData.itemBarcode || "");
    if (settings.serialno) {
      // Send serialNumber as string for backward compatibility if needed, 
      // but primarily send serialNumbers array
      formPayload.append("serialNumber", mainVariant.serialNumber || formData.serialNumber || "");
      formPayload.append("serialNumbers", JSON.stringify(mainVariant.serialNumbers || []));
    }
    if (settings.lotno) {
       formPayload.append("lotNumber", mainVariant.lotNumber || formData.lotNumber || "");
    }
    if (settings.supplier) formPayload.append("supplier", mainVariant.supplier || formData.supplier || "");
    
    // Append Description
    formPayload.append("description", formData.description || "");

    // Append Main Product Fields (for single product creation)

    formPayload.append("purchasePrice", mainVariant.purchasePrice || formData.purchasePrice || 0);
    formPayload.append("sellingPrice", mainVariant.sellingPrice || formData.sellingPrice || 0);
    formPayload.append("tax", mainVariant.tax || formData.tax || 0);
    if (settings.units) formPayload.append("unit", mainVariant.unit || formData.units || "");
    formPayload.append("openingQuantity", mainVariant.openingQuantity || formData.openingQuantity || 0);
    
    // Append variants data ONLY if active/valid
    // Check if we have actual variants defined (e.g., first one has selectedVariant) OR multiple lots
    let validVariants = [];
    if ((variants.length > 0 && variants[0].selectedVariant && variants[0].selectedValue) || variants.length > 1) {
      validVariants = variants;
    }

    const variantsPayload = validVariants.map(v => {
      const taxVal =
        v.tax === "" || v.tax === null || v.tax === undefined ? 0 : Number(v.tax) || 0;
      return {
        ...v,
        tax: taxVal,
        imageCount: v.images ? v.images.length : 0,
        // Ensure these fields are included explicitly if needed, though ...v covers them
        description: formData.description || "", // Add description to variant if needed by backend
        lotNumber: v.lotNumber || "",
        serialNumbers: v.serialNumbers || [],
        supplier: v.supplier || "",
      };
    });
    formPayload.append("variants", JSON.stringify(variantsPayload));

    // Aggregate images from all variants in order (if variants exist)
    let allImages = [];
    if (validVariants.length > 0) {
      allImages = validVariants.flatMap(v => v.images || []);
    } else if (variants.length > 0) {
      // Single Product Mode: use images from the first variant (where user uploaded them)
      allImages = variants[0].images || [];
    }

    allImages.forEach((img) => formPayload.append("images", img));

    try {
      await api.post("/api/products/create", formPayload);
      toast.success("Product created successfully");
      navigate("/product");
    } catch (err) {
      // console.error("Backend error:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Validation failed");
    }
  };

  const [categoryName, setCategoryName] = useState("");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        // const token = localStorage.getItem("token");
        const res = await api.get("/api/warehouse/active");
        if (res.data.success) {

          const formatted = res.data.data.map((wh) => ({
            value: wh._id,
            label: sanitizeInput(wh.warehouseName, true),
          }));
          setOptionsWare(formatted);
        }
      } catch (err) {
        // console.error("Error fetching warehouses:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWarehouses();
  }, []);

  const handleGenerateBarcode = async () => {
    // 1. Validate required fields
    // const missingFields = [];

    // if (!formData.productName?.trim()) missingFields.push("Product Name");
    // if (!selectedCategory) missingFields.push("Category");
    // if (!selectedsubCategory) missingFields.push("Sub-Category");
    // if (!selectedHSN) missingFields.push("HSN");

    // // Helper to check if a value is "filled" (not null/undefined/empty string)
    // // allowing 0 as a valid value for numeric fields
    // const isFilled = (val) => val !== "" && val !== null && val !== undefined;

    // variants.forEach((variant, index) => {
    //   const vPrefix = `Variant ${index + 1}`;
    //   if (!isFilled(variant.purchasePrice)) missingFields.push(`${vPrefix} Purchase Price`);
    //   if (!isFilled(variant.sellingPrice)) missingFields.push(`${vPrefix} Selling Price`);
    //   if (!isFilled(variant.tax)) missingFields.push(`${vPrefix} Tax`);
    //   if (!isFilled(variant.openingQuantity)) missingFields.push(`${vPrefix} Opening Quantity`);
    // });

    // if (missingFields.length > 0) {
    //   // Show first few missing fields to avoid huge toast
    //   const msg = missingFields.length > 3
    //     ? `Missing fields, Fill them first`
    //     : `Missing fields, Fill them first`;
    //   toast.error(msg);
    //   return;
    // }

    try {
      const res = await api.post("/api/products/generate-barcode");
      if (res.status === 200 && res.data.barcode) {
        setFormData((prev) => ({ ...prev, itemBarcode: res.data.barcode }));
        toast.success("Barcode generated successfully!");
      }
    } catch (err) {
      // console.error("Error generating barcode:", err);
      toast.error("Failed to generate barcode");
    }
  };

  const handleWarehouseChange = (selectedOption) => {
    setSelectedWarehouse(selectedOption);
  };

  const [optionsHsn, setOptionsHsn] = useState([]);
  const [selectedHSN, setSelectedHSN] = useState(null);
  const [showHSNModal, setShowHSNModal] = useState(false);

  useEffect(() => {
    const fetchHSN = async () => {
      try {
        // const token = localStorage.getItem("token");
        const res = await api.get("/api/hsn/all");
        if (res.data.success) {

          const formatted = res.data.data.map((item) => ({
            value: item._id,
            label: sanitizeInput(
              `${item.hsnCode} - ${item.description || ""}`,
              true
            ),
          }));
          setOptionsHsn(formatted);
        }
      } catch (err) {
        // console.error("Error fetching HSN:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHSN();
  }, []);

  const handleHSNChange = (selectedOption) => {
    setSelectedHSN(selectedOption);
  };

  return (
    <div className="p-4" style={{ height: "100vh" }}>
      {/* back, header, view style */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0px 0px 16px 0px",
          flexWrap: "wrap"
        }}
      >
        {/* Title + Icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 11,

          }}
        >
          {/* Icon Container */}
          <Link
            to="/product"
            style={{
              width: 32,
              height: 32,
              background: "white",
              borderRadius: 53,
              border: "1.07px solid #EAEAEA",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {/* Icon (placeholder) */}
            <FaArrowLeft style={{ color: "#A2A8B8" }} />
          </Link>

          {/* Title */}
          <h2
            style={{
              margin: 0,
              color: "black",
              fontSize: 22,
              // fontFamily: "Inter, sans-serif",
              fontWeight: 500,
              lineHeight: "26.4px",
            }}
          >
            Add New Product
          </h2>
        </div>
        <div>
          <div
            style={{
              padding: "6px 10px",
              background: "#1F7FFF",
              color: "white",
              fontSize: "16px",
              fontWeight: "400",
              border: "none",
              borderRadius: "12px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              textDecoration: "none",
              boxShadow:
                "0 8px 20px rgba(31, 127, 255, 0.3), inset -1px -1px 6px rgba(0,0,0,0.2)",
              transition: "all 0.3s ease",
            }}
          >
            <img
              src={AiLogo}
              alt="Ai Logo"
              style={{ filter: "grayscale(100%) brightness(500%)" }}
            />
            Add With AI
            <MdLockOutline style={{ fontSize: "20px" }} />
          </div>
        </div>
      </div>

      {/* body */}
      <div>
        <form onSubmit={handleSubmit} >
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
              maxHeight: "calc(100vh - 158px)",
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
              // maxHeight: "calc(100vh - 160px)",
              height: '100vh',
              position: 'relative'
            }}
            >
              {/* General Details */}
              <div style={{ width: "1832px", borderBottom: "1px var(--Stroke, #EAEAEA) solid", paddingBottom: '20px' }}>
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
                      width: "400px",
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
                        border: highlightedFields.includes("productName") ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "8px",
                        display: "flex",
                      }}
                    >
                      <input
                        type="text"
                        name="productName"
                        placeholder="Enter Name"
                        value={formData.productName}
                        onChange={handleChange}
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
                      />
                    </div>
                  </div>

                  {/* brand */}
                  {settings.brand && <div
                    style={{
                      width: "400px",
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
                        Brand
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
                        border: highlightedFields.includes("brand") ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "8px",
                        display: "flex",
                      }}
                    >
                      <select
                        value={selectedBrands?.value || ""}
                        onChange={(e) => {
                          const selected =
                            brandOptions.find(
                              (opt) => opt.value === e.target.value
                            ) || null;

                          handleBrandChange(selected);
                        }}
                        disabled={loading}
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
                        <option value="">
                          {loading ? "Loading Brands..." : "Select Brand"}
                        </option>

                        {brandOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label.length > 40 ? opt.label.slice(0, 40) + "..." : opt.label}
                          </option>
                        ))}
                      </select>

                    </div>
                  </div>}

                  {/* description */}
                  {settings.description && <div
                    style={{
                      width: "400px",
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
                        Description
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
                        border: highlightedFields.includes("productName") ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "8px",
                        display: "flex",
                      }}
                    >
                      <input
                        type="text"
                        name="description"
                        placeholder="Enter Description (Max 20 chars)"
                        maxLength={20}
                        value={formData.description}
                        onChange={handleChange}
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
                      />
                    </div>
                  </div>}

                  {/* category */}
                  {settings.category && <div
                    style={{
                      width: "400px",
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
                      ref={dropdownRef}
                      style={{
                        height: "40px",
                        padding: "0 12px",
                        background: "white",
                        borderRadius: "8px",
                        border: highlightedFields.includes("category") ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "8px",
                        display: "flex",
                        position: 'relative'
                      }}
                    >
                      {/* <select
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
                    <option value="">Select</option>
                    <option value="">Hoodie</option>
                  </select> */}
                      {/* <Select
                            name="category"
                            options={categories}
                            value={selectedCategory}
                            onChange={(selected) => {
                              setSelectedCategory(selected);
                              setSelectedSubcategory(null);
                              setFormErrors((prev) => ({ ...prev, category: "" }));
                            }}
                            placeholder="Select Category"
                            style={{
                              width: "100%",
                              border: "1px solid red",
                              background: "transparent",
                              color: "var(--Black-Black, #0E101A)",
                              fontSize: "14px",
                              fontFamily: "Inter",
                              fontWeight: "400",
                              outline: "none",
                            }}
                          /> */}
                      {/* <select
                          value={selectedCategory?.value || ""}
                          onChange={(e) => {
                            const selected = categories.find(
                              (cat) => cat.value === e.target.value
                            ) || null;

                            setSelectedCategory(selected);
                            setSelectedSubcategory(null);
                            setFormErrors((prev) => ({ ...prev, category: "" }));
                          }}
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
                          <option value="">Select Category</option>

                          {categories.map((cat) => (
                            <option key={cat.value} value={cat.value}>
                              {cat.label}
                            </option>
                          ))}

                        </select> */}
                      <div style={{ display: 'flex', gap: '5px', }} onClick={() => setDropDown(true)}>
                        {selectedCategory?.label ? <span style={{ color: "var(--Black-Black, #0E101A)", fontSize: "14px", fontFamily: "Inter", fontWeight: "400", lineHeight: "14.40px" }}>{selectedCategory?.label}</span> : <span style={{ color: "var(--Black-Black, #0E101A)", fontSize: "14px", fontFamily: "Inter", fontWeight: "400", lineHeight: "14.40px" }}>Select Category</span>}
                      </div>

                      {!dropdown && <div
                        onClick={() => setDropDown(true)}>
                        <IoIosArrowDown />
                      </div>}
                      {dropdown && <div
                        onClick={() => setDropDown(false)}>
                        <IoIosArrowUp />
                      </div>}

                      {dropdown && <div style={{
                        position: 'absolute',
                        top: '40px',
                        left: 0,
                        right: 0,
                        backgroundColor: 'white',
                        border: '1px solid #E1E1E1',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        // height: 'auto',
                        maxHeight: '165px',
                        width: '190px',
                        // overflowY: 'auto',
                        zIndex: 1000
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', maxHeight: '125px', height: 'auto' }}>

                          {/* mapping of categories */}

                          {categories.map((cat) => (
                            <div key={cat.value}
                              className="button-hover"
                              style={{ display: 'flex', justifyContent: 'start', alignItems: 'center', width: '100%', padding: '5px 14px', }}>
                              <label
                                onClick={() => {
                                  setSelectedCategory(cat);
                                  setDropDown(false);
                                  setSelectedsubCategory(null);
                                  setFormErrors((prev) => ({ ...prev, category: "" }));
                                  fetchSubcategoriesByCategory(cat.value);
                                }}
                                style={{
                                  fontSize: 15,
                                  color: "black",
                                  fontWeight: "500",
                                  cursor: 'pointer',
                                }}
                              >
                                {cat.label}
                              </label>
                            </div>))}
                        </div>

                        <div
                          style={{
                            width: "auto",
                            height: "1px",
                            background: "var(--Stroke, #EAEAEA)",
                          }}
                        />

                        <div style={{ display: 'flex', justifyContent: 'start', alignItems: 'center', padding: '8px 14px' }}>
                          <span
                            title="Add New Category"
                            onClick={() => setShowAddCategoryModel(true)}
                            style={{
                              color: "var(--Danger, #1F7FFF)",
                              fontSize: "12px",
                              fontFamily: "Inter",
                              fontWeight: "500",
                              lineHeight: "14px",
                              padding: '0px 2px',
                              borderRadius: '4px',
                              border: '1px solid var(--Danger, #1F7FFF)',
                              cursor: 'pointer',
                            }}
                          >
                            +
                          </span>
                          <span
                            onClick={() => setShowAddCategoryModel(true)}
                            style={{
                              fontSize: 15,
                              color: "black",
                              fontWeight: "400",
                              cursor: 'pointer',
                            }}>&nbsp;Add New Category</span>
                        </div>
                      </div>}

                    </div>
                  </div>}

                  {/* subcategory */}
                  {settings.subcategory && <div
                    style={{
                      width: "400px",
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
                      {/* <div
                        title="Add New Category"
                        onClick={() => setShowAddCategoryModel(true)}
                        style={{
                          color: "var(--Danger, #1F7FFF)",
                          fontSize: "15px",
                          fontFamily: "Inter",
                          fontWeight: "500",
                          lineHeight: "13px",
                          padding: '0px 2px',
                          borderRadius: '4px',
                          border: '1px solid var(--Danger, #1F7FFF)',
                          cursor: 'pointer',
                        }}
                      >
                        +
                      </div> */}

                    </div>
                    <div
                      ref={dropdownSubCatRef}
                      style={{
                        width: "100%",
                        height: "40px",
                        padding: "0 12px",
                        background: "white",
                        borderRadius: "8px",
                        border: highlightedFields.includes("subCategory") ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "8px",
                        display: "flex",
                        position: 'relative',
                      }}
                    >
                      {/* <select
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
                    <option value="">Select</option>
                    <option value="">Hoodie</option>
                  </select> */}
                      {/* <Select
                            name="subCategory"
                            options={subcategories}
                            value={selectedsubCategory}
                            onChange={subCategoryChange}
                            placeholder="Select Sub-Category"
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
                          /> */}
                      {/* <select
                          value={selectedsubCategory?.value || ""}
                          onChange={(e) => {
                            const selected =
                              subcategories.find(
                                (sub) => sub.value === e.target.value
                              ) || null;

                            // keep same behavior as react-select
                            subCategoryChange(selected);
                          }}
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
                          <option value="">Select Subcategory</option>

                          {subcategories.map((sub) => (
                            <option key={sub.value} value={sub.value}>
                              {sub.label}
                            </option>
                          ))}
                        </select> */}

                      <div style={{ display: 'flex', gap: '5px', }} onClick={() => setDropDownSubCat(true)}>
                        {selectedsubCategory?.label ? <span style={{ color: "var(--Black-Black, #0E101A)", fontSize: "14px", fontFamily: "Inter", fontWeight: "400", lineHeight: "14.40px" }}>{selectedsubCategory?.label}</span> : <span style={{ color: "var(--Black-Black, #0E101A)", fontSize: "14px", fontFamily: "Inter", fontWeight: "400", lineHeight: "14.40px" }}>Select Subcategory</span>}
                      </div>

                      {!dropdownSubCat && <div
                        onClick={() => setDropDownSubCat(true)}>
                        <IoIosArrowDown />
                      </div>}
                      {dropdownSubCat && <div
                        onClick={() => setDropDownSubCat(false)}>
                        <IoIosArrowUp />
                      </div>}

                      {dropdownSubCat && <div style={{
                        position: 'absolute',
                        top: '40px',
                        left: 0,
                        right: 0,
                        backgroundColor: 'white',
                        border: '1px solid #E1E1E1',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        maxHeight: '165px',
                        width: '190px',
                        // overflowY: 'auto',
                        zIndex: 1000
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', maxHeight: '125px', height: 'auto' }}>

                          {/* mapping of categories */}
                          {subcategories.map((sub) => (
                            <div key={sub.value}
                              className="button-hover"
                              style={{ display: 'flex', justifyContent: 'start', alignItems: 'center', width: '100%', padding: '5px 14px', }}>
                              <label
                                onClick={() => {
                                  setSelectedsubCategory(sub);
                                  setDropDownSubCat(false);
                                  setFormErrors((prev) => ({ ...prev, subCategory: "" }));
                                }}
                                style={{
                                  fontSize: 15,
                                  color: "black",
                                  fontWeight: "500",
                                  cursor: 'pointer',
                                }}
                              >
                                {sub.label}
                              </label>
                            </div>))}
                        </div>

                        <div
                          style={{
                            width: "auto",
                            height: "1px",
                            background: "var(--Stroke, #EAEAEA)",
                          }}
                        />

                        {selectedCategory ? <div style={{ display: 'flex', justifyContent: 'start', alignItems: 'center', padding: '8px 14px' }}>
                          <span
                            title="Add New Subcategory"
                            onClick={() => setShowAddSubCategoryModel(true)}
                            style={{
                              color: "var(--Danger, #1F7FFF)",
                              fontSize: "12px",
                              fontFamily: "Inter",
                              fontWeight: "500",
                              lineHeight: "14px",
                              padding: '0px 2px',
                              borderRadius: '4px',
                              border: '1px solid var(--Danger, #1F7FFF)',
                              cursor: 'pointer',
                            }}
                          >
                            +
                          </span>
                          <span
                            onClick={() => setShowAddSubCategoryModel(true)}
                            style={{
                              fontSize: 15,
                              color: "black",
                              fontWeight: "400",
                              cursor: 'pointer',
                            }}>&nbsp;Add Subcategory</span>
                        </div> : <div style={{ display: 'flex', justifyContent: 'start', alignItems: 'center', padding: '8px 14px' }}>
                          <span
                            style={{
                              fontSize: 12,
                              color: "black",
                              fontWeight: "400",
                              fontStyle: 'italic',
                            }}>*select category first*</span>
                        </div>}

                      </div>}

                    </div>
                  </div>}

                  {/* item code / bar code */}
                  {settings.itembarcode && <div
                    style={{
                      width: "400px",
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
                        border: highlightedFields.includes("itemBarcode") ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "8px",
                        display: "flex",
                      }}
                    >
                      {/* <input
                          type="text"
                          name="itemBarcode"
                          value={formData.itemBarcode || ""}
                          onChange={handleChange}
                          placeholder="Generate barcode"
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
                        /> */}
                      <span style={{ color: 'black' }}>{formData.itemBarcode || "click to..."}</span>
                      <button
                        type="button"
                        onClick={handleGenerateBarcode}
                        style={{
                          padding: "4px 6px",
                          background: "var(--Blue, #1F7FFF)",
                          borderRadius: "4px",
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <span
                          style={{
                            color: "var(--White, white)",
                            fontSize: "14px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                          }}
                        >
                          Generate
                        </span>
                      </button>
                    </div>
                  </div>}

                  {/* hsn code */}
                  {settings.hsn && <div
                    style={{
                      width: "400px",
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
                        border: highlightedFields.includes("hsn") ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "8px",
                        display: "flex",
                      }}
                    >
                      {/* <select
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
                    <option value="">Select HSN</option>
                    <option value="">100101</option>
                  </select> */}
                      {/* <Select
                          name="hsn"
                          options={optionsHsn}
                          isLoading={loading}
                          value={selectedHSN}
                          isSearchable
                          placeholder="Select HSN..."
                          onChange={handleHSNChange}
                          styles={{
                            control: (base) => ({
                              ...base,
                              maxWidth: "100%",
                              minWidth: 0,
                              overflow: "hidden",
                            }),
                            singleValue: (base) => ({
                              ...base,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              maxWidth: "100%",
                            }),
                          }}
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
                        /> */}
                      <select
                        value={selectedHSN?.value || ""}
                        onChange={(e) => {
                          const selected =
                            optionsHsn.find(
                              (hsn) => hsn.value === e.target.value
                            ) || null;

                          handleHSNChange(selected);
                        }}
                        disabled={loading}
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
                        <option value="">
                          {loading ? "Loading HSN..." : "Select HSN"}
                        </option>

                        {optionsHsn.map((hsn) => (
                          <option key={hsn.value} value={hsn.value}>
                            {hsn.label.length > 40 ? hsn.label.slice(0, 40) + "..." : hsn.label}
                          </option>
                        ))}
                      </select>

                    </div>
                  </div>}
                </div>
              </div>

              {/* Lot No. Section */}
              <div style={{ borderBottom: '1px solid #EAEAEA', padding: '0px 0px 24px 0px' }} className="delete-hover">
                <div
                  style={{
                    color: "black",
                    fontSize: "16px",
                    fontFamily: "Inter",
                    fontWeight: "500",
                    lineHeight: "19.20px",
                  }}
                >
                  Add Lot / Batch
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
                      overflowX: 'auto',
                      padding: '16px 8px 0px 0px',
                    }}
                  // className="row"
                  >
                    {/* Delete button */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        width: "45px",
                      }}
                      className="col-1"
                    >
                      <div
                        className=""
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          gap: '8px',
                          height: "100%",
                          cursor: index === 0 ? "not-allowed" : "pointer",
                        }}
                        onClick={() => {
                          if (index === 0) return;
                          if (variants.length <= 1) return;
                          setVariants(variants.filter((_, i) => i !== index));
                        }}
                      >
                        <BsThreeDotsVertical className="fs-4" /> <RiDeleteBinLine className="text-danger fs-4" />
                      </div>
                    </div>

                    {/* lot no / serial no */}
                    {(settings.lotno || settings.serialno) && <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        width: "275px",
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
                          {settings.lotno ? "Lot No." : "Serial No."}
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
                          border: (highlightedFields.includes(`variant_${index}_lotNumber`) || highlightedFields.includes(`variant_${index}_serialNumber`)) ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
                          justifyContent: "flex-start",
                          alignItems: "center",
                          gap: "8px",
                          display: "flex",
                        }}
                      >
                        {settings.lotno && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            flex: 1
                          }}
                        >
                          <input
                            type="text"
                            placeholder="Enter Lot No."
                            name="lotNumber"
                            value={variant.lotNumber || ""}
                            onChange={(e) => handleVariantChange(index, "lotNumber", e.target.value)}
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
                          />
                        </div>
                        )}
                        
                        {settings.serialno && (
                        <button
                          type="button"
                          style={{
                            padding: "4px 6px",
                            background: "var(--Blue, #1F7FFF)",
                            borderRadius: "4px",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: settings.lotno ? "120px" : "100%",
                          }}
                           onClick={() => {
                             setCurrentVariantIndex(index);
                             setAddSerialPopup(true);
                           }}
                        >
                          <span
                            style={{
                              color: "var(--White, white)",
                              fontSize: "14px",
                              fontFamily: "Inter",
                              fontWeight: "400",
                            }}
                          >
                            + Serial No.
                          </span>
                        </button>
                        )}
                      </div>
                    </div>}

                    {/* supplier */}
                    {settings.supplier && <div
                      style={{
                        width: "195px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
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
                          Assign Supplier
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
                          border: highlightedFields.includes(`variant_${index}_supplier`) ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "8px",
                          display: "flex",
                        }}
                      >
                        <select
                          value={variant.supplier || ""}
                          onChange={(e) => {
                            // Store the supplier _id directly
                            handleVariantChange(index, "supplier", e.target.value);
                          }}
                          disabled={loading}
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
                          <option value="">
                            {loading ? "Loading Suppliers..." : "Select Supplier"}
                          </option>

                          {suppliers.map((supplier, index) => (
                            <option key={index} value={supplier._id}>
                              {supplier.name}
                            </option>
                          ))}
                        </select>

                      </div>
                    </div>}

                    {/* unit */}
                    {settings.units && <div
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
                          border: highlightedFields.includes(`variant_${index}_unit`) ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
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
                    </div>}

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
                          Purchasing Price / Unit
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
                          border: highlightedFields.includes(`variant_${index}_purchasePrice`) ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
                          justifyContent: "space-between",
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
                            type="number"
                            placeholder="Enter Purchase Price"
                            name="purchasePrice"
                            value={variant.purchasePrice || ""}
                            onChange={(e) => handleVariantChange(index, "purchasePrice", e.target.value)}
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
                          />
                        </div>
                      </div>
                    </div>

                    {/* Quantity in lot */}
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
                          Quantity in Lot
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
                          border: highlightedFields.includes(`variant_${index}_openingQuantity`) ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
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
                            type="number"
                            placeholder="00"
                            name="openingQuantity"
                            value={variant.openingQuantity || ""}
                            readOnly={settings.serialno}
                            onChange={(e) => handleVariantChange(index, "openingQuantity", e.target.value)}
                            style={{
                              width: "100%",
                              border: "none",
                              background: "transparent",
                              color: "var(--Black-Black, #0E101A)",
                              fontSize: "14px",
                              fontFamily: "Inter",
                              fontWeight: "400",
                              cursor: settings.serialno ? "not-allowed" : "text",
                            }}
                          />
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
                        Total Lot Cost -{" "}
                        <span
                          style={{
                            color: "var(--Black-Black, green)",
                            fontSize: "11px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            lineHeight: "14.40px",
                          }}
                        >
                          ₹ {((Number(variant.purchasePrice) || 0) * (Number(variant.openingQuantity) || 0)).toFixed(2)}
                        </span>
                      </span>
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
                          Selling Price / Unit
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
                          border: highlightedFields.includes(`variant_${index}_sellingPrice`) ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
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
                            type="number"
                            placeholder="Enter Selling Price"
                            name="sellingPrice"
                            value={variant.sellingPrice || ""}
                            onChange={(e) => handleVariantChange(index, "sellingPrice", e.target.value)}
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
                          />
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
                        Selling Price / Lot -{" "}
                        <span
                          style={{
                            color: "var(--Black-Black, green)",
                            fontSize: "11px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            lineHeight: "14.40px",
                          }}
                        >
                          ₹ {((Number(variant.sellingPrice) || 0) * (Number(variant.openingQuantity) || 0)).toFixed(2)}
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
                        {/* <span
                          style={{
                            color: "var(--Danger, #D00003)",
                            fontSize: "12px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            lineHeight: "14.40px",
                          }}
                        >
                          *
                        </span> */}
                      </div>
                      <div
                        style={{
                          height: "40px",
                          padding: "0 12px",
                          background: "white",
                          borderRadius: "8px",
                          border: highlightedFields.includes(`variant_${index}_tax`) ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
                          justifyContent: "flex-start",
                          alignItems: "center",
                          gap: "8px",
                          display: "flex",
                        }}
                      >
                        <select
                          name="tax"
                          value={variant.tax || ""}
                          onChange={(e) => handleVariantChange(index, "tax", e.target.value)}
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
                          <option value="">Select GST</option>
                          <option value="5">5%</option>
                          <option value="18">18%</option>
                        </select>
                      </div>
                    </div>

                    {/* add serial no */}
                    {addserialpopup && currentVariantIndex !== null && <div style={{
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
                      zIndex: 999,
                    }}
                      onClick={(e) => setAddSerialPopup(false)}
                    >
                      <div style={{ width: 'auto', maxHeight: '80vh', overflowY: 'auto', padding: '10px 16px', backgroundColor: '#F2F6F9', border: '1px solid #E1E1E1', borderRadius: '8px' }} onClick={(e) => e.stopPropagation()}>

                        <div style={{ padding: '16px 8px', }} className="delete-hover">

                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:'20px'}}>
                          <div
                            style={{
                              color: "black",
                              fontSize: "16px",
                              fontFamily: "Inter",
                              fontWeight: "500",
                              lineHeight: "19.20px",
                            }}
                          >
                            Add Serial No. for {variants[currentVariantIndex]?.serialNumbers?.length || 0} Quantity
                          </div>
                          
                            {/* add button */}
                            <button
                              type="button"
                              onClick={handleAddSerialField}
                              style={{
                                padding: "6px 6px",
                                background: "var(--Blue, #1F7FFF)",
                                borderRadius: "4px",
                                border: "none",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "100px",
                              }}
                            >
                              <span
                                style={{
                                  color: "var(--White, white)",
                                  fontSize: "14px",
                                  fontFamily: "Inter",
                                  fontWeight: "400",
                                }}
                              >
                                + Add
                              </span>
                            </button>
                        </div>

                          <div style={{
                            display: "flex",
                            gap: "16px",
                            padding: '16px 8px',
                            justifyContent: 'flex-start',
                            flexDirection: 'column'
                          }}>
                            {(variants[currentVariantIndex]?.serialNumbers || []).map((serial, sIndex) => (
                                <div key={sIndex} style={{
                                  display: "flex",
                                  gap: "16px",
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                }}>

                                  {/* quantity no */}
                                  <div
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: "4px",
                                      width: "30px",
                                    }}
                                    className="col-1"
                                  >
                                    <div
                                      className=""
                                      style={{
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        gap: '8px',
                                        height: "100%",
                                      }}
                                    >
                                      {sIndex + 1}<BsThreeDotsVertical className="fs-4" />
                                    </div>
                                  </div>

                                  {/* serial no */}
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
                                          width: "100%"
                                        }}
                                      >
                                        <input
                                          id={`serial-input-${sIndex}`}
                                          type="text"
                                          placeholder="Enter Serial No."
                                          value={serial}
                                          onChange={(e) => handleSerialChange(sIndex, e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                              e.preventDefault();
                                              handleAddSerialField();
                                              setTimeout(() => {
                                                const nextInput = document.getElementById(`serial-input-${sIndex + 1}`);
                                                if (nextInput) nextInput.focus();
                                              }, 100);
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
                                            outline: "none",
                                          }}
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Remove button */}
                                  <button
                                      type="button"
                                      onClick={() => handleRemoveSerial(sIndex)}
                                      style={{
                                          background: "transparent",
                                          border: "none",
                                          color: "var(--Danger, #D00003)",
                                          cursor: "pointer",
                                          fontSize: "18px"
                                      }}
                                  >
                                      &times;
                                  </button>
                                </div>
                            ))}
                          </div>

                        </div>
                      </div>
                    </div>}

                  </div>
                ))}

                {/* add lot variant button */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "7px",
                    // marginTop: "8px",
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
                    onClick={() => setVariants([...variants, { lotNumber: "", selectedVariant: "", selectedValue: "", valueDropdown: [] }])}
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
                    Add More Lot
                  </span>
                </div>
              </div>


              {/* Import Images */}
              <div
                style={{
                  width: "auto",
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
                      marginBottom: "20px",
                    }}
                  >
                    Import Images
                  </div>
                  <div
                    style={{
                      color: "black",
                      fontSize: "16px",
                      fontFamily: "Inter",
                      fontWeight: "500",
                      marginBottom: "20px",
                    }}
                  >
                    <div
                      style={{
                        padding: "6px 10px",
                        background: "#1F7FFF",
                        color: "white",
                        fontSize: "16px",
                        fontWeight: "400",
                        border: "none",
                        borderRadius: "12px",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        textDecoration: "none",
                        boxShadow:
                          "0 8px 20px rgba(31, 127, 255, 0.3), inset -1px -1px 6px rgba(0,0,0,0.2)",
                        transition: "all 0.3s ease",
                      }}
                    >
                      <img
                        src={AiLogo}
                        alt="Ai Logo"
                        style={{ filter: "grayscale(100%) brightness(500%)" }}
                      />
                      Generate
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-start",
                    alignItems: "flex-start",
                    gap: "16px",
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
                      <span
                        style={{
                          color: "black",
                          fontSize: "14px",
                          fontFamily: "Inter",
                          fontWeight: "400",
                          lineHeight: "16.80px",
                        }}
                      >
                        {`${index + 1} Lot`}
                      </span>

                      <div
                        style={{
                          width: "300px",
                          minHeight: "150px",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          border: "2px dashed #EAEAEA",
                          borderRadius: "8px",
                          padding: '25px',
                        }}
                      >
                        {/* Preview OR placeholder */}
                        {variant.images?.length ? (
                          <>
                            <div className="row" style={{ gap: 12 }}>
                              {variant.images.map((f, i) => (
                                <div
                                  className="col-auto"
                                  key={i}
                                  style={{ position: "relative" }}
                                >
                                  <img
                                    key={i}
                                    src={f.preview}
                                    alt="preview"
                                    className="img-thumbnail"
                                    style={{
                                      height: 100,
                                      width: 100,
                                      objectFit: "cover",
                                    }}
                                  />
                                  <button
                                    type="button"
                                    style={{
                                      cursor: "pointer",
                                      position: "absolute",
                                      top: -6,
                                      right: -0,
                                      border: "none",
                                      borderRadius: "50%",
                                      backgroundColor: "red",
                                      color: "white",
                                      width: "20px",
                                      height: "20px",
                                      lineHeight: "20px",
                                    }}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleRemoveImage(index, f);
                                    }}
                                  >
                                    &times;
                                  </button>
                                </div>
                              ))}
                              {variant.images.length < 6 && (
                                <label
                                  htmlFor={`variant-image-${index}`}
                                  className="col-auto"
                                  style={{
                                    height: 100,
                                    width: 100,
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    border: "2px dashed #EAEAEA",
                                    borderRadius: "8px",
                                    marginLeft: 12,
                                    cursor: "pointer",
                                  }}
                                >
                                  <FcAddImage size={30} />
                                </label>
                              )}
                            </div>
                          </>
                        ) : (
                          <label
                            htmlFor={`variant-image-${index}`}
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "center",
                              alignItems: "center",
                              gap: 8,
                              color: "#727681",
                              width: "100%",
                              height: "100%",
                              cursor: "pointer",
                            }}
                          >
                            <FcAddImage size={30} />
                            <span style={{ color: "#727681" }}>
                              Drag image here or <span style={{ color: "#1F7FFF" }}>browse</span>
                            </span>
                            <span style={{ fontSize: 12, color: "#727681" }}>
                              JPEG, PNG, JPG (max 1MB)
                            </span>
                          </label>
                        )}
                        <input
                          id={`variant-image-${index}`}
                          type="file"
                          multiple
                          accept="image/jpeg,image/png,image/jpg"
                          onChange={(e) => handleVariantImageChange(index, e)}
                          style={{ display: "none" }}
                        />
                      </div>

                    </div>
                  ))}
                </div>

              </div>

              {/* cancel and Save Button */}
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
                    gap: 8,
                    display: "inline-flex",
                  }}
                >
                  <Link
                    to="/product"
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
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        color: "var(--Blue-Blue, #1F7FFF)",
                        fontSize: 14,
                        fontFamily: "Inter",
                        fontWeight: "500",
                        lineHeight: 5,
                        wordWrap: "break-word",
                      }}
                    >
                      Cancel
                    </div>
                  </Link>
                  <button
                    type="submit"
                    className="button-color button-hover d-flex justify-content-center align-items-center"
                    style={{
                      height: 36,
                      padding: 8,
                      // background: "var(--Blue-Blue, #1F7FFF)",
                      boxShadow: "-1px -1px 4px rgba(0, 0, 0, 0.25) inset",
                      borderRadius: 8,
                      // outline: "1.50px var(--Blue-Blue, #1F7FFF) solid",
                      outlineOffset: "-1.50px",
                      justifyContent: "flex-start",
                      alignItems: "center",
                      gap: 4,
                      display: "flex",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        color: "white",
                        fontSize: 14,
                        fontFamily: "Inter",
                        fontWeight: "500",
                        lineHeight: 5,
                        wordWrap: "break-word",
                      }}
                    >
                      Save{" "}
                    </div>
                  </button>
                </div>
              </div>

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
          subCategoryName={subCategoryName} // ✅ ADD THIS
          onSubCategoryChange={(e) => setSubCategoryName(e.target.value)}
          onSubmit={handleSubmitCategory}
          submitLabel={[t("Save")]}
          errors={errors}
        />
      )}

      {showAddSubCategoryModel && (
        <CreateSubCategoryModel
          modelAddRef={modelAddRef}
          closeModal={() => setShowAddSubCategoryModel(false)}
          categoryName={selectedCategory?.label}
          subCategoryName={subCategoryName}
          onSubCategoryChange={(e) => setSubCategoryName(e.target.value)}
          onSubmit={handleAddSubCategory}
        />
      )}

    </div>
  );
};

export default ProductForm;
