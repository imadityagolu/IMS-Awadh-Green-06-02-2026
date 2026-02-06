// utils/roleDefaults.js
export const ALL_MODULES = {
  // Main
  "Dashboard": "Dashboard",

  // Connect
  "Chat": "Chat",
  "Mail": "Mail",
  "Whatsapp": "Whatsapp",

  // Inventory
  "Product": "Product",
  "Category": "Category",
  "SubCategory": "SubCategory",
  "DamageRecord": "DamageRecord",
  "LowStocks": "LowStocks",
  // "Brand": "Brand",
  // "Unit": "Unit",
  "HSN": "HSN",
  // "VariantAttributes": "VariantAttributes",
  // "Warranty": "Warranty",
  "Barcode": "Barcode",

  // Customer
  "Customer": "Customer",
  "DuesAdvance": "DuesAdvance",
  "Supplier": "Supplier",

  // Warehouse
  // "Warehouse": "Warehouse",
  // "StockMovementLog": "StockMovementLog",

  // Purchases
  "Purchase": "Purchase",
  "DebitNote": "DebitNote",

  // Stock
  // "Stock": "Stock",
  // "StockAdjustment": "StockAdjustment",

  // Sales
  "Sales": "Sales",
  "CreditNote": "CreditNote",
  "Invoices": "Invoices",
  "Quotation": "Quotation",
  "POS": "POS",

  //My Online Store
  "MyOnlineStore": "MyOnlineStore",

  // Promo
  // "Coupons": "Coupons",
  // "GiftCards": "GiftCards",
  "PointsRewards": "PointsRewards", // Added for Points & Rewards

  // Location
  // "Location": "Location", 
  // "Country": "Country",
  // "State": "State",
  // "City": "City",

  // User Management
  "Users": "Users",
  // "Roles": "Roles",
  // "CreateRoles": "CreateRoles",

  // Settings
  "Settings": "Settings",
  // "Profile": "Profile",
  // "Security": "Security",
  // "Website": "Website",
  "CompanySettings": "CompanySettings",
  "BankDetails": "BankDetails",
  // "Localization": "Localization",

  // Finance & Accounts
  // "Finance": "Finance",
  // "Reports": "Reports",

  // Reports
  "SalesReport": "SalesReport", // Added
  "PurchaseReport": "PurchaseReport",
  "InventoryReport": "InventoryReport", // Added
  "SupplierReport": "SupplierReport", // Added
  "DamageReport": "DamageReport", // Added
  "CreditDebitNoteReport": "CreditDebitNoteReport", // Added
  "OverdueReport": "OverdueReport", // Added
  "ExpenseReport": "ExpenseReport", // Added

  // Special sections (for warehouse sub-items)
  // "AllWarehouse": "AllWarehouse",
  // "StockMovementLog": "StockMovementLog",

  // Activity & Trash (always visible)
  "Activity": "Activity",
  "Trash": "Trash"
};

export const DEFAULT_PERMISSIONS = {
  create: false,
  read: false,
  update: false,
  delete: false
};