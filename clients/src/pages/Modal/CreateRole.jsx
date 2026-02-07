// components/Role/CreateRole.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { MdKeyboardArrowLeft } from "react-icons/md";
import api from "../config/axiosInstance";
import { ALL_MODULES, DEFAULT_PERMISSIONS } from "../../utils/roleDefaults";

const CreateRole = () => {
  const navigate = useNavigate();
  const [roleName, setRoleName] = useState("");
  const [modulePermissions, setModulePermissions] = useState({});
  const [loading, setLoading] = useState(false);

  // Initialize modules with default permissions
  const initializeModules = () => {
    const permissions = {};
    Object.keys(ALL_MODULES).forEach((module) => {
      permissions[module] = { ...DEFAULT_PERMISSIONS, all: false };
    });
    setModulePermissions(permissions);
  };

  // Toggle all permissions for a module
  const toggleModuleAll = (module) => {
    setModulePermissions((prev) => {
      const current = prev[module] || { ...DEFAULT_PERMISSIONS, all: false };
      const newAll = !current.all;

      return {
        ...prev,
        [module]: {
          create: newAll,
          read: newAll,
          update: newAll,
          delete: newAll,
          all: newAll,
        },
      };
    });
  };

  // Toggle specific permission for a module
  const togglePermission = (module, permission) => {
    setModulePermissions((prev) => {
      const current = prev[module] || { ...DEFAULT_PERMISSIONS, all: false };
      const updated = {
        ...current,
        [permission]: !current[permission],
      };

      // Update "all" field if all permissions are true
      updated.all =
        updated.create && updated.read && updated.update && updated.delete;

      return {
        ...prev,
        [module]: updated,
      };
    });
  };

  // Select all permissions for all modules
  const selectAllPermissions = () => {
    const allPermissions = {};
    Object.keys(ALL_MODULES).forEach((module) => {
      allPermissions[module] = {
        create: true,
        read: true,
        update: true,
        delete: true,
        all: true,
      };
    });
    setModulePermissions(allPermissions);
  };

  // Reset all permissions
  const resetPermissions = () => {
    initializeModules();
  };

  // Handle save
  const handleSave = async () => {
    if (!roleName.trim()) {
      toast.error("Please enter a role name");
      return;
    }

    setLoading(true);
    try {
      const roleData = {
        roleName,
        status: "Active",
        modulePermissions,
      };

      const response = await api.post("/api/role/create", roleData);

      toast.success("Role created successfully!");
      navigate("/Users");
    } catch (error) {
      // console.error("Create role error:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to create role";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Group modules by category for display
  const groupedModules = {
    Main: ["Dashboard"],
    Connect: ["Chat", "Mail", "Whatsapp"],
    Inventory: [
      "Product",
      "Brand",
      "Category",
      //   "SubCategory",
      "DamageRecord",
      "LowStocks",
      "HSN",
      "Barcode",
    ],
    Customer: ["Customer", "DuesAdvance", "Supplier"],
    Purchases: ["Purchase", "DebitNote"],
    // "Stock": ["Stock", "StockAdjustment"],
    Sales: ["Sales", "CreditNote", "Invoices", "Quotation", "POS",],
    // Warehouse: ["Warehouse", "StockMovementLog"],
    MyOnlineStore: ["MyOnlineStore"],
    Promo: ["PointsRewards"],
    // "Location": ["Country", "State", "City"],
    UserManagement: ["Users"],
    Reports: [
      // "Reports",
      "SalesReport",
      "PurchaseReport",
      "InventoryReport",
      "SupplierReport",
      "DamageReport",
      "CreditDebitNoteReport",
      "OverdueReport",
      "ExpenseReport",
    ],
    Settings: [
      "Settings",
      // "Profile",
      // "Security",
      // "Website",
      "CompanySettings",
      "BankDetails",
      // "Localization",
    ],
    // "Finance & Accounts": ["Finance", "SalesReport", "PurchaseReport", "InventoryReport", "SupplierReport", "ReturnDamageReport", "CreditDebitNoteReport", "OverdueReport", "ExpenseReport"]
  };

  // Initialize modules on component mount
  React.useEffect(() => {
    initializeModules();
  }, []);

  return (
    <div className="p-4 min-h-screen bg-gray-50" style={{ height: "100vh" }}>
      {/* Header */}
      <div
        className="d-flex align-items-center gap-2"
        style={{ marginBottom: "20px" }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            background: "#fff",
            borderRadius: 50,
            border: "1px solid #EAEAEA",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Link to="/Users">
            <MdKeyboardArrowLeft
              style={{ color: "#6C748C", fontSize: "25px" }}
            />
          </Link>
        </div>
        <h3
          style={{
            fontSize: "22px",
            color: "#0E101A",
            fontFamily: '"Inter", sans-serif',
            fontWeight: 500,
            lineHeight: "120%",
            marginBottom: "0",
          }}
        >
          Create Role
        </h3>
      </div>

      <div
        style={{
          margin: "0 auto",
          background: "white",
          borderRadius: "16px",
          padding: "20px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          maxHeight: "calc(100vh - 220px)",
          overflow: "hidden",
        }}
      >
        {/* Title */}
        <h1
          style={{
            fontFamily: "Inter",
            fontSize: "20px",
            fontWeight: "600",
            color: "#0E101A",
            marginBottom: "24px",
          }}
        >
          Create New Role
        </h1>

        {/* Role Name Input */}
        <div style={{ marginBottom: "24px", maxWidth: "400px" }}>
          <label style={{ display: "block", marginBottom: "6px" }}>
            <span
              style={{
                color: "#727681",
                fontSize: "12px",
                fontFamily: "Inter",
              }}
            >
              Role Name
            </span>
            <span style={{ color: "#D00003", marginLeft: "4px" }}>*</span>
          </label>
          <input
            type="text"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            placeholder="Enter Role Name"
            style={{
              width: "100%",
              height: "40px",
              padding: "0 12px",
              borderRadius: "8px",
              border: "1px solid #EAEAEA",
              fontSize: "14px",
              fontFamily: "Inter",
              color: "#0E101A",
              outline: "none",
            }}
            disabled={loading}
          />
        </div>

        {/* Permission Actions */}
        <div style={{ marginBottom: "20px", display: "flex", gap: "12px" }}>
          <button
            onClick={selectAllPermissions}
            style={{
              padding: "8px 16px",
              backgroundColor: "#1F7FFF",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
            }}
            disabled={loading}
          >
            Select All Permissions
          </button>
          <button
            onClick={resetPermissions}
            style={{
              padding: "8px 16px",
              backgroundColor: "#F3F4F6",
              color: "#374151",
              border: "1px solid #D1D5DB",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
            }}
            disabled={loading}
          >
            Reset All
          </button>
        </div>

        <h2
          style={{
            fontFamily: "Inter",
            fontSize: "16px",
            fontWeight: "500",
            color: "#0E101A",
            marginBottom: "12px",
          }}
        >
          Permissions
        </h2>

        {/* Permissions Table */}
        <div style={{ overflow: "auto", maxHeight: "calc(100vh - 470px)" }}>
          {Object.entries(groupedModules).map(([category, modules]) => (
            <div key={category} style={{ marginBottom: "40px" }}>
              <div
                style={{
                  borderRadius: "8px",
                  overflow: "hidden",
                  fontFamily: "Inter",
                }}
              >
                {/* Category Header */}
                <div
                  style={{
                    backgroundColor: "#F3F8FB",
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    fontSize: "14px",
                    color: "#727681",
                    fontWeight: "500",
                  }}
                >
                  <div
                    style={{
                      width: "50px",
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <label style={{ cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={modules.every(
                          (m) => modulePermissions[m]?.all,
                        )}
                        onChange={() => {
                          const allChecked = modules.every(
                            (m) => modulePermissions[m]?.all,
                          );
                          modules.forEach((module) => {
                            if (allChecked) {
                              // Uncheck all
                              toggleModuleAll(module);
                            } else {
                              // Check all
                              setModulePermissions((prev) => ({
                                ...prev,
                                [module]: {
                                  create: true,
                                  read: true,
                                  update: true,
                                  delete: true,
                                  all: true,
                                },
                              }));
                            }
                          });
                        }}
                        style={{ display: "none" }}
                        disabled={loading}
                      />
                      <div
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "4px",
                          border: `2px solid ${modules.every((m) => modulePermissions[m]?.all) ? "#1F7FFF" : "#A2A8B8"}`,
                          backgroundColor: modules.every(
                            (m) => modulePermissions[m]?.all,
                          )
                            ? "#1F7FFF"
                            : "white",
                          position: "relative",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {modules.every((m) => modulePermissions[m]?.all) && (
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            fill="none"
                          >
                            <path
                              d="M2 6L5 9L10 3"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        )}
                      </div>
                    </label>
                  </div>
                  <div style={{ width: "400px", textAlign: "left" }}>
                    {category}
                  </div>
                  <div style={{ flex: 1, textAlign: "center" }}>Create</div>
                  <div style={{ flex: 1, textAlign: "center" }}>Read</div>
                  <div style={{ flex: 1, textAlign: "center" }}>Update</div>
                  <div style={{ flex: 1, textAlign: "center" }}>Delete</div>
                  <div style={{ flex: 1, textAlign: "center" }}>All</div>
                </div>

                {/* Module Rows */}
                {modules.map((module) => {
                  const permissions = modulePermissions[module] || {
                    ...DEFAULT_PERMISSIONS,
                    all: false,
                  };
                  return (
                    <div
                      key={module}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "12px 16px",
                        backgroundColor: "white",
                        borderTop: "1px solid #FCFCFC",
                      }}
                    >
                      <div
                        style={{
                          width: "50px",
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        <label style={{ cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={permissions.all}
                            onChange={() => toggleModuleAll(module)}
                            style={{ display: "none" }}
                            disabled={loading}
                          />
                          <div
                            style={{
                              width: "18px",
                              height: "18px",
                              borderRadius: "4px",
                              border: `2px solid ${permissions.all ? "#1F7FFF" : "#A2A8B8"}`,
                              backgroundColor: permissions.all
                                ? "#1F7FFF"
                                : "white",
                              position: "relative",
                            }}
                          >
                            {permissions.all && (
                              <svg
                                style={{
                                  position: "absolute",
                                  top: "-1px",
                                  left: "-1px",
                                }}
                                width="18"
                                height="18"
                                viewBox="0 0 18 18"
                                fill="none"
                              >
                                <path
                                  d="M4.5 9L7.5 12L13.5 6"
                                  stroke="white"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                />
                              </svg>
                            )}
                          </div>
                        </label>
                      </div>

                      <div
                        style={{
                          width: "400px",
                          textAlign: "left",
                          fontSize: "14px",
                          color: "#0E101A",
                        }}
                      >
                        {module}
                      </div>

                      {["create", "read", "update", "delete"].map((perm) => (
                        <div
                          key={perm}
                          style={{
                            flex: 1,
                            display: "flex",
                            justifyContent: "center",
                          }}
                        >
                          <label style={{ cursor: "pointer" }}>
                            <input
                              type="checkbox"
                              checked={permissions[perm]}
                              onChange={() => togglePermission(module, perm)}
                              style={{ display: "none" }}
                              disabled={loading}
                            />
                            <div
                              style={{
                                width: "36px",
                                height: "20px",
                                backgroundColor: permissions[perm]
                                  ? "#1F7FFF"
                                  : "#A2A8B8",
                                borderRadius: "20px",
                                position: "relative",
                              }}
                            >
                              <div
                                style={{
                                  width: "16px",
                                  height: "16px",
                                  backgroundColor: "white",
                                  borderRadius: "50%",
                                  position: "absolute",
                                  top: "2px",
                                  left: permissions[perm] ? "18px" : "2px",
                                  transition: "left 0.2s",
                                }}
                              />
                            </div>
                          </label>
                        </div>
                      ))}

                      {/* All Toggle */}
                      <div
                        style={{
                          flex: 1,
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        <label style={{ cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={permissions.all}
                            onChange={() => toggleModuleAll(module)}
                            style={{ display: "none" }}
                            disabled={loading}
                          />
                          <div
                            style={{
                              width: "36px",
                              height: "20px",
                              backgroundColor: permissions.all
                                ? "#1F7FFF"
                                : "#A2A8B8",
                              borderRadius: "20px",
                              position: "relative",
                            }}
                          >
                            <div
                              style={{
                                width: "16px",
                                height: "16px",
                                backgroundColor: "white",
                                borderRadius: "50%",
                                position: "absolute",
                                top: "2px",
                                left: permissions.all ? "18px" : "2px",
                                transition: "left 0.2s",
                              }}
                            />
                          </div>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div
        style={{
          marginTop: "20px",
          display: "flex",
          justifyContent: "flex-end",
          gap: "12px",
        }}
      >
        <button
          onClick={() => navigate("/Users")}
          style={{
            padding: "10px 24px",
            backgroundColor: "#F3F4F6",
            color: "#374151",
            border: "1px solid #D1D5DB",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "500",
            fontFamily: "Inter",
            cursor: "pointer",
          }}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={loading || !roleName.trim()}
          style={{
            padding: "10px 32px",
            backgroundColor: loading ? "#93C5FD" : "#1F7FFF",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "500",
            fontFamily: "Inter",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Creating..." : "Save Role"}
        </button>
      </div>
    </div>
  );
};

export default CreateRole;
