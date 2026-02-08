import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { FaArrowLeft } from "react-icons/fa6";
import sanitizeHtml from "sanitize-html";
import api from "../../../../pages/config/axiosInstance";
import { MdImageSearch, MdLockOutline } from "react-icons/md";
import AiLogo from "../../../../assets/images/AI.png";

const sanitizeOptions = {
  allowedTags: ["b", "i", "em", "strong", "a", "p", "br"],
  allowedAttributes: {
    a: ["href"],
  },
};

const ProductView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const location = useLocation();

  const [formData, setFormData] = useState({
    productName: "",
    category: "",
    subCategory: "",
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

  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedsubCategory, setSelectedsubCategory] = useState(null);
  const [selectedBrands, setSelectedBrands] = useState(null);
  const [selectedUnits, setSelectedUnits] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [selectedHSN, setSelectedHSN] = useState(null);

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [brandOptions, setBrandOptions] = useState([]);
  const [unitsOptions, setUnitsOptions] = useState([]);
  const [options, setOptions] = useState([]);
  const [optionsware, setOptionsWare] = useState([]);
  const [optionsHsn, setOptionsHsn] = useState([]);

  const [brandId, setBrandId] = useState(null);
  const [categoryId, setCategoryId] = useState(null);
  const [subCategoryId, setSubCategoryId] = useState(null);
  const [supplierId, setSupplierId] = useState(null);
  const [warehouseId, setWarehouseId] = useState(null);

  const [variants, setVariants] = useState([
    { selectedVariant: "", selectedValue: [], valueDropdown: [] },
  ]);

  const [images, setImages] = useState([]);

  // Mock settings for view mode to show all available fields
  const settings = {
    brand: true,
    supplier: true,
    lotno: true,
    serialno: true,
    units: true,
    hsn: true,
  };

  const highlightedFields = []; // No validation highlighting in view mode

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/api/products/${id}`);
        const data = res.data;
        const sanitizedData = {
          ...data,
          productName: sanitizeHtml(data.productName || "", sanitizeOptions),
        };

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
          discountValue: computedDiscountValue,
        }));

        if (data.brand) setBrandId(data.brand._id || data.brand);
        if (data.subcategory) setSubCategoryId(data.subcategory._id || data.subcategory);
        if (data.category) setCategoryId(data.category._id || data.category);
        if (data.unit) setSelectedUnits({ value: data.unit, label: data.unit });

        // Handle Supplier (priority to object if available)
        const supplierData = data.supplier || data.lotSupplier;
        if (supplierData) {
          if (typeof supplierData === 'object') {
            const label = `${supplierData.supplierName || ''}`.trim();
            setSelectedSupplier({ value: supplierData._id, label });
          } else {
            setSupplierId(supplierData);
          }
        }

        if (data.warehouse) setWarehouseId(data.warehouse._id || data.warehouse);
        if (data.hsn) {
          const hsnOption = optionsHsn.find(
            (opt) => opt.value === (data.hsn._id || data.hsn)
          );
          if (hsnOption) setSelectedHSN(hsnOption);
        }

        // --- VARIANTS PATCH ---
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
          stockQuantity: data.stockQuantity,
          quantityInLot: data.quantityInLot,
          lotNumber: data.lotNumber,
          serialNumbers: data.serialNumbers || [], // Ensure serialNumbers are included
        };
        setVariants([existingVariant]);

        if (data.images && data.images.length > 0) {
          const existingImages = data.images.map((img) => ({
            preview: img.url,
            url: img.url,
            public_id: img.public_id,
          }));
          setImages(existingImages);
        }

        setLoading(false);
      } catch (err) {
        toast.error("Failed to fetch product");
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, optionsHsn]); // Added optionsHsn dependency to ensure HSN selection works if options load later

  // Fetch dropdown data
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/api/category/categories");
        const data = res.data;
        const activeCategories = (Array.isArray(data) ? data : data?.categories || [])
          .filter(cat => cat.isDelete !== true);
        setCategories(activeCategories.map((c) => ({ value: c._id, label: sanitizeHtml(c.categoryName, sanitizeOptions) })));
      } catch (error) { toast.error("Failed to load categories"); }
    };
    const fetchBrands = async () => {
      try {
        const res = await api.get("/api/brands/active-brands");
        setBrandOptions(res.data.brands.map((b) => ({ value: b._id, label: sanitizeHtml(b.brandName, sanitizeOptions) })));
      } catch (error) { }
    };
    const fetchUnits = async () => {
      try {
        const res = await api.get("/api/unit/units/status/active");
        setUnitsOptions(res.data.units.map((u) => ({ value: u.shortName, label: sanitizeHtml(`${u.unitsName} (${u.shortName})`, sanitizeOptions) })));
      } catch (error) { }
    };
    const fetchSuppliers = async () => {
      try {
        const res = await api.get("/api/suppliers");
        const options = res.data.suppliers.map((supplier) => ({
          value: supplier._id,
          label: sanitizeHtml(`${supplier.supplierName} (${supplier.supplierCode})`, sanitizeOptions),
        }));
        setOptions(options);
      } catch (error) { }
    };
    const fetchWarehouses = async () => {
      try {
        const res = await api.get("/api/warehouse/active");
        if (res.data.success) setOptionsWare(res.data.data.map((w) => ({ value: w._id, label: sanitizeHtml(w.warehouseName, sanitizeOptions) })));
      } catch (error) { }
    };
    const fetchHSN = async () => {
      try {
        const res = await api.get("/api/hsn/all");
        if (res.data.success) setOptionsHsn(res.data.data.map((h) => ({ value: h._id, label: sanitizeHtml(`${h.hsnCode} - ${h.description || ""}`, sanitizeOptions) })));
      } catch (error) { }
    };

    fetchCategories();
    fetchBrands();
    fetchUnits();
    fetchSuppliers();
    fetchWarehouses();
    fetchHSN();
  }, []);

  // Update selected states based on fetched IDs and options
  useEffect(() => {
    if (brandOptions.length > 0 && brandId) {
      const found = brandOptions.find((opt) => opt.value === brandId);
      if (found) setSelectedBrands(found);
    }
  }, [brandOptions, brandId]);

  useEffect(() => {
    if (categoryId && categories.length > 0) {
      const foundCat = categories.find((opt) => opt.value === categoryId);
      if (foundCat) {
        setSelectedCategory(foundCat);
        fetchSubcategoriesByCategory(foundCat.value);
      }
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
      const activeSubcats = (Array.isArray(data) ? data : data?.subcategories || []).filter(sub => sub.isDelete !== true);
      setSubcategories(activeSubcats.map((s) => ({ value: s._id, label: s.name })));
    } catch (error) {
      toast.error("Failed to load subcategories");
      setSubcategories([]);
    }
  };

  useEffect(() => {
    if (subCategoryId && subcategories.length > 0) {
      const found = subcategories.find((opt) => opt.value === subCategoryId);
      if (found) setSelectedsubCategory(found);
    }
  }, [subCategoryId, subcategories]);

  useEffect(() => {
    if (supplierId && options.length > 0) {
      const found = options.find((opt) => opt.value === supplierId);
      if (found) setSelectedSupplier(found);
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
      const hsnValue = typeof formData.hsn === "object" ? formData.hsn._id : formData.hsn;
      const found = optionsHsn.find((opt) => opt.value === hsnValue);
      if (found) setSelectedHSN(found);
    }
  }, [optionsHsn, formData.hsn]);


  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ background: "#F5F6FA", minHeight: "100vh", padding: "20px", }}>

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
            View Product Details
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

      {/* Body */}
      <div style={{ width: "100%", padding: "16px", background: "white", borderRadius: "16px", border: "1px solid #EAEAEA", display: "flex", flexDirection: "column", gap: "24px", overflowX: 'auto', maxHeight: 'calc(100vh - 140px)' }}>

        {/* General Details */}
        <div style={{ width: "1832px" }}>
          <div style={{ color: "black", fontSize: "16px", fontFamily: "Inter", fontWeight: "500", lineHeight: "19.20px" }}>
            General Details
          </div>
          <div style={{ gap: "50px", width: "100%", marginTop: "16px", display: "flex", justifyContent: 'space-between' }}>
            {/* Product Name */}
            <div style={{ width: "400px", display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                <span style={{ color: "#727681", fontSize: "12px", fontFamily: "Inter" }}>Product Name</span>
              </div>
              <div style={{ width: "100%", height: "40px", padding: "0 12px", background: "white", borderRadius: "8px", border: "1px solid #EAEAEA", display: "flex", alignItems: "center" }}>
                <input
                  type="text"
                  value={formData.productName}
                  readOnly
                  style={{ width: "100%", border: "none", background: "transparent", fontSize: "14px", outline: "none" }}
                />
              </div>
            </div>

            {/* Brand */}
            {selectedBrands?.label && (
              <div style={{ width: "400px", display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                  <span style={{ color: "#727681", fontSize: "12px", fontFamily: "Inter" }}>Brand</span>
                </div>
                <div style={{ width: "100%", height: "40px", padding: "0 12px", background: "white", borderRadius: "8px", border: "1px solid #EAEAEA", display: "flex", alignItems: "center" }}>
                  <input
                    type="text"
                    value={selectedBrands?.label || ""}
                    readOnly
                    style={{ width: "100%", border: "none", background: "transparent", fontSize: "14px", outline: "none" }}
                  />
                </div>
              </div>
            )}

            {/* Supplier */}
            {selectedSupplier?.label && (
              <div style={{ width: "400px", display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                  <span style={{ color: "#727681", fontSize: "12px", fontFamily: "Inter" }}>Supplier</span>
                </div>
                <div style={{ width: "100%", height: "40px", padding: "0 12px", background: "white", borderRadius: "8px", border: "1px solid #EAEAEA", display: "flex", alignItems: "center" }}>
                  <input
                    type="text"
                    value={selectedSupplier?.label || ""}
                    readOnly
                    style={{ width: "100%", border: "none", background: "transparent", fontSize: "14px", outline: "none" }}
                  />
                </div>
              </div>
            )}

            {/* HSN */}
            {selectedHSN?.label && (
              <div style={{ width: "400px", display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                  <span style={{ color: "#727681", fontSize: "12px", fontFamily: "Inter" }}>HSN</span>
                </div>
                <div style={{ width: "100%", height: "40px", padding: "0 12px", background: "white", borderRadius: "8px", border: "1px solid #EAEAEA", display: "flex", alignItems: "center" }}>
                  <input
                    type="text"
                    value={selectedHSN?.label || ""}
                    readOnly
                    style={{ width: "100%", border: "none", background: "transparent", fontSize: "14px", outline: "none" }}
                  />
                </div>
              </div>
            )}

          </div>

          {/* Description */}
          {formData.description && <div style={{ width: "100%", marginTop: "16px", display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
              <span style={{ color: "#727681", fontSize: "12px", fontFamily: "Inter" }}>Description</span>
            </div>
            <div style={{
              width: "100%",
              padding: "12px",
              background: "white",
              borderRadius: "8px",
              border: "1px solid #EAEAEA",
              fontSize: "14px",
              color: "#1F1F1F",
              whiteSpace: "pre-wrap"
            }}>
              {formData.description ? sanitizeHtml(formData.description, { allowedTags: [] }) : "No description available"}
            </div>
          </div>}

          <div style={{ gap: "80px", width: "100%", marginTop: "16px", display: "flex" }}>
            {/* Category */}
            {selectedCategory?.label && <div style={{ width: "400px", display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                <span style={{ color: "#727681", fontSize: "12px", fontFamily: "Inter" }}>Category</span>
              </div>
              <div style={{ width: "100%", height: "40px", padding: "0 12px", background: "white", borderRadius: "8px", border: "1px solid #EAEAEA", display: "flex", alignItems: "center" }}>
                <input
                  type="text"
                  value={selectedCategory?.label || ""}
                  readOnly
                  style={{ width: "100%", border: "none", background: "transparent", fontSize: "14px", outline: "none" }}
                />
              </div>
            </div>}

            {/* Sub Category */}
            {selectedsubCategory?.label && <div style={{ width: "400px", display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                <span style={{ color: "#727681", fontSize: "12px", fontFamily: "Inter" }}>Sub Category</span>
              </div>
              <div style={{ width: "100%", height: "40px", padding: "0 12px", background: "white", borderRadius: "8px", border: "1px solid #EAEAEA", display: "flex", alignItems: "center" }}>
                <input
                  type="text"
                  value={selectedsubCategory?.label || ""}
                  readOnly
                  style={{ width: "100%", border: "none", background: "transparent", fontSize: "14px", outline: "none" }}
                />
              </div>
            </div>}
          </div>
        </div>

        {/* Lot / Batch */}
        <div>
          <div style={{ color: "black", fontSize: "16px", fontFamily: "Inter", fontWeight: "500", lineHeight: "19.20px" }}>
            Lot / Batch
          </div>

          {variants.map((variant, index) => (
            <div key={index} style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "16px 8px" }}>

              {/* Variant Row Inputs */}
              <div style={{ display: "flex", gap: "16px", width: "1830px", overflowX: "auto" }}>

                {/* Lot No */}
                {settings.lotno && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "275px" }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                      <span style={{ color: "#727681", fontSize: "12px", fontFamily: "Inter" }}>Lot No.</span>
                    </div>
                    <div style={{ height: "40px", padding: "0 12px", background: "white", borderRadius: "8px", border: "1px solid #EAEAEA", display: "flex", alignItems: "center" }}>
                      <input
                        type="text"
                        value={variant.lotNumber || ""}
                        readOnly
                        style={{ width: "100%", border: "none", background: "transparent", fontSize: "14px", outline: "none" }}
                      />
                    </div>
                  </div>
                )}

                {/* Unit */}
                {settings.units && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "195px" }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                      <span style={{ color: "#727681", fontSize: "12px", fontFamily: "Inter" }}>Unit</span>
                    </div>
                    <div style={{ height: "40px", padding: "0 12px", background: "white", borderRadius: "8px", border: "1px solid #EAEAEA", display: "flex", alignItems: "center" }}>
                      <input
                        type="text"
                        value={variant.unit || ""}
                        readOnly
                        style={{ width: "100%", border: "none", background: "transparent", fontSize: "14px", outline: "none" }}
                      />
                    </div>
                  </div>
                )}

                {/* Purchasing Price */}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "195px" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                    <span style={{ color: "#727681", fontSize: "12px", fontFamily: "Inter" }}>Purchasing Price</span>
                  </div>
                  <div style={{ height: "40px", padding: "0 12px", background: "white", borderRadius: "8px", border: "1px solid #EAEAEA", display: "flex", alignItems: "center" }}>
                    <input
                      type="number"
                      value={variant.purchasePrice || ""}
                      readOnly
                      style={{ width: "100%", border: "none", background: "transparent", fontSize: "14px", outline: "none" }}
                    />
                  </div>
                </div>

                {/* Stock Quantity */}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "195px" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                    <span style={{ color: "#727681", fontSize: "12px", fontFamily: "Inter" }}>Available Quantity</span>
                  </div>
                  <div style={{ height: "40px", padding: "0 12px", background: "white", borderRadius: "8px", border: "1px solid #EAEAEA", display: "flex", alignItems: "center" }}>
                    <input
                      type="number"
                      value={variant.stockQuantity || ""}
                      readOnly
                      style={{ width: "100%", border: "none", background: "transparent", fontSize: "14px", outline: "none" }}
                    />
                  </div>
                </div>

                {/* Selling Price */}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "195px" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                    <span style={{ color: "#727681", fontSize: "12px", fontFamily: "Inter" }}>Selling Price</span>
                  </div>
                  <div style={{ height: "40px", padding: "0 12px", background: "white", borderRadius: "8px", border: "1px solid #EAEAEA", display: "flex", alignItems: "center" }}>
                    <input
                      type="number"
                      value={variant.sellingPrice || ""}
                      readOnly
                      style={{ width: "100%", border: "none", background: "transparent", fontSize: "14px", outline: "none" }}
                    />
                  </div>
                </div>

                {/* Tax */}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "195px" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                    <span style={{ color: "#727681", fontSize: "12px", fontFamily: "Inter" }}>Tax</span>
                  </div>
                  <div style={{ height: "40px", padding: "0 12px", background: "white", borderRadius: "8px", border: "1px solid #EAEAEA", display: "flex", alignItems: "center" }}>
                    <input
                      type="text"
                      value={variant.tax ? `${variant.tax}%` : ""}
                      readOnly
                      style={{ width: "100%", border: "none", background: "transparent", fontSize: "14px", outline: "none" }}
                    />
                  </div>
                </div>

              </div>

              {/* Serial Numbers Display - Between Lot/Batch row and Import Images (technically after the row) */}
              {variant.serialNumbers && variant.serialNumbers.length > 0 && (
                <div style={{ width: "100%", marginTop: "8px", padding: "12px", background: "#F9FAFB", borderRadius: "8px", border: "1px solid #EAEAEA" }}>
                  <div style={{ fontSize: "14px", fontWeight: "500", marginBottom: "8px", color: "#1F1F1F" }}>Serial Numbers</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {variant.serialNumbers.map((sn, i) => (
                      <span key={i} style={{
                        padding: "4px 8px",
                        background: "white",
                        borderRadius: "4px",
                        fontSize: "12px",
                        border: "1px solid #EAEAEA",
                        color: "#333"
                      }}>
                        {sn}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ))}
        </div>

        {/* Import Images */}
        <div style={{ width: "auto", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "16px", border: "1px solid #EAEAEA", padding: "16px", marginTop: "16px" }}>
          <div style={{ color: "black", fontSize: "16px", fontFamily: "Inter", fontWeight: "500", marginBottom: "10px" }}>
            Product Images
          </div>

          <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "flex-start", gap: "24px", width: "100%", flexWrap: "wrap" }}>
            {images.map((file, i) => (
              <div key={i} style={{ position: "relative" }}>
                <img
                  src={file.url || file.preview}
                  alt={`product-${i}`}
                  className="img-thumbnail"
                  style={{ height: 100, width: 100, objectFit: "cover", borderRadius: "8px", border: "1px solid #EAEAEA" }}
                />
              </div>
            ))}
            {images.length === 0 && (
              <div style={{ color: "#727681", fontSize: "14px" }}>No images available</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProductView;
