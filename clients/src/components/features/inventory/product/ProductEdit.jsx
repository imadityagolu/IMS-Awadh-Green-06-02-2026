import React, { useEffect, useRef, useState } from "react";
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
import CreateSubCategoryModel from "../../category/CreateSubCategoryModel";

import { RiDeleteBinLine } from "react-icons/ri";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FcAddImage } from "react-icons/fc";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";

const regexPatterns = {
  productName: /^[a-zA-Z0-9\s\-_&()]{2,100}$/, // Alphanumeric, spaces, some special chars, 2-100 chars
  price: /^\d+(\.\d{1,2})?$/, // Positive number with up to 2 decimal places
  quantity: /^(?:[1-9]\d*)$/,
};

const sanitizeOptions = {
  allowedTags: ["b", "i", "em", "strong", "a", "p", "br"],
  allowedAttributes: {
    a: ["href"],
  },
};

const ProductEdit = () => {

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

  const [showAddSubCategoryModel, setShowAddSubCategoryModel] = useState(false);
  const modelAddRef = useRef(null);

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
      toast.error(
        err.response?.data?.message || "Error creating subcategory"
      );
    }
  };

  const [settings, setSettings] = useState({
    brand: false,
    category: false,
    subcategory: false,
    itembarcode: false,
    hsn: false,
    lotno: false,
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
          category: data.category || false,
          subcategory: data.subcategory || false,
          itembarcode: data.itembarcode || false,
          hsn: data.hsn || false,
          lotno: data.lotno || false,
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

  const lotColumns = [
    { label: "Lot No.", editableValue: "12" },
    { label: "Fabric Batch No.", editableValue: "MO123" },
    { label: "Production Date", editableValue: "22/09/2023", opacity: 0.69 },
    { label: "Design Code", editableValue: "DC-0123" },
    { label: "Quantity", editableValue: "112" },
  ];

  const lotFieldKeys = [
    "lotNo",
    "fabricBatchNo",
    "productionDate",
    "designCode",
    "quantity",
  ];

  const [lotDetails, setLotDetails] = useState({
    lotNo: "",
    fabricBatchNo: "",
    productionDate: "",
    designCode: "",
    quantity: "",
  });

  const [step, setStep] = useState(0);
  const [stepStatus, setStepStatus] = useState(
    Array(steps.length).fill("pending")
  );
  const [formData, setFormData] = useState({
    productName: "",
    description: "",
    category: "",
    subCategory: "",
    // itemBarcode: "",
    purchasePrice: "",
    sellingPrice: "",
    wholesalePrice: "",
    retailPrice: "",
    quantity: "",
    variants: {},
    sellingType: "",
    hsn: "",
  });

  const [errors, setErrors] = useState({});
  const [highlightedFields, setHighlightedFields] = useState([]);
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
  const [isDirty, setIsDirty] = useState(false);
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
      // variant.quantityInLot = serials.length; // Update quantity
      // variant.openingQuantity = serials.length; // Update quantity
      variant.stockQuantity = serials.length;
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
      // variant.quantityInLot = serials.length; // Update quantity
      // variant.openingQuantity = serials.length; // Update quantity
      variant.stockQuantity = serials.length;
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
      setIsDirty(true);
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
        setFormData((prev) => ({
          ...prev,
          ...sanitizedData,
          ...data,
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
            fabricBatchNo: details.fabricBatchNo || "",
            productionDate: details.productionDate || "",
            designCode: details.designCode || "",
            quantity: details.quantity || "",
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
        if (data.lotSupplier) {
          setSupplierId(data.lotSupplier._id || data.lotSupplier);
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

        let safeSerialNumbers = data.serialNumbers || [];

        // Handle case where serialNumbers is a JSON string
        if (typeof safeSerialNumbers === 'string') {
          try {
            safeSerialNumbers = JSON.parse(safeSerialNumbers);
          } catch (e) {
            safeSerialNumbers = [];
          }
        }

        // Fix for potentially double-stringified serial numbers from previous bad saves
        if (Array.isArray(safeSerialNumbers)) {
          safeSerialNumbers = safeSerialNumbers.flatMap(s => {
            if (typeof s === 'string') {
              let cleaned = s.trim();
              // Recursively try to parse JSON if it looks like an array
              if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
                try {
                  const parsed = JSON.parse(cleaned);
                  if (Array.isArray(parsed)) return parsed.flat();
                  return parsed;
                } catch (e) {
                  // Fallback: manually strip brackets and quotes if JSON fails
                  cleaned = cleaned.replace(/^\["|"]$/g, '').replace(/^\[|]$/g, '').replace(/"/g, '');
                }
              }
              // Remove surrounding quotes if present
              if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
                cleaned = cleaned.slice(1, -1);
              }

              // Extra safety: remove any remaining brackets or quotes if they look like artifacts
              if (cleaned.includes('[') || cleaned.includes(']') || cleaned.includes('"')) {
                cleaned = cleaned.replace(/[\[\]"]/g, '');
              }

              return cleaned;
            }
            return s;
          });
        }

        const existingVariant = {
          selectedVariant: "",
          selectedValue: [],
          valueDropdown: [],
          purchasePrice: data.purchasePrice,
          sellingPrice: data.sellingPrice,
          tax: data.tax,
          openingQuantity: data.openingQuantity,
          quantityInLot: data.quantityInLot,
          stockQuantity: data.stockQuantity,
          unit: data.unit,
          serialno: data.serialno,
          lotNumber: data.lotNumber || "",
          serialNumbers: safeSerialNumbers,
          supplier: data.lotSupplier || (data.supplier ? (data.supplier._id || data.supplier) : ""),
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

    const fetchSuppliers = async () => {
      try {
        const res = await api.get("/api/suppliers");
        const options = res.data.suppliers.map((supplier) => ({
          value: supplier._id,
          label: `${supplier.firstName} ${supplier.lastName} (${supplier.supplierCode})`,
        }));
        setOptions(options);
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
    fetchSuppliers();
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
    if (options.length > 0 && supplierId) {
      const found = options.find((opt) => opt.value === supplierId);
      if (found) {
        setSelectedSupplier(found);
      }
    }
  }, [options, supplierId]);

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

  const handleBrandChange = (selectedOption) => {
    setSelectedBrands(selectedOption);
    setIsDirty(true);
  };
  const handleUnitChange = (selectedOption) => {
    setSelectedUnits(selectedOption);
    setIsDirty(true);
  };
  const handleWarehouseChange = (selectedOption) => {
    setSelectedWarehouse(selectedOption);
    setIsDirty(true);
  };
  const handleHSNChange = (selectedOption) => {
    setSelectedHSN(selectedOption);
    setIsDirty(true);
  };
  const subCategoryChange = (selectedOption) => {
    setSelectedsubCategory(selectedOption);
    setIsDirty(true);
  };

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
      setIsDirty(true);
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
    setIsDirty(true);
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
    setIsDirty(true);
  };

  const validateStep = () => {
    const newErrors = {};
    const emptyFields = [];

    if (!formData.productName) {
      newErrors.productName = "Product Name is required";
      emptyFields.push("productName");
    }
    if (formData.productName && !regexPatterns.productName.test(formData.productName)) newErrors.productName = "Invalid Product Name";
    if (settings.category && !selectedCategory) {
      newErrors.category = "Category is required";
      emptyFields.push("category");
    }
    if (settings.subcategory && !selectedsubCategory) {
      newErrors.subCategory = "Subcategory is required";
      emptyFields.push("subCategory");
    }

    if (settings.brand && !selectedBrands) {
      newErrors.brand = "Brand is required";
      emptyFields.push("brand");
    }

    if (settings.hsn && !selectedHSN) {
      newErrors.hsn = "HSN is required";
      emptyFields.push("hsn");
    }

    // if (settings.itembarcode && !formData.itemBarcode) {
    //   newErrors.itemBarcode = "Item Barcode is required";
    //   emptyFields.push("itemBarcode");
    // }

    // Validate variants fields
    variants.forEach((variant, index) => {
      if (variant.purchasePrice === "" || variant.purchasePrice === null || variant.purchasePrice === undefined || Number(variant.purchasePrice) < 1) emptyFields.push("purchasePrice");
      // if (variant.mrp === "" || variant.mrp === null || variant.mrp === undefined || Number(variant.mrp) < 1) emptyFields.push("mrp");
      if (variant.sellingPrice === "" || variant.sellingPrice === null || variant.sellingPrice === undefined || Number(variant.sellingPrice) < 1) emptyFields.push("sellingPrice");
      if (variant.openingQuantity === "" || variant.openingQuantity === null || variant.openingQuantity === undefined || Number(variant.openingQuantity) < 0) emptyFields.push("openingQuantity");

      // if (settings.serialno && !variant.serialno) emptyFields.push(`variant_${index}_serialno`);
      if (settings.units && !variant.unit) emptyFields.push(`variant_${index}_unit`);
    });

    if (emptyFields.includes("purchasePrice")) newErrors.purchasePrice = "Purchase Price must be at least 1";

    if (emptyFields.includes("sellingPrice")) newErrors.sellingPrice = "Selling Price must be at least 1";
    // if (emptyFields.includes("openingQuantity")) newErrors.openingQuantity = "Opening Quantity must be at least 1";

    if (formData.purchasePrice && !regexPatterns.price.test(formData.purchasePrice)) newErrors.purchasePrice = "Purchase Price must be a positive number with up to 2 decimal places";
    if (formData.sellingPrice && !regexPatterns.price.test(formData.sellingPrice)) newErrors.sellingPrice = "Selling Price must be a positive number with up to 2 decimal places";

    setHighlightedFields(emptyFields);
    setErrors(newErrors);
    return Object.values(newErrors).filter(Boolean); // Return array of error messages for toast notifications
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateStep();

    if (validationErrors.length > 0) {
      toast.error("Please fill all the required fields");
      return;
    }

    const formPayload = new FormData();
    // Append fields as before
    if (formData.productName) formPayload.append("productName", formData.productName);
    if (formData.sku) formPayload.append("sku", formData.sku);
    formPayload.append("brand", selectedBrands?.value || "");
    formPayload.append("category", selectedCategory?.value || "");
    formPayload.append("subcategory", selectedsubCategory?.value || "");
    if (settings.supplier) formPayload.append("supplier", selectedSupplier?.value || "");
    // if (formData.store) formPayload.append("store", formData.store);
    // formPayload.append("warehouse", selectedWarehouse?.value || "");
    // Use variants[0] for fields managed in the Variants section
    const primaryVariant = variants[0] || {};

    if (primaryVariant.purchasePrice !== undefined && primaryVariant.purchasePrice !== null && primaryVariant.purchasePrice !== "") formPayload.append("purchasePrice", primaryVariant.purchasePrice);
    if (primaryVariant.sellingPrice !== undefined && primaryVariant.sellingPrice !== null && primaryVariant.sellingPrice !== "") formPayload.append("sellingPrice", primaryVariant.sellingPrice);

    // if (formData.retailPrice) formPayload.append("retailPrice", formData.retailPrice);

    if (primaryVariant.openingQuantity !== undefined && primaryVariant.openingQuantity !== null && primaryVariant.openingQuantity !== "") formPayload.append("openingQuantity", primaryVariant.openingQuantity);
    if (primaryVariant.quantityInLot !== undefined && primaryVariant.quantityInLot !== null && primaryVariant.quantityInLot !== "") formPayload.append("quantityInLot", primaryVariant.quantityInLot);
    if (primaryVariant.stockQuantity !== undefined && primaryVariant.stockQuantity !== null && primaryVariant.stockQuantity !== "") formPayload.append("stockQuantity", primaryVariant.stockQuantity);

    if (primaryVariant.serialNumber) formPayload.append("serialNumber", primaryVariant.serialNumber);

    // Add missing fields for update
    formPayload.append("description", formData.description || "");
    formPayload.append("lotNumber", primaryVariant.lotNumber || "");
    formPayload.append("serialNumbers", JSON.stringify(primaryVariant.serialNumbers || []));

    if (primaryVariant.unit) formPayload.append("unit", primaryVariant.unit);
    else formPayload.append("unit", selectedUnits?.value || "");
    formPayload.append("tax", primaryVariant.tax ?? 0);

    // if (formData.itemType) formPayload.append("itemType", formData.itemType);
    // if (formData.isAdvanced) formPayload.append("isAdvanced", formData.isAdvanced ? true : false);
    // if (formData.trackType) formPayload.append("trackType", formData.trackType);
    // formPayload.append("isReturnable", formData.isReturnable ? true : false);
    // if (formData.returnable) formPayload.append("returnable", formData.returnable ? true : false);
    formPayload.append("hsn", selectedHSN?.value || "");
    // formPayload.append("itemBarcode", newBarcode);

    // formPayload.append(
    //   "lotDetails",
    //   JSON.stringify({
    //     lotNo: lotDetails.lotNo,
    //     fabricBatchNo: lotDetails.fabricBatchNo,
    //     productionDate: lotDetails.productionDate || null,
    //     designCode: lotDetails.designCode,
    //     quantity: lotDetails.quantity,
    //   })
    // );

    // Prepare variants payload
    const variantsPayload = variants.map(v => {
      const taxVal = v.tax === "" || v.tax === null || v.tax === undefined ? 0 : Number(v.tax) || 0;
      return {
        ...v,
        tax: taxVal,
        imageCount: v.images ? v.images.length : 0,
        description: formData.description || "",
        lotNumber: v.lotNumber || "",
        serialNumbers: v.serialNumbers || [],
        supplier: v.supplier || "",
      };
    });

    if (variantsPayload.length > 0) {
      formPayload.append("variants", JSON.stringify(variantsPayload));
    } else if (formData.variants && Object.keys(formData.variants).length > 0) {
      formPayload.append("variants", JSON.stringify(formData.variants));
    }

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
      setIsDirty(false);
      const returnPath = location.state?.from || '/product';
      navigate(returnPath);
    } catch (err) {
      // console.log(err.response?.data);
      const errorMessage = err.response?.data?.message || "Failed to update product";
      toast.error(errorMessage);
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
    setIsDirty(true);
  };

  const handleVariantChange = (index, fieldOrVariant, maybeValue) => {
    if (typeof maybeValue !== "undefined") {
      if (fieldOrVariant === "quantityInLot" && settings.serialno) return;
      setVariants(prev =>
        prev.map((v, i) => (i === index ? { ...v, [fieldOrVariant]: maybeValue } : v))
      );
      setIsDirty(true);
      return;
    }
    const value = (fieldOrVariant || "").trim();
    setVariants(prev =>
      prev.map((v, i) =>
        i === index ? { ...v, selectedVariant: value, selectedValue: [], valueDropdown: [] } : v
      )
    );
    setIsDirty(true);
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
    setIsDirty(true);
  };

  const handleAddVariant = () => {
    setVariants(prev => [
      ...prev,
      { selectedVariant: "", selectedValue: [], valueDropdown: [] }
    ]);
    setIsDirty(true);
  };

  const handleRemoveVariant = index => {
    if (variants.length > 1) {
      setVariants(prev => prev.filter((_, i) => i !== index));
      setIsDirty(true);
    }
  };

  const handleVariantImageChange = (index, e) => {
    const files = Array.from(e.target.files || []);
    const maxSize = 1 * 1024 * 1024;
    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    const validFiles = [];
    const invalidErrors = [];

    // Check limit
    const currentVariant = variants[index];
    const existingCount = images.length; // Images from DB
    const newCount = currentVariant.images ? currentVariant.images.length : 0; // Newly added images
    const totalCurrent = existingCount + newCount;

    if (totalCurrent + files.length > 6) {
      toast.error("Maximum 6 images allowed");
      e.target.value = ""; // Reset input
      return;
    }

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
      setIsDirty(true);
    }
  };

  const handleRemoveVariantImage = (variantIndex, fileToRemove) => {
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
    setIsDirty(true);
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
    <div className="p-4" style={{ height: '100vh' }}>

      {/* header */}
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
            {t("Edit Product")}
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

                  {/* Supplier */}
                  {settings.supplier && (
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
                          Supplier
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
                          border: highlightedFields.includes("supplier")
                            ? "1px var(--White-Stroke, #fa3333ff) solid"
                            : "1px var(--White-Stroke, #EAEAEA) solid",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "8px",
                          display: "flex",
                        }}
                      >
                        <select
                          value={selectedSupplier?.value || ""}
                          onChange={(e) => {
                            const selected =
                              options.find(
                                (opt) => opt.value === e.target.value
                              ) || null;
                            setSelectedSupplier(selected);
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
                          {options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Description */}
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
                        Description
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
                      <input
                        type="text"
                        name="description"
                        placeholder="Enter Description"
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
                  </div>

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
                        width: "100%",
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
                        value={selectedCategory?.value || ""}
                        onChange={(e) => {
                          const selected = categories.find((cat) => cat.value === e.target.value) || null;
                          setSelectedCategory(selected);
                          setCategoryId(selected?.value || null);

                          // Clear subcategory when category changes
                          setSelectedsubCategory(null);
                          setSubCategoryId(null);

                          if (selected) {
                            fetchSubcategoriesByCategory(selected.value);
                          } else {
                            setSubcategories([]);
                          }
                          setIsDirty(true);
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
                            <div
                              key={cat.value}
                              className="button-hover"
                              onClick={() => {
                                setSelectedCategory(cat);
                                setCategoryId(cat.value);
                                setDropDown(false);
                                setSelectedsubCategory(null);
                                setSubCategoryId(null);
                                setFormErrors((prev) => ({ ...prev, category: "" }));
                                fetchSubcategoriesByCategory(cat.value);
                                setIsDirty(true);
                              }}
                              style={{ display: 'flex', justifyContent: 'start', alignItems: 'center', width: '100%', padding: '5px 14px', cursor: 'pointer' }}
                            >
                              <label
                                style={{
                                  fontSize: 15,
                                  color: "black",
                                  fontWeight: "500",
                                  cursor: 'pointer',
                                }}
                              >
                                {cat.label}
                              </label>
                            </div>
                          ))}
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

                  {/* sub-category */}
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
                        position: 'relative'
                      }}
                    >
                      {/* <select
                        value={selectedsubCategory?.value || ""}
                        onChange={(e) => {
                          const selected =
                            subcategories.find(
                              (sub) => sub.value === e.target.value
                            ) || null;
                          subCategoryChange(selected);
                          setSubCategoryId(selected?.value || null);
                          setFormErrors((prev) => ({ ...prev, subCategory: "" }));
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
                        <option value="">Select Sub-Category</option>
                        {subcategories.map((sub) => (
                          <option key={sub.value} value={sub.value}>
                            {sub.label}
                          </option>
                        ))}
                      </select> */}
                      <div style={{ display: 'flex', gap: '5px', }} onClick={() => setDropDownSubCat(true)} >
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
                            <div
                              key={sub.value}
                              className="button-hover"
                              onClick={() => {
                                setSelectedsubCategory(sub);
                                setSubCategoryId(sub.value);
                                setDropDownSubCat(false);
                                setFormErrors((prev) => ({ ...prev, subCategory: "" }));
                                setIsDirty(true);
                              }}
                              style={{ display: 'flex', justifyContent: 'start', alignItems: 'center', width: '100%', padding: '5px 14px', cursor: 'pointer' }}
                            >
                              <label
                                style={{
                                  fontSize: 15,
                                  color: "black",
                                  fontWeight: "500",
                                  cursor: 'pointer',
                                }}
                              >
                                {sub.label}
                              </label>
                            </div>
                          ))}
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

              <div
                style={{
                  width: "1832px",
                  height: "1px",
                  background: "var(--Stroke, #EAEAEA)",
                }}
              />

              {/* lot / batch section */}
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
                  Lot / Batch
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
                      padding: '16px 8px',
                    }}
                  // className="row"
                  >

                    {/* Delete button */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        width: "20px",
                      }}
                      className="col-1"
                    >
                      <div
                        className=""
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          gap: '6px',
                          height: "100%",
                          cursor: index === 0 ? "not-allowed" : "pointer",
                        }}
                        onClick={() => {
                          if (index === 0) return;
                          if (variants.length <= 1) return;
                          setVariants(variants.filter((_, i) => i !== index));
                        }}
                      >
                        <BsThreeDotsVertical className="fs-4" />
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
                          border: (highlightedFields.includes("purchasePrice") && (!variant.purchasePrice || Number(variant.purchasePrice) < 1)) ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
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
                            placeholder="0.00"
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
                          Quantity in lot
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
                          border: (highlightedFields.includes("quantityInLot") && (!variant.quantityInLot || Number(variant.quantityInLot) < 1)) ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
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
                            name="stockQuantity"
                            value={variant.stockQuantity || ""}
                            onChange={(e) => {
                              if (settings.serialno) return;
                              handleVariantChange(index, "stockQuantity", e.target.value);
                            }}
                            readOnly={settings.serialno}
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
                          border: (highlightedFields.includes("sellingPrice") && (!variant.sellingPrice || Number(variant.sellingPrice) < 1)) ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
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
                            placeholder="0.00"
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
                          border: "1px var(--White-Stroke, #EAEAEA) solid",
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
                          <option value="0">0%</option>
                          <option value="0.25">0.25%</option>
                          <option value="3">3%</option>
                          <option value="5">5%</option>
                          <option value="18">18%</option>
                          <option value="40">40%</option>
                        </select>
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
                  </div>))}

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
                    borderRadius: "8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    border: "1px solid #EAEAEA",
                    padding: "16px",
                    marginTop: "16px",
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
                          padding: '16px',
                        }}
                      >

                        {images.length === 0 ? (
                          <>
                            <label
                              htmlFor={`variant-image-${index}`}
                              style={{
                                width: "350px",
                                minHeight: "200px",
                                cursor: "pointer",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                border: "2px dashed #EAEAEA",
                                borderRadius: "8px",
                                padding: '16px',
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
                                      </div>
                                    ))}
                                    {variant.images.length < 6 && (
                                      <div
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
                                        }}
                                      >
                                        <FcAddImage size={30} />
                                      </div>
                                    )}
                                  </div>
                                </>
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
                                  key={`existing-${i}`}
                                  style={{ position: "relative" }}
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
                                      handleRemoveImage(file);
                                    }}
                                  >
                                    &times;
                                  </button>
                                </div>
                              ))}
                              {variant.images?.map((file, i) => (
                                <div
                                  className="col-auto"
                                  key={`new-${i}`}
                                  style={{ position: "relative" }}
                                >
                                  <img
                                    src={file.preview}
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
                                      handleRemoveVariantImage(index, file);
                                    }}
                                  >
                                    &times;
                                  </button>
                                </div>
                              ))}
                              {(images.length + (variant.images?.length || 0)) < 6 && (
                                <div
                                  className="col-auto"
                                  onClick={() => document.getElementById(`variant-image-add-${index}`).click()}
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
                                  <input
                                    id={`variant-image-add-${index}`}
                                    type="file"
                                    multiple
                                    accept="image/jpeg,image/png,image/jpg"
                                    onChange={(e) => handleVariantImageChange(index, e)}
                                    style={{ display: "none" }}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              )}
                            </div>
                          </>
                        )}
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
                        opacity: 1,
                      }}
                    // disabled={!isDirty}
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
                        Save
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Add Serial Popup */}
      {addserialpopup && currentVariantIndex !== null && (
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
            zIndex: 999,
          }}
          onClick={(e) => setAddSerialPopup(false)}
        >
          <div
            style={{
              width: 'auto',
              maxHeight: '80vh',
              overflowY: 'auto',
              padding: '10px 16px',
              backgroundColor: '#F2F6F9',
              border: '1px solid #E1E1E1',
              borderRadius: '8px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '16px 8px', }} className="delete-hover">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
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

              {/* done button */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  style={{
                    padding: "6px 6px",
                    background: "var(--Blue, #1F7FFF)",
                    borderRadius: "4px",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "70px",
                  }}
                  onClick={(e) => setAddSerialPopup(false)}
                >
                  <span
                    style={{
                      color: "var(--White, white)",
                      fontSize: "14px",
                      fontFamily: "Inter",
                      fontWeight: "400",
                    }}
                  >
                    Done
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

export default ProductEdit;
