import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../suppliers/Supplier.css";
import { RxCross2 } from "react-icons/rx";
import { useNavigate } from "react-router-dom";
import api from "../../../pages/config/axiosInstance";
import { Country, State, City } from "country-state-city";
import Select from "react-select";
import DOMPurify from "dompurify";
import { toast } from "react-toastify";

const EditCustomerModal = ({ customer, onClose }) => {
  const navigate = useNavigate();

  const [successMessage, setSuccessMessage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Country/State/City states
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    gstin: "",
    address: "",
    country: "",
    state: "",
    city: "",
    pincode: "",
  });

  // Pre-fill form when customer data is passed
  useEffect(() => {
    if (!customer) return;

    setForm({
      name: customer.name || "",
      phone: customer.phone || "",
      email: customer.email || "",
      gstin: customer.gstin || "",
      address: customer.address || "",
      country: customer.country || "",
      state: customer.state || "",
      city: customer.city || "",
      pincode: customer.pincode || "",
    });

    // Pre-select country
    if (customer.country) {
      const countryObj = Country.getAllCountries().find(
        (c) => c.name === customer.country
      );
      if (countryObj) {
        setSelectedCountry({ value: countryObj.isoCode, label: countryObj.name });
      }
    }

    // Pre-select state (only if country is set)
    if (customer.state && customer.country) {
      const countryObj = Country.getAllCountries().find(
        (c) => c.name === customer.country
      );
      if (countryObj) {
        const stateObj = State.getStatesOfCountry(countryObj.isoCode).find(
          (s) => s.name === customer.state
        );
        if (stateObj) {
          setSelectedState({ value: stateObj.isoCode, label: stateObj.name });
        }
      }
    }

    // Pre-select city
    if (customer.city && customer.state && customer.country) {
      const countryObj = Country.getAllCountries().find(
        (c) => c.name === customer.country
      );
      if (countryObj) {
        const stateObj = State.getStatesOfCountry(countryObj.isoCode).find(
          (s) => s.name === customer.state
        );
        if (stateObj) {
          setSelectedCity({ value: customer.city, label: customer.city });
        }
      }
    }
  }, [customer]);

  // Country/State/City options
  const countryOptions = Country.getAllCountries().map((c) => ({
    value: c.isoCode,
    label: c.name,
  }));

  const stateOptions = selectedCountry
    ? State.getStatesOfCountry(selectedCountry.value).map((s) => ({
        value: s.isoCode,
        label: s.name,
      }))
    : [];

  const cityOptions = selectedState
    ? City.getCitiesOfState(selectedCountry.value, selectedState.value).map((c) => ({
        value: c.name,
        label: c.name,
      }))
    : [];

  // Sanitization
  const sanitizeInput = (input) => {
    if (typeof input !== "string") return input;
    return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim();
  };

  // Real-time validation
  const validateField = (name, value) => {
    if (!value.trim()) {
      if (["name", "phone"].includes(name)) return "This field is required";
      return "";
    }

    switch (name) {
      case "phone":
        return /^\d{10}$/.test(value) ? "" : "Enter valid 10-digit phone number";
      case "email":
        return /^\S+@\S+\.\S+$/.test(value) ? "" : "Invalid email address";
      case "pincode":
        return /^\d{6}$/.test(value) ? "" : "Enter valid 6-digit pincode";
      case "gstin":
        return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(value)
          ? ""
          : "Invalid GSTIN format";
      default:
        return "";
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const sanitized = sanitizeInput(value);
    const error = validateField(name, sanitized);

    setErrors((prev) => ({ ...prev, [name]: error }));
    setForm((prev) => ({ ...prev, [name]: sanitized }));
  };

  // Dropdown handlers
  const handleCountryChange = (option) => {
    setSelectedCountry(option);
    setSelectedState(null);
    setSelectedCity(null);
    setForm((prev) => ({
      ...prev,
      country: option ? option.label : "",
      state: "",
      city: "",
    }));
    setErrors((prev) => ({ ...prev, country: "", state: "", city: "" }));
  };

  const handleStateChange = (option) => {
    setSelectedState(option);
    setSelectedCity(null);
    setForm((prev) => ({
      ...prev,
      state: option ? option.label : "",
      city: "",
    }));
    setErrors((prev) => ({ ...prev, state: "", city: "" }));
  };

  const handleCityChange = (option) => {
    setSelectedCity(option);
    setForm((prev) => ({ ...prev, city: option ? option.value : "" }));
    setErrors((prev) => ({ ...prev, city: "" }));
  };

  // Final validation before submit
  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim()) newErrors.name = "Customer name is required";
    if (!form.phone.trim()) newErrors.phone = "Phone number is required";
    if (form.phone && !/^\d{10}$/.test(form.phone))
      newErrors.phone = "Enter valid 10-digit phone number";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email))
      newErrors.email = "Invalid email address";
    if (form.pincode && !/^\d{6}$/.test(form.pincode))
      newErrors.pincode = "Enter valid 6-digit pincode";

    // GSTIN optional — only format check if provided
    if (form.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(form.gstin)) {
      newErrors.gstin = "Invalid GSTIN format";
    }

    // Required address fields
    if (!selectedCountry) newErrors.country = "Country is required";
    if (!selectedState) newErrors.state = "State is required";
    if (!selectedCity) newErrors.city = "City is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors");
      return;
    }

    setLoading(true);
    try {
      await api.put(`/api/customers/${customer._id}`, {
        name: form.name,
        phone: form.phone,
        email: form.email || null,
        gstin: form.gstin || null,
        address: form.address || null,
        country: form.country,
        state: form.state,
        city: form.city,
        pincode: form.pincode || null,
      });

      toast.success("Customer updated successfully!");
      setSuccessMessage(true);
      setTimeout(() => {
        setSuccessMessage(false);
        onClose();
        navigate("/customers");
      }, 1500);
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to update customer");
    } finally {
      setLoading(false);
    }
  };

  if (!customer) {
    return null; // or a loading spinner
  }

  return (
    <div
      className="create-category-modelbox"
        style={{
          backgroundColor: "white",
          width: "800px",
          padding: "30px 40px",
          borderRadius: "8px",
        }}
    >
      <div>
        <div className="modal-content">
          <div
            className="modal-header"
            style={{ borderBottom: "none", display: "flex", alignItems: "center", justifyContent: "end", borderRadius: "50%", padding: "5px 5px" }}
          >
            <button
              style={{
                color: "#727681",
                fontSize: "10px",
                fontWeight: 800,
                border: "2px solid #727681",
                borderRadius: "50%",
                backgroundColor: "transparent",
                width: "30px",
                height: "30px",
                cursor: "pointer",
              }}
              type="button"
              onClick={onClose}
            >
              <RxCross2 style={{ color: "#727681", fontSize: "15px", fontWeight: 900 }} />
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", margin: "10px 0px" }}>
            <h5
              className="modal-title"
              style={{
                color: "#0E101A",
                fontWeight: 500,
                fontSize: "22px",
                fontFamily: '"Inter", sans-serif',
                lineHeight: "120%",
              }}
            >
              Edit Customer
            </h5>
          </div>

          <div className="modal-body">
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label supplierlabel">
                  Customer Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="form-control supplierinput shadow-none"
                  placeholder="Enter Name"
                />
                {errors.name && <small className="text-danger">{errors.name}</small>}
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label supplierlabel" style={{ fontWeight: 600, fontSize: "14px" }}>
                  Phone No. <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <span className="input-group-text" style={{ backgroundColor: "#fff" }}>
                    <img src="https://flagcdn.com/in.svg" alt="India" width="20" className="me-1" />
                    +91
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="form-control supplierinput shadow-none"
                    placeholder="Enter Phone"
                    maxLength="10"
                  />
                </div>
                {errors.phone && <small className="text-danger">{errors.phone}</small>}
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label supplierlabel">Email Id</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="form-control supplierinput shadow-none"
                  placeholder="Enter Email Id"
                />
                {errors.email && <small className="text-danger">{errors.email}</small>}
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label supplierlabel">GSTIN (optional)</label>
                <input
                  type="text"
                  name="gstin"
                  value={form.gstin}
                  onChange={handleChange}
                  className="form-control supplierinput shadow-none"
                  placeholder="Enter GSTIN"
                />
                {errors.gstin && <small className="text-danger">{errors.gstin}</small>}
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label supplierlabel">Address</label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                className="form-control supplierinput shadow-none"
                rows="4"
                placeholder="Enter Full Address"
                style={{ border: "1px dashed #EAEAEA" }}
              />
            </div>

            <div className="row">
              <div className="col-md-3 mb-3">
                <label className="form-label supplierlabel">
                  Country <span className="text-danger">*</span>
                </label>
                <Select
                  options={countryOptions}
                  value={selectedCountry}
                  onChange={handleCountryChange}
                  placeholder="Select Country"
                  className="supplierinput"
                  styles={{
                    control: (base) => ({ ...base, boxShadow: "none", borderColor: "#ced4da" }),
                  }}
                />
                {errors.country && <small className="text-danger">{errors.country}</small>}
              </div>

              <div className="col-md-3 mb-3">
                <label className="form-label supplierlabel">
                  State <span className="text-danger">*</span>
                </label>
                <Select
                  options={stateOptions}
                  value={selectedState}
                  onChange={handleStateChange}
                  placeholder="Select State"
                  isDisabled={!selectedCountry}
                  className="supplierinput"
                  styles={{
                    control: (base) => ({ ...base, boxShadow: "none", borderColor: "#ced4da" }),
                  }}
                />
                {errors.state && <small className="text-danger">{errors.state}</small>}
              </div>

              <div className="col-md-3 mb-3">
                <label className="form-label supplierlabel">
                  City <span className="text-danger">*</span>
                </label>
                <Select
                  options={cityOptions}
                  value={selectedCity}
                  onChange={handleCityChange}
                  placeholder="Select City"
                  isDisabled={!selectedState}
                  className="supplierinput"
                  styles={{
                    control: (base) => ({ ...base, boxShadow: "none", borderColor: "#ced4da" }),
                  }}
                />
                {errors.city && <small className="text-danger">{errors.city}</small>}
              </div>

              <div className="col-md-3 mb-3">
                <label className="form-label supplierlabel">Pin code</label>
                <input
                  type="text"
                  name="pincode"
                  value={form.pincode}
                  onChange={handleChange}
                  className="form-control supplierinput shadow-none"
                  placeholder="Enter Pin Code"
                  maxLength="6"
                />
                {errors.pincode && <small className="text-danger">{errors.pincode}</small>}
              </div>
            </div>
          </div>

          <div className="modal-footer d-flex align-items-start justify-content-start" style={{ borderTop: "none" }}>
            <button
              onClick={handleUpdate}
              type="button"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>

          {/* Success Message */}
          <div
            style={{
              position: "absolute",
              top: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              padding: "0 70px",
              boxSizing: "border-box",
              pointerEvents: "none",
            }}
          >
            {successMessage && (
              <div
                className="create-successfully-msg d-flex justify-content-between align-items-center mb-4"
                style={{
                  border: "1px solid #0D6828",
                  color: "#0D6828",
                  background: "#EBFFF1",
                  borderRadius: "8px",
                  padding: "10px",
                  margin: "15px 0",
                }}
              >
                <label style={{ fontFamily: "Inter", fontSize: "14px" }}>
                  Customer Updated Successfully
                </label>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditCustomerModal;