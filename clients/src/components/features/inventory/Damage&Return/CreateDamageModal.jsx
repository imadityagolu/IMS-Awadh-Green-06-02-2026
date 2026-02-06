import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import tick from "../../../../assets/images/tick.png";
import { RxCrossCircled } from "react-icons/rx";
import api from "../../../../pages/config/axiosInstance";
import { sanitizeInput } from "../../../../utils/sanitize";

const CreateDamageModal = ({ closeModal }) => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    category: "",
    product: "",
    quantity: "",
    remarks: "",
  });
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [maxQuantity, setMaxQuantity] = useState(0);
  const [quantity, setQuantity] = useState("");
  const [remarks, setRemarks] = useState("");

  const fetchCategories = async () => {
    try {
      const res = await api.get("/api/category/categories");
      setCategories(res.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchProducts = async (categoryId) => {
    try {
      const url = categoryId ? `/api/products?category=${categoryId}` : `/api/products`;
      const res = await api.get(url);
      setProducts(res.data.products || []);
    } catch (err) {
      setProducts([]);
      console.error("Failed to fetch products", err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const newErrors = {};
    if (!selectedCategoryId) newErrors.category = "Category is required.";
    if (!selectedProductId) newErrors.product = "Product is required.";
    if (!quantity) newErrors.quantity = "Quantity is required.";
    if (Number(quantity) > maxQuantity) newErrors.quantity = `Quantity cannot exceed ${maxQuantity}`;
    if (!remarks) newErrors.remarks = "Remarks are required.";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    setFormData({
      category: selectedCategoryId,
      product: selectedProductId,
      quantity: Number(quantity),
      remarks: remarks ? sanitizeInput(remarks) : "",
    });

    try {
      if (!selectedCategoryId || !selectedProductId) return;
      const payload = {
        category: selectedCategoryId,
        product: selectedProductId,
        quantity: Number(quantity),
        remarks: remarks ? sanitizeInput(remarks) : "",
      };
      await api.post("/api/damage-return", payload);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        if (typeof (window).onDamageCreated === "function") {
          (window).onDamageCreated();
        }
        closeModal();
      }, 1000);
    } catch (err) {
      console.error("Failed to create damage", err);
      setShowError(true);
      setTimeout(() => {
        setShowError(false);
      }, 1000);
    }
  };

  const handleInnerClick = (e) => {
    e.stopPropagation();
  };

  const handleFormClick = (e) => {
    e.stopPropagation();  // FIXED: Stop on form
  };

  const handleChildClick = (e) => {
    e.stopPropagation();  // FIXED: Generic for inputs/select/textarea
  };
  useEffect(() => {
    if (selectedCategoryId) {
      fetchProducts(selectedCategoryId);
      setSelectedProductId("");
      setMaxQuantity(0);
      setQuantity("");
    } else {
      setProducts([]);
      setSelectedProductId("");
      setMaxQuantity(0);
      setQuantity("");
    }
  }, [selectedCategoryId]);

  const onCategoryChange = (e) => {
    setSelectedCategoryId(e.target.value || "");
  };

  const onProductChange = (e) => {
    const pid = e.target.value || "";
    setSelectedProductId(pid);
    const found = products.find((p) => p._id === pid);
    const oq = found?.stockQuantity || 0;
    setMaxQuantity(oq);
    setQuantity(oq ? String(oq) : "");
  };

  const onQuantityChange = (e) => {
    const valStr = e.target.value;
    const valNum = Number(valStr);
    if (Number.isNaN(valNum)) {
      setQuantity("");
      return;
    }
    const clamped = Math.max(0, Math.min(valNum, maxQuantity));
    setQuantity(String(clamped));
  };

  const onRemarksChange = (e) => {
    const val = e.target.value;
    setRemarks(val);

    // Clear remarks error if now filled
    if (val.trim()) {
      setErrors(prev => ({ ...prev, remarks: "" }));
    }
  };

  return (
    <div
      onClick={closeModal}
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
    >
      <div
        onClick={handleInnerClick}
        // ref={modelRef}
        className="create-category-modelbox"
        style={{
          backgroundColor: "white",
          width: "800px",
          padding: "50px 40px",
          borderRadius: "8px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "end" }}>
          <button
            onClick={(e) => {  // FIXED: Stop on X
              e.stopPropagation();
              closeModal();
            }}
            style={{
              border: "2px solid #727681",
              borderRadius: "50px",
              width: "25px",
              height: "25px",
              backgroundColor: "white",
              color: "#727681",
              fontWeight: "500",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: "13px",
            }}
          >
            x
          </button>
        </div>

        {showSuccess && (
          <div
            className="create-successfully-msg d-flex justify-content-between align-items-center mb-4"
            style={{
              border: "1px solid #0D6828",
              color: "#0D6828",
              background: '#EBFFF1',
              borderRadius: "8px",
              padding: "10px",
              margin: "15px 0",
            }}
            onClick={handleChildClick}
          >
            <label htmlFor="" style={{ fontFamily: "Inter", fontSize: "14px" }}>
              <img src={tick} alt="tick" /> Damage Successfully Created
            </label>
          </div>
        )}

        {showError && (
          <div
            className="create-error-msg d-flex justify-content-between align-items-center mb-4"
            style={{
              border: "1px solid #D62D20",
              color: "#D62D20",
              background: '#FFEBE6',
              borderRadius: "8px",
              padding: "10px",
              margin: "15px 0",
            }}
            onClick={handleChildClick}
          >
            <label htmlFor="" style={{ fontFamily: "Inter", fontSize: "14px" }}>
              <RxCrossCircled /> Failed to Create Damage.
            </label>
          </div>
        )}

        <h1 style={{ color: "#0E101A", fontSize: "22px", fontFamily: "Inter" }}>
          Record Damage
        </h1>
        <form onSubmit={handleSave}>
          <div className="add-category-form d-flex gap-3 pt-3 pb-3">
            <div className="d-flex flex-column gap-1 w-100">
              <label
                htmlFor=""
                style={{
                  color: "black",
                  fontFamily: "Inter",
                  fontSize: "13px",
                }}
              >
                Category <span style={{ color: "red" }}>*</span>
              </label>
              <select
                onClick={handleChildClick}
                onChange={onCategoryChange}
                className="border-hover"
                name=""
                id=""
                style={{
                  border: "1px solid #dfddddff",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  fontFamily: "Inter",
                  color: "grey",
                  outline: "none",
                }}
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.categoryName}
                  </option>
                ))}
              </select>
              {errors?.category && (
                <small style={{ color: "red", fontSize: "12px" }}>
                  {errors.category}
                </small>
              )}
            </div>
            <div className="d-flex flex-column gap-1 w-100">
              <label
                htmlFor=""
                style={{
                  color: "black",
                  fontFamily: "Inter",
                  fontSize: "13px",
                }}
              >
                Product <span style={{ color: "red" }}>*</span>
              </label>
              <select
                onClick={handleChildClick}
                onChange={onProductChange}
                className="border-hover"
                name=""
                id=""
                style={{
                  border: "1px solid #dfddddff",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  fontFamily: "Inter",
                  color: "grey",
                  outline: "none",
                }}
              >
                <option value="">Select Product</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.productName}
                  </option>
                ))}
              </select>
              {errors?.product && (
                <small style={{ color: "red", fontSize: "12px" }}>
                  {errors.product}
                </small>
              )}
            </div>
            <div className="d-flex flex-column gap-1 w-100">
              <label
                htmlFor=""
                style={{
                  color: "black",
                  fontFamily: "Inter",
                  fontSize: "13px",
                }}
              >
                Quantity <span style={{ color: "red" }}>*</span> <span style={{ color: "grey" }}>(Available Qty: {maxQuantity})</span>
              </label>
              <input
                className="border-hover"
                type="number"
                min={0}
                max={maxQuantity}
                value={quantity}
                onClick={handleChildClick}
                onChange={onQuantityChange}
                placeholder="Enter Quantity"
                style={{
                  border: "1px solid #dfddddff",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  outline: "none",
                  color: '#c2c0c0ff',
                }}
              />
              {errors?.quantity && (
                <small style={{ color: "red", fontSize: "12px" }}>
                  {errors.quantity}
                </small>
              )}
            </div>
          </div>

          <div className="d-flex flex-column gap-1 w-100 pb-4">
            <label
              htmlFor=""
              style={{
                color: "black",
                fontFamily: "Inter",
                fontSize: "13px",
              }}
            >
              Review <span style={{ color: "red" }}>*</span>
            </label>
            <textarea
              className="border-hover"
              onClick={handleChildClick}
              onChange={onRemarksChange}   // ← Now uses real-time sanitization
              value={remarks}
              rows={3}
              placeholder="Enter Remarks"
              style={{
                border: "1px solid #dfddddff",
                padding: "8px 12px",
                borderRadius: "8px",
                fontFamily: "Inter",
                color: "grey",
                outline: "none",
              }}
            >
            </textarea>
            {errors?.remarks && (
              <small style={{ color: "red", fontSize: "12px" }}>
                {errors.remarks}
              </small>
            )}
          </div>

          <button
            type="submit"
            className="button-hover"
            style={{
              backgroundColor: "rgb(31, 127, 255)",
              // color: "white",
              fontFamily: "Inter",
              border: "none",
              borderRadius: "8px",
              padding: "4px 8px",
            }}
          >
            <div style={{ textDecoration: "none", color: "white" }}>Save</div>
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateDamageModal;
