import React from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import Login from "../components/auth/Login/Login";
import Register from "../components/auth/Register/Register";
import ForgotPassword from "../components/auth/ForgotPassword/ForgotPassword";
import Dashboard from "../components/Dashboard/Admin/AdminDashboard";
// import Setting from "../settings/Setting";
import ResetPassword from "../components/auth/ResetPassword/ResetPassword";
import ChangePassword from "../components/auth/ChangePassword/ChangePassword";
import Profile from "../pages/profile/Profile";
import PrivateRoute from "../utils/PrivateRoute";
import PublicRoute from "../utils/PublicRoute.jsx";

//------------------------------- invetory------------------------------//
import Product from "../components/features/inventory/product/Product";
import ChooseToAddProduct from "../components/features/inventory/product/ChooseToAddProduct.jsx";
import ProductCreate from "../components/features/inventory/product/ProductCreate";
import ProductView from "../components/features/inventory/product/ProductView.jsx"
import DamageReturn from "../components/features/inventory/Damage&Return/DamageReturn.jsx";
import ExpriedProduct from "../components/features/inventory/product/ExpriedProduct";
import Category from "../components/features/category/Category";
import SubCategory from "../components/features/category/subcategory/SubCategory";
// import Country from "../pages/Location/country/Country";
// import State from "../pages/Location/state/State.jsx";
// import City from "../pages/Location/city/City";
// import LocationTable from "../pages/Location/LocationTable";
import Brand from "../components/features/brand/Brand";
import Units from "../components/features/units/Units";
// import Stores from "../components/features/stores/Stores";
import Users from "../components/auth/users/Users";
import Role from "../pages/Role/Role";
// import Permission from "../pages/permission/Permission";
// import RolePermissionEditor from "../pages/permission/RolePermissionEditor";
// import Warranty from "../components/features/inventory/warranty/Warranty";
import Logout from "../components/auth/Logout/Logout.jsx"; // adjust path if needed
import Coupons from "../components/features/Promo/Coupons.jsx";
// ... all your imports remain same
import GiftCard from "../components/features/Promo/GiftCard.jsx"
import "../i18n.js"; // Import here
import Chat from "../components/features/Chat/Chat.jsx";
// import Mail from "../components/features/Mail/mail.jsx"
import Activities from "../components/layouts/Navbar/activities.jsx";
import ViewAllNotifications from "../components/layouts/Navbar/ViewAllNotifications.jsx";
import Barcode from "../components/features/inventory/barcode/Barcode.jsx";
// import Mail from "../components/features/Mail/mail.jsx"

// ------------------ Mail Components ------------------ //
// import MailPage from "../Pages/MailPage";
// import Inbox from "../components/EmailLayout/Inbox";
import MailPage from "../components/features/Mail/Pages/MailPage.jsx";
import Inbox from "../components/features/Mail/EmailLayout/Inbox.jsx"
import Starred from "../components/features/Mail/EmailLayout/Starred.jsx";
import Sent from "../components/features/Mail/EmailLayout/Sent.jsx";
import Drafts from "../components/features/Mail/EmailLayout/Drafts";
import Importants from "../components/features/Mail/EmailLayout/Importants.jsx";
import Spam from "../components/features/Mail/EmailLayout/Spam.jsx";
import Deleted from "../components/features/Mail/EmailLayout/Deleted.jsx";
import EmailMessages from "../components/features/Mail/EmailMessages/EmailMessages.jsx";
// import ManageStock from "../components/features/stock/manageStock/ManageStock";
// import StockAdujestment from "../components/features/stock/stockAdujestment/StockAdujestment";
// import StockTransfer from "../components/features/stock/stockTransfer/StockTransfer";
import Purchase from "../components/features/purchase/Purchases/Purchase.jsx";
// import PurchaseReturn from "../components/features/purchase/PurchaseReturn//PurchaseReturn.jsx";
import PurchaseOrder from "../components/features/purchase/PurchaseOrder/PurchaseOrder.jsx";
// import PurchaseSettings from "../settings/purchase/PurchaseSettings.jsx";
import Hsn from "../components/features/inventory/hsn/Hsn.jsx";
// import Warehouse from "../components/features/warehouse/Warehouse.jsx";
// import RackSettings from "../settings/warehouse/RackSettings.jsx";
// import SidebarSettings from "../settings/sidebar/SidebarSettings.jsx";
// import Variant from "../components/features/variant/Variant.JSX";
// import AdminDashboard from "../components/Dashboard/Admin/AdminDashboard.jsx";
// import ThemeCustomizer from "../pages/themes/ThemeCustomizer.jsx";
// import LanguageSwitcher from "../utils/LanguageSwitch/LanguageSwitcher.jsx";
import DebitNote from "../components/features/creditDebit/debitNote/DebitNote.jsx";
import CustomerCreditNote from "../components/features/creditDebit/creditNote/CustomerCreditNote.jsx";
import Sales from "../components/features/sales/Sales.jsx";
// import AddSalesCreate from "../components/features/sales/SalesCreate.jsx";
import SalesDashboard from "../components/features/sales/SalesDashboard.jsx";
import SaleReturn from "../components/features/sales/return/SaleReturn.jsx";
import AllCustomer from "../components/features/customers/AllCustomers.jsx";
// import ViewPurchase from "../pages/Modal/PurchaseModals/ViewPurchase.jsx";
import LowStock from "../components/features/stock/lowstock/LowStock.jsx";
import InvoiceTemplate from "../pages/Invoices/Invoice.jsx";
// import Invoice7 from "../pages/Invoices/Invoice7.jsx";
import ProductEdit from "../components/features/inventory/product/ProductEdit";
// import ProductStock from "../components/features/inventory/product/ProductStock.jsx";
// import ViewProductStock from "../pages/ViewProductStock.jsx";
// import ViewReturnProduct from "../pages/ViewReturnProduct.jsx";
import SaleHistory from "../../../clients/src/components/features/sales/SaleHistory.jsx";
import ViewSales from "../components/features/sales/ViewSales.jsx";
import Invoice from "../components/features/sales/Invoice.jsx";
import SalePaymentHistory from "../../../clients/src/components/features/sales/SalesPaymentHistory.jsx";
import Pos from "../pages/pos/Pos.jsx";

// import Settings from "../pages/setting28-07-2025/Settings.jsx";
// import UserProfiles from "../components/componentSetting/profile/Profile.jsx";
// import Security from "../components/componentSetting/security/Security.jsx";
// import Notification from "../components/componentSetting/notification/Notification.jsx";
// import ConnectedApps from "../components/componentSetting/connectedApps/ConnectedApps.jsx";
// import SystemSettings from "../components/componentSetting/systemsettings/SystemSettings.jsx";
// import Companysettings from "../components/componentSetting/companySettings/Companysettings.jsx";
// import Localization from "../components/componentSetting/localization/Localization.jsx";
// import Prefixes from "../components/componentSetting/prefixes/Prefixes.jsx";
// import Preferance from "../components/componentSetting/prefrance/Preferance.jsx";
// import Appearance from "../components/componentSetting/appearance/Appearance.jsx";
// import SocialAuthentications from "../components/componentSetting/socialAuthentication/SocialAuthentication.jsx";
// import Language from "../components/componentSetting/language/Language.jsx";
// import InvoiceSettings from "../settings/invoice/InvoiceSettings.jsx";
// import AddWarehouse from "../components/features/warehouse/AddWarehouse.jsx";
// import WarehouseDetails from "../components/features/warehouse/WarehouseDetails.jsx";
// import Godown from "../components/features/warehouse/Godown.jsx";
// import SelectPage from "../components/features/warehouse/SelectPage.jsx";
// import StockMovementLog from "../components/features/warehouse/StockMovementLog.jsx";

// FINANNCE & ACCOUNT 
import BalanceSheet from "../pages/finance&accounts/balance_sheet/BalanceSheet.jsx";
import ProfitLoss from "../pages/finance&accounts/profit_loss/ProfitLoss.jsx";
import ProfitLossDateChoose from "../pages/finance&accounts/profit_loss/ProfitLossDateChoose.jsx";
import ProfitLossSelectDate from "../pages/finance&accounts/profit_loss/ProfitLossSelectDate.jsx";
import ExpenseForm from "../pages/finance&accounts/expense_report/ExpenseForm.jsx";
import ExpenseFormEdit from "../pages/finance&accounts/expense_report/ExpenseFromEdit.jsx";
import BC from "../pages/finance&accounts/b2b&b2c/BC.jsx";
import PaymentHistory from "../pages/finance&accounts/payment_history/PaymentHistory.jsx";
import Credit from "../pages/finance&accounts/credit&debit_note/Credit.jsx";
import Debit from "../pages/finance&accounts/credit&debit_note/Debit.jsx";
import ExpenseReportProductModal from "../pages/finance&accounts/expense_report/ExpenseReportProductModal.jsx"
import SalesReport from "../pages/finance&accounts/SalesReport.jsx";
import PurchaseReport from "../pages/finance&accounts/PurchaseReport.jsx";
import InventoryReport from "../pages/finance&accounts/InventoryReport.jsx";
import SupplierReport from "../pages/finance&accounts/SupplierReport.jsx";
import DamageReport from "../pages/finance&accounts/DamageReport.jsx";
import DamageReturnReport from "../pages/finance&accounts/DamageReturnReport.jsx"
import CreditDebitNotes from "../pages/finance&accounts/credit&debit_note/CreditDebitNotes.jsx";
import OverdueReport from "../pages/finance&accounts/overdue_report/OverdueReport.jsx";
import ExpenseReport from "../pages/finance&accounts/expense_report/ExpenseReport.jsx";

// Others 
import PosHeader from "../pages/pos/posHead/PosHeader.jsx";
import OtpVerification from "../components/auth/TwoStepOtpVerification.jsx";
import CustomerCreateQuotation from "../pages/Invoices/CustomerCreateQuotation.jsx";
// import NewPos from "../pages/pos/NewPos.jsx";
import Trash from "../pages/Delete/Trash.jsx";
import AddSalesModal from "../pages/Modal/SalesModal/AddSalesModal.jsx";
import ActivityLog from "../pages/AuditLog/ActivityLog.jsx"
import EmptyCustomers from "../components/features/customers/EmptyCustomers.jsx";
import CustomerCreateInvoice from "../pages/Invoices/CustomerCreateInvoice.jsx";
import Skeleton from "../components/layouts/Skeleton.jsx"
import CustomerDuesAdvanceList from "../components/features/customers/CustomerDuesAdvanceList.jsx";
import CustomerDueEmpty from "../components/features/customers/CustomerDueEmpty.jsx";
import ShowCustomerInvoice from "../pages/Invoices/ShowCustomerInvoice.jsx";
import PointsRewards from "../components/features/Promo/PointsRewards.jsx";
import CreateShoppingPoints from "../components/features/Promo/CreateShoppingPoints.jsx";
import ShowCustomerInvoiceQuotation from "../pages/Invoices/ShowCustomerInvoiceQuotation.jsx";
import SupplierList from "../components/features/suppliers/SupplierList.jsx";
import EmptySupplier from "../components/features/suppliers/EmptySupplier.jsx";
import SupplierDetails from "../components/features/suppliers/SupplierDetails.jsx";
import CreatePurchaseOrder from "../pages/Invoices/CreatePurchaseOrder.jsx";
// import ShowSupplierInvoice from "../pages/Invoices/ShowPurchaseOrderInvoice.jsx";
import SupplierDebitNote from "../components/features/creditDebit/debitNote/SupplierDebitNote.jsx";
import ShowPurchaseOrderInvoice from "../pages/Invoices/ShowPurchaseOrderInvoice.jsx";
import RecentViewInvoice from "../pages/Invoices/RecentViewInvoice.jsx"
import WhatsappInterface from "../components/features/Whatsapp/WhatsappInterface.jsx";
import WhatsappScanner from "../components/features/Whatsapp/WhatsappScanner.jsx";
import SettingsLayouts from "../components/features/Settings/SettingsLayouts.jsx";
import UserProfile from "../components/features/Settings/UserProfile.jsx";
import SettingsCompanyDetails from "../components/features/Settings/SettingsCompanyDetails.jsx";
import NormalPrint from "../components/features/Settings/NormalPrint.jsx";
import NormalPrintInvoice from "../components/features/Settings/NormalPrintInvoice.jsx";
import ThermalPrintInvoice from "../components/features/Settings/ThermalPrintInvoice.jsx";
import ThermalPrint from "../components/features/Settings/ThermalPrint.jsx";
import NotesTermCondition from "../components/features/Settings/NotesTermCondition.jsx";
import Taxes_GST from "../components/features/Settings/Taxes_GST.jsx";
import CreateRole from "../pages/Modal/CreateRole.jsx";
import EditRole from "../pages/Modal/EditRole.jsx";
import BarCodePrint from "../components/features/Settings/BarCodePrint.jsx";
import MainLayouts from "../components/LayoutsCopy/MainLayouts.jsx";
import Quotation from "../pages/Invoices/Quotation.jsx";
import DebitNoteViewEdit from "../components/features/creditDebit/debitNote/DebitNoteViewEdit.jsx";
import EmptyDebitNote from "../components/features/creditDebit/debitNote/EmptyDebitNote.jsx";
import CreditNoteList from "../components/features/creditDebit/creditNote/CreditNoteList.jsx";
import SettingCompanyBank from "../components/componentSetting/companySettings/SettingCompanyBank.jsx";
import EmptyPurchase from "../components/features/purchase/Purchases/EmptyPurchase.jsx"
import PurchaseViewDetails from "../components/features/purchase/Purchases/PurchaseViewDetails.jsx";
import System_Setting from "../components/features/Settings/System_Setting.jsx";
import CustomerCreditNoteViewEdit from "../components/features/creditDebit/creditNote/CustomerCreditNoteViewEdit .jsx";
import AccessDenied from "../components/AccessDenied.jsx";
import PermissionRoute from "./PermissionRoute.jsx";
import UserDetails from "../components/auth/users/UserDetails.jsx";
// import {Pos} from "../pages/pos/Pos.jsx";

const AppRoutes = () => {
  return (
    <Routes>

      {/* ================= ACCESS DENIED ================= */}
      <Route path="/access-denied" element={<AccessDenied />} />

      {/* ---------- Public routes ---------- */}
      <Route
        path="/"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route
        path="/otp"
        element={
          // <PublicRoute>
          <OtpVerification />
          // </PublicRoute>
        }

      />

      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        }
      />

      <Route
        path="/reset-password/:token"
        element={
          <PublicRoute>
            <ResetPassword />
          </PublicRoute>
        }
      />

      <Route
        path="/change-password"
        element={
          <PublicRoute>
            <ChangePassword />
          </PublicRoute>
        }
      />

      <Route path="/logout" element={<Logout />} />

      <Route
        element={
          <PrivateRoute>
            <MainLayouts />
          </PrivateRoute>
        }
      >
        {/* <Route element={<PermissionRoute module="Dashboard" />}> */}
        <Route path="/home" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* </Route> */}

        {/* <Route path="/general-settings" element={<Setting />} />
          <Route path="/" element={<Setting />}>
          <Route path="profile/:id" element={<UserProfiles />} />
          <Route path="security-settings" element={<Security />} />
          <Route path="notification" element={<Notification />} />
          <Route path="connectedapps" element={<ConnectedApps />} />
          <Route path="system-settings" element={<SystemSettings />} />
          <Route path="company-settings" element={<Companysettings />} />
          <Route path="language-settings" element={<Localization />} />
          <Route path="prefixes" element={<Prefixes />} />
          <Route path="preferance" element={<Preferance />} />
          <Route path="appearance" element={<Appearance />} />
          <Route path="socialauth" element={<SocialAuthentications />} />
          <Route path="language" element={<Language />} />
          <Route path="invoice-settings" element={<InvoiceSettings />} />
          <Route path="/Purchase-settings" element={<PurchaseSettings />} />
          <Route path="/warehouse-settings" element={<RackSettings />} />
        </Route> */}

        <Route path="/profile" element={<Profile />} />
        <Route element={<PermissionRoute module="Product" />}>
          <Route path="/product" element={<Product />} />
        </Route>
        <Route path="/product/edit/:id" element={<ProductEdit />} />
        <Route path="/product/view/:id" element={<ProductView />} />
        <Route path="/choose-adproduct" element={<ChooseToAddProduct />} />
        <Route path="/add-product" element={<ProductCreate />} />
        <Route path="/expired-products" element={<ExpriedProduct />} />
        <Route element={<PermissionRoute module="Category" />}>
          <Route path="/category-list" element={<Category />} />
        </Route>
        <Route element={<PermissionRoute module="DamageRecord" />}>
          <Route path="/damage-record" element={<DamageReturn />} />
        </Route>
        <Route element={<PermissionRoute module="SubCategory" />}>
          <Route path="/sub-categories" element={<SubCategory />} />
        </Route>
        <Route path="/brand-list" element={<Brand />} />
        <Route path="/units" element={<Units />} />
        <Route element={<PermissionRoute module="Users" />}>
          <Route path="/users" element={<Users />} />
          <Route path="/usersdetails" element={<UserDetails />} />
          {/* </Route> */}
          <Route path="/roles-permissions" element={<Role />} />
          {/* <Route path="/permissions/:roleId" element={<RolePermissionEditor />} /> */}
          {/* <Route path="/permissions" element={<RolePermissionEditor />} /> */}
          {/* <Route element={<PermissionRoute module="CreateRoles" />}> */}
          <Route path="/create-role" element={<CreateRole />} />
          <Route path="/edit-role/:id" element={<EditRole />} />
        </Route>
        {/* <Route path="/warranty" element={<Warranty />} /> */}
        {/* <Route path="/countries" element={<Country />} /> */}
        {/* <Route path="/states" element={<State />} /> */}
        {/* <Route path="/cities" element={<City />} /> */}
        {/* <Route path="/locations" element={<LocationTable />} /> */}
        {/* <Route path="/store-list" element={<Stores />} /> */}
        <Route element={<PermissionRoute module="PointsRewards" />}>
          <Route path="/point-rewards" element={<PointsRewards />} />
          <Route path="/createshoppingpoints" element={<CreateShoppingPoints />} />
          <Route path="/skeleton" element={<Skeleton />} />
          <Route path="/coupons" element={<Coupons />} />
          <Route path="/gift-cards" element={<GiftCard />} />
        </Route>

        <Route element={<PermissionRoute module="Chat" />}>
          <Route path="/chat" element={<Chat />} />
        </Route>
        <Route element={<PermissionRoute module="Whatsapp" />}>
          <Route path="/whatsapp" element={<WhatsappInterface />} />
          <Route path="/whatsapp-scanner" element={<WhatsappScanner />} />
        </Route>
        {/* <Route path="/variant-attributes" element={<Variant />} /> */}
        {/* <Route path="/admin" element={<AdminDashboard />} /> */}
        {/* <Route path="/theme" element={<ThemeCustomizer />} /> */}
        {/* <Route path="/language" element={<LanguageSwitcher />} /> */}
        <Route element={<PermissionRoute module="DebitNote" />}>
          <Route path="/debit-note" element={<DebitNote />} />
        </Route>
        <Route path="/credit-note/:customerId" element={<CustomerCreditNote />} />
        <Route path="/credit-note" element={<CustomerCreditNote />} />
        <Route path="/activities" element={<Activities />} />
        <Route path="/ViewAllNotifications" element={<ViewAllNotifications />} />
        <Route element={<PermissionRoute module="Barcode" />}>
          <Route path="/barcode" element={<Barcode />} />
        </Route>
        {/* <Route path="/pos" element={<Pos />} /> */}

        {/* purchase */}
        <Route element={<PermissionRoute module="Purchase" />}>
          <Route path="/empty-purchase" element={<EmptyPurchase />} />
          <Route path="/purchase-list" element={<Purchase />} />
          <Route path="/show-purchase-orders/:id" element={<PurchaseViewDetails />} />
          <Route path="/purchase-order" element={<PurchaseOrder />} />
          {/* <Route path="/purchase-returns" element={<PurchaseReturn />} /> */}
        </Route>
        {/* <Route path="/purchase-report" element={<ViewPurchase />} /> */}

        {/* sales */}
        <Route element={<PermissionRoute module="Sales" />}>
          <Route path="/online-orders" element={<Sales />} />
        </Route>
        <Route path="/sales-returns" element={<SaleReturn />} />
        <Route path="/sales/view/:id" element={<ViewSales />} />
        <Route path="/invoice/:invoiceId" element={<Invoice />} />
        <Route path="/sales-log" element={<SaleHistory />} />
        <Route path="/sales-payment" element={<PaymentHistory />} />
        <Route path="/create-quotition/:customerId" element={<CustomerCreateQuotation />} />
        <Route path="/create-quotition" element={<CustomerCreateQuotation />} />
        <Route path="/sales-dashboard" element={<SalesDashboard />} />
        <Route path="/sales-invoice/:id" element={<RecentViewInvoice type="sales" />} />
        <Route path="/purchase-orders/:id" element={<RecentViewInvoice type="purchase" />} />
        <Route path="/add-sales" element={<AddSalesModal />} />
        <Route element={<PermissionRoute module="CreditNote" />}>
          <Route path="/creditnotelist" element={<CreditNoteList />} />
          <Route path="/edit-creditnote/:id" element={<CustomerCreditNoteViewEdit />} />
          <Route path="/creditnote-details/:id" element={<CustomerCreditNoteViewEdit />} />
        </Route>

        {/* stock */}
        {/* <Route path="/stock" element={<ViewProductStock />} /> */}
        {/* <Route path="/return-stock" element={<ViewReturnProduct />} /> */}
        {/* <Route path="/manage-stocks" element={<ManageStock />} /> */}
        {/* <Route path="/stock-adjustment" element={<StockAdujestment />} /> */}
        {/* <Route path="/stock-transfer" element={<StockTransfer />} /> */}
        <Route element={<PermissionRoute module="LowStocks" />}>
          <Route path="/low-stocks" element={<LowStock />} />
        </Route>
        <Route element={<PermissionRoute module="HSN" />}>
          <Route path="/hsn" element={<Hsn />} />
        </Route>
        {/* <Route path="/warehouse" element={<Warehouse />} /> */}
        <Route element={<PermissionRoute module="Invoices" />}>
          <Route path="/invoice" element={<InvoiceTemplate />} />
        </Route>
        {/* <Route path="/invoice7" element={<Invoice7 />} /> */}
        <Route path="/hsn" element={<Hsn />} />
        {/* <Route element={<PermissionRoute module="Warehouse" />}>
        <Route path="/warehouse" element={<Warehouse />} />
        <Route path="/addwarehouse" element={<AddWarehouse />} />
        <Route path="/WarehouseDetails/:id" element={<WarehouseDetails />} />
        <Route path="/Godown/:id" element={<Godown />} />
        <Route path="/selectpage" element={<SelectPage />} />
         </Route>
         <Route element={<PermissionRoute module="StockMovementLog" />}>
        <Route path="/stock-movement-log" element={<StockMovementLog />} />
        </Route> */}
        <Route path="/delete" element={<Trash />} />
        <Route path="/activity" element={<ActivityLog />} />

        {/* customer */}
        <Route element={<PermissionRoute module="Customer" />}>
          <Route path="/empty-customers" element={<EmptyCustomers />} />
          <Route path="/customers" element={<AllCustomer />} />
        </Route>
        <Route element={<PermissionRoute module="DuesAdvance" />}>
          <Route path="/customerdueempty" element={<CustomerDueEmpty />} />
          <Route path="/customerdueadvance" element={<CustomerDuesAdvanceList />}
          />
        </Route>

        {/* credit Note, invoice, generate quotition */}
        <Route path="/createinvoice/:customerId" element={<CustomerCreateInvoice />} />
        <Route path="/createinvoice/" element={<CustomerCreateInvoice />} />
        <Route path="/showinvoice/:invoiceId" element={<ShowCustomerInvoice />} />
        <Route path="/showquotation/:quotationId" element={<ShowCustomerInvoiceQuotation />} />
        <Route path="skeleton" element={<Skeleton />} />

        {/* suppplier */}
        <Route element={<PermissionRoute module="Supplier" />}>
          <Route path="/empty-supplier" element={<EmptySupplier />} />
          <Route path="/supplier-list" element={<SupplierList />} />
          <Route path="/supplier-details" element={<SupplierDetails />} />
        </Route>

        {/* invoice, quotation, credit note */}
        <Route path="/create-purchase-orders/:supplierId" element={<CreatePurchaseOrder />} />
        <Route path="/create-purchase-orders" element={<CreatePurchaseOrder />} />
        <Route path="/purchase-order-preview/:invoiceId" element={<ShowPurchaseOrderInvoice />} />
        <Route path="/create-supplier-debitnote/:supplierId" element={<SupplierDebitNote />} />
        <Route path="/create-supplier-debitnote" element={<SupplierDebitNote />} />
        <Route path="/empty-debitnote" element={<EmptyDebitNote />} />
        <Route path="/edit-debitnote/:id" element={<DebitNoteViewEdit />} />
        <Route path="/debitnote-details/:id" element={<DebitNoteViewEdit />} />
        <Route element={<PermissionRoute module="Quotation" />}>
          <Route path="/quotation" element={<Quotation />} />
        </Route>

        {/* ------------------ MAIL ROUTES ------------------ */}
        <Route element={<PermissionRoute module="Mail" />}>
          <Route path="/mail" element={<MailPage />}>
            <Route path="inbox" element={<Inbox />} />
            <Route path="starred" element={<Starred />} />
            <Route path="sent" element={<Sent />} />
            <Route path="drafts" element={<Drafts />} />
            <Route path="important" element={<Importants />} />
            <Route path="allemails" element={<EmailMessages />} />
            <Route path="spam" element={<Spam />} />
            <Route path="deleted" element={<Deleted />} />
          </Route>
        </Route>

        {/* ------------------ REPORTS / Finance & Accounts ------------------ */}
        <Route path="/balance-sheet" element={<BalanceSheet />} />
        <Route path="/profit&loss" element={<ProfitLoss />} />
        <Route path="/profit_lossdate_choose" element={<ProfitLossDateChoose />} />
        <Route path="/profit_lossselect_date" element={<ProfitLossSelectDate />} />
        <Route path="/add_expenses" element={<ExpenseForm />} />
        <Route path="/expenseformedit" element={<ExpenseFormEdit />} />
        <Route path="/expensereportproduct-modal" element={<ExpenseReportProductModal />} />
        <Route path="/bc" element={<BC />} />
        <Route path="/payment-history" element={<PaymentHistory />} />
        <Route path="/credit" element={<Credit />} />
        <Route path="/debit" element={<Debit />} />
        <Route path="/payment" element={<SalePaymentHistory />} />
        <Route element={<PermissionRoute module="SalesReport" />}>
          <Route path="/sales-report" element={<SalesReport />} />
        </Route>
        <Route element={<PermissionRoute module="PurchaseReport" />}>
          <Route path="/purchase-report" element={<PurchaseReport />} />
        </Route>
        <Route element={<PermissionRoute module="InventoryReport" />}>
          <Route path="/inventory-report" element={<InventoryReport />} />
        </Route>
        <Route element={<PermissionRoute module="SupplierReport" />}>
          <Route path="/supplier-report" element={<SupplierReport />} />
        </Route>
        <Route element={<PermissionRoute module="DamageReport" />}>
          <Route path="/damage-report" element={<DamageReport />} />
        </Route>
        {/* <Route element={<PermissionRoute module="DamageReport" />}> */}
        <Route path="/damage-return-report" element={<DamageReturnReport />} />
        {/* </Route> */}
        <Route element={<PermissionRoute module="CreditDebitNoteReport" />}>
          <Route path="/credit&debit-note" element={<CreditDebitNotes />} />
        </Route>
        <Route element={<PermissionRoute module="OverdueReport" />}>
          <Route path="/overdue-report" element={<OverdueReport />} />
        </Route>
        <Route element={<PermissionRoute module="ExpenseReport" />}>
          <Route path="/expense-report" element={<ExpenseReport />} />
        </Route>

        {/* Settings */}
        <Route element={<PermissionRoute module="Settings" />}>
          <Route path="/settings" element={<SettingsLayouts />} >
            <Route path="user-profile-settings" element={<UserProfile />} />
            <Route element={<PermissionRoute module="CompanySettings" />}>
              <Route path="company-settings" element={<SettingsCompanyDetails />} />
            </Route>
            <Route element={<PermissionRoute module="BankDetails" />}>
              <Route path="company-bank" element={<SettingCompanyBank />} />
            </Route>
            <Route path="barcode-print" element={<BarCodePrint />} />
            <Route path="normal-print" element={<NormalPrint />} />
            <Route path="normalprint-invoice" element={<NormalPrintInvoice />} />
            <Route path="thermalprint-invoice" element={<ThermalPrintInvoice />} />
            <Route path="thermal-print" element={<ThermalPrint />} />
            <Route path="notes-term-condition" element={<NotesTermCondition />} />
            <Route path="taxes-gst" element={<Taxes_GST />} />
            <Route path="system-setting" element={<System_Setting />} />
          </Route>
        </Route>

      </Route>

      <Route path="/pos" element={
        <>
          <PosHeader />
          <Pos />
        </>
      } />

      {/* ---------- Catch-all route ---------- */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;


