import React, { useState, useEffect, useRef } from "react";
import api from "../../../pages/config/axiosInstance";
import { toast } from "react-toastify";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";

const System_Setting = () => {
  const [dropdown, setDropDown] = useState(false);
  const [loading, setLoading] = useState(false);

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
    variants: { size: false, color: false },
    units: false,
    expiry: false,
  });

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropDown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    fetchSettings();
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

  const handleCheckboxChange = (field, subField = null) => {
    if (field === 'variants') {
      setSettings(prev => ({
        ...prev,
        variants: {
          ...prev.variants,
          [subField]: !prev.variants[subField]
        }
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [field]: !prev[field]
      }));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await api.post('/api/system-settings', settings);
      if (response.data.success) {
        toast.success("System settings updated successfully");
        // Optionally update local state with response data if needed, but we already have it
      }
    } catch (error) {
      // console.error("Error updating system settings:", error);
      toast.error("Failed to update system settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: "#fff",
        fontFamily: "'Inter', sans-serif",
        minHeight: "100vh",
        padding: "32px",
      }}
    >
      {/* Page Title */}
      <div
        style={{
          fontSize: 24,
          fontWeight: "600",
          color: "#0E101A",
          marginBottom: 32,
        }}
      >
        System Setting
      </div>

      <div style={{ overflow: "auto", height: "calc(100vh - 330px)", width: '100%' }}>

        <div
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: "#0E101A",
            marginBottom: 20,
          }}
        >
          General Setting
        </div>

        {/* brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            // justifyContent: "space-around",
            marginBottom: 24,
            // maxWidth: 610,
            width: '100%'
          }}
        >
          <label
            style={{
              fontSize: 14,
              color: "#3D3D3D",
              fontWeight: "400",
              width: '50%',
            }}
          >
            Brand :
          </label>
          <input
            type="checkbox"
            checked={settings.brand}
            onChange={() => handleCheckboxChange('brand')}
            style={{
              width: 20,
              height: 20,
              accentColor: "#1F7FFF",
              cursor: "pointer",
            }}
          />
        </div>

        {/* description */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            // justifyContent: "space-around",
            marginBottom: 24,
            // maxWidth: 610,
            width: '100%'
          }}
        >
          <label
            style={{
              fontSize: 14,
              color: "#3D3D3D",
              fontWeight: "400",
              width: '50%',
            }}
          >
            Description :
          </label>
          <input
            type="checkbox"
            checked={settings.description}
            onChange={() => handleCheckboxChange('description')}
            style={{
              width: 20,
              height: 20,
              accentColor: "#1F7FFF",
              cursor: "pointer",
            }}
          />
        </div>

        {/* category */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            // justifyContent: "space-around",
            marginBottom: 24,
            // maxWidth: 610,
            width: '100%'
          }}
        >
          <label
            style={{
              fontSize: 14,
              color: "#3D3D3D",
              fontWeight: "400",
              width: '50%',
            }}
          >
            Category :
          </label>
          <input
            type="checkbox"
            checked={settings.category}
            onChange={() => handleCheckboxChange('category')}
            style={{
              width: 20,
              height: 20,
              accentColor: "#1F7FFF",
              cursor: "pointer",
            }}
          />
        </div>

        {/* subcategory */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            // justifyContent: "space-around",
            marginBottom: 24,
            // maxWidth: 610,
            width: '100%'
          }}
        >
          <label
            style={{
              fontSize: 14,
              color: "#3D3D3D",
              fontWeight: "400",
              width: '50%',
            }}
          >
            Subcategory :
          </label>
          <input
            type="checkbox"
            checked={settings.subcategory}
            onChange={() => handleCheckboxChange('subcategory')}
            style={{
              width: 20,
              height: 20,
              accentColor: "#1F7FFF",
              cursor: "pointer",
            }}
          />
        </div>

        {/* hsn */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            // justifyContent: "space-around",
            marginBottom: 24,
            // maxWidth: 610,
            width: '100%'
          }}
        >
          <label
            style={{
              fontSize: 14,
              color: "#3D3D3D",
              fontWeight: "400",
              width: '50%',
            }}
          >
            HSN :
          </label>
          <input
            type="checkbox"
            checked={settings.hsn}
            onChange={() => handleCheckboxChange('hsn')}
            style={{
              width: 20,
              height: 20,
              accentColor: "#1F7FFF",
              cursor: "pointer",
            }}
          />
        </div>

        <div
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: "#0E101A",
            marginTop: 40,
            marginBottom: 20,
          }}
        >
          Lot / Batch Setting
        </div>

        {/* Lot No*/}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            // justifyContent: "space-around",
            marginBottom: 24,
            // maxWidth: 610,
            width: '100%'
          }}
        >
          <label
            style={{
              fontSize: 14,
              color: "#3D3D3D",
              fontWeight: "400",
              width: '50%'
            }}
          >
            Lot No :
          </label>
          <input
            type="checkbox"
            checked={settings.lotno}
            onChange={() => handleCheckboxChange('lotno')}
            style={{
              width: 20,
              height: 20,
              accentColor: "#1F7FFF",
              cursor: "pointer",
            }}
          />
        </div>

        {/* serial no */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            // justifyContent: "space-around",
            marginBottom: 24,
            // maxWidth: 610,
            width: '100%'
          }}
        >
          <label
            style={{
              fontSize: 14,
              color: "#3D3D3D",
              fontWeight: "400",
              width: '50%',
            }}
          >
            Serial No :
          </label>
          <input
            type="checkbox"
            checked={settings.serialno}
            onChange={() => handleCheckboxChange('serialno')}
            style={{
              width: 20,
              height: 20,
              accentColor: "#1F7FFF",
              cursor: "pointer",
            }}
          />
        </div>

        {/* supplier */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            // justifyContent: "space-around",
            marginBottom: 24,
            // maxWidth: 610,
            width: '100%'
          }}
        >
          <label
            style={{
              fontSize: 14,
              color: "#3D3D3D",
              fontWeight: "400",
              width: '50%',
            }}
          >
            Supplier :
          </label>
          <input
            type="checkbox"
            checked={settings.supplier}
            onChange={() => handleCheckboxChange('supplier')}
            style={{
              width: 20,
              height: 20,
              accentColor: "#1F7FFF",
              cursor: "pointer",
            }}
          />
        </div>

        {/* Unit */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            // justifyContent: "space-around",
            marginBottom: 24,
            // maxWidth: 610,
            width: '100%'
          }}
        >
          <label
            style={{
              fontSize: 14,
              color: "#3D3D3D",
              fontWeight: "400",
              width: '50%',
            }}
          >
            Unit :
          </label>
          <input
            type="checkbox"
            checked={settings.units}
            onChange={() => handleCheckboxChange('units')}
            style={{
              width: 20,
              height: 20,
              accentColor: "#1F7FFF",
              cursor: "pointer",
            }}
          />
        </div>

        {/* Save Buttons */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 16 }}>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              padding: "10px 32px",
              background: loading ? "#ccc" : "#1F7FFF",
              color: "white",
              fontSize: 14,
              fontWeight: "500",
              fontFamily: "'Inter', sans-serif",
              border: "none",
              borderRadius: 8,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "inset -1px -1px 4px rgba(0,0,0,0.25)",
              minHeight: 40,
              opacity: 1
            }}
          >
            {loading ? "Saving..." : "Save Setting"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default System_Setting;