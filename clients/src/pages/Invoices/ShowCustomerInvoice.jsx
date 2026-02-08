import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { IoIosArrowBack } from "react-icons/io";
import {
  RiFileDownloadLine,
  RiMessage2Fill,
  RiWhatsappFill,
} from "react-icons/ri";
import { PiNewspaperClipping } from "react-icons/pi";
import { ImPrinter } from "react-icons/im";
import { format } from "date-fns";
import { toast } from "react-toastify";
import api from "../../pages/config/axiosInstance";
import CompanyLogo from "../../assets/images/kasperlogo.png";
import TaxInvoiceLogo from "../../assets/images/taxinvoice.png";
import Qrcode from "../../assets/images/qrcode.png";
import numberToWords from "number-to-words";
function ShowCustomerInvoice() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [companyData, setCompanyData] = useState(null);
  const [banks, setBanks] = useState([]);
  const [terms, setTerms] = useState(null);
  const [template, setTemplate] = useState(null);
  const invoiceRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // state for template setting
  const [normalTemplate, setNormalTemplate] = useState(null);
  const [printSettings, setPrintSettings] = useState({
    showHSN: true,
    showRate: true,
    showTax: true,
    showTotalsInWords: true,
    showBankDetails: true,
    showTermsConditions: true,
    signatureUrl: "",
  });

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await api.get(`/api/invoices/${invoiceId}`);
        const data = res.data;
        // console.log("ffdara", data);
        setInvoiceData(res.data.invoice);
      } catch (err) {
        toast.error("Failed to load invoice");
        navigate("/customers");
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [invoiceId, navigate]);

  const fetchCompanyData = async () => {
    try {
      const res = await api.get(`/api/companyprofile/get`);
      // console.log("Companyss data:", res.data);
      setCompanyData(res.data.data);
    } catch (error) {
      console.error("Error fetching company profile:", error);
    }
  };

  const fetchBanks = async () => {
    try {
      const res = await api.get("/api/company-bank/list");
      setBanks(res.data.data);
      // console.log("banks", res.data.data);
    } catch (error) {
      console.error("Error fetching bank details:", error);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get("/api/notes-terms-settings");
      setTerms(res.data.data);
      // console.log("reddd", res.data);
    } catch (error) {
      console.error("Error fetching notes & terms settings:", error);
    }
  };

  const fetchSignature = async () => {
    try {
      // Fetch normal print template specifically
      const res = await api.get("/api/print-templates?type=normal");
      if (res.data.success && res.data.data.template) {
        setTemplate(res.data.data.template);
        // console.log("Template settings loaded:", res.data.data.template);
      }
    } catch (error) {
      console.error("Error fetching template settings:", error);
    }
  };

  // fetch print template setting
  const fetchPrintTemplate = async () => {
    try {
      const res = await api.get("/api/print-templates?type=normal");
      if (res.data.success && res.data.data.template) {
        const template = res.data.data.template;
        setNormalTemplate(template);
        // Apply the field visiblity settings
        if (template.fieldVisibility) {
          setPrintSettings({
            showHSN: template.fieldVisibility.showHSN !== false,
            showRate: template.fieldVisibility.showRate !== false,
            showTax: template.fieldVisibility.showTax !== false,
            showTotalsInWords:
              template.fieldVisibility.showTotalsInWords !== false,
            showBankDetails: template.fieldVisibility.showBankDetails !== false,
            showTermsConditions:
              template.fieldVisibility.showTermsConditions !== false,
            signatureUrl: template.signatureUrl || "",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching print template", error);
    }
  };

  useEffect(() => {
    fetchCompanyData();
    fetchSettings();
    fetchSignature();
    fetchBanks();
    fetchPrintTemplate();
  }, []);

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    setIsDownloading(true);

    const { jsPDF } = await import("jspdf");
    const html2canvas = await import("html2canvas");

    const element = invoiceRef.current;

    const canvas = await html2canvas.default(element, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      windowWidth: element.scrollWidth,
      width: 595, // Explicit width
      height: 842,
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = 210;
    const pdfHeight = 297;

    pdf.addImage(
      imgData,
      "PNG",
      0,
      0,
      pdfWidth, // FULL WIDTH
      pdfHeight, // FULL HEIGHT
    );

    pdf.save(`invoice-${invoiceData?.invoiceNo || "invoice"}.pdf`);
    setIsDownloading(false);
  };

  if (loading) return <div>Loading invoice...</div>;
  if (!invoiceData) return <div>Invoice not found</div>;

  const customer = invoiceData.customerId || {};
  const products = invoiceData.items || [];
  const totalInWords =
    invoiceData.grandTotal != null
      ? `${numberToWords.toWords(invoiceData.grandTotal).toUpperCase()} RUPEES ONLY`
      : "";
  return (
    <div className="px-4 py-4" style={{ height: "100vh" }}>
      <div className="">
        <div
          style={{
            height: "calc(100vh - 70px)",
            overflow: "auto",
          }}
        >
          <div
            style={{
              width: "100%",
              padding: "16px",
              display: "flex",
              gap: 24,
              alignItems: "stretch", // 🔑 forces equal height
              minHeight: "100%",
              justifyContent: "center",
            }}
          >
            <Link to="/invoice" style={{ textDecoration: "none" }}>
              <span
                style={{
                  cursor: "pointer",
                  position: "fixed",
                  left: "calc(100vw - 700px - 520px)", // Position just left of panel
                  top: "120px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid #EAEAEA",
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  backgroundColor: "#fff",
                  zIndex: 10000, // Higher than panel's z-index
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              >
                <IoIosArrowBack
                  style={{ color: "#6C748C", fontSize: "18px" }}
                />
              </span>
            </Link>

            {/* Left Side */}
            <div
              ref={invoiceRef}
              style={{
                width: "595px",
                minWidth: "595px",
                maxWidth: "595px",
                height: "842px", // A4 height at 72 DPI
                minHeight: "842px",
                paddingTop: 10.37,
                paddingBottom: 20.37,
                paddingLeft: 30.37,
                paddingRight: 30.37,
                position: "relative",
                background: "#ffff",
                // boxShadow: '-0.7576505541801453px -0.7576505541801453px 0.6818854808807373px rgba(0, 0, 0, 0.10) inset',
                borderRadius: 12.12,
                // outline: '0.76px var(--White-Stroke, #EAEAEA) solid',
                outlineOffset: "-0.76px",
                flexDirection: "column",
                justifyContent: "flex-start",
                alignItems: "flex-start",
                gap: 18.18,
                display: "inline-flex",
              }}
            >
              <span
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  padding: 0,
                  margin: 0,
                  color: "#474951",
                  visibility: isDownloading ? "hidden" : "visible",
                }}
              >
                Invoice
              </span>
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  position: "relative",
                }}
              >
                {/* tt */}
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    // paddingTop: 20,
                    position: "relative",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    alignItems: "flex-start",
                    gap: 18.18,
                    display: "inline-flex",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      position: "relative",
                      fontFamily: "IBM Plex Mono",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        left: 0,
                        top: 0,
                        background: "var(--White-White-1, white)",
                        boxShadow: "0px 1px 4px rgba(0, 0, 0, 0.10)",
                        padding: "10px 30px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div style={{ width: "100px" }}>
                          <img
                            src={companyData?.companyLogo || CompanyLogo}
                            alt="company logo"
                            style={{ width: "100%", objectFit: "contain" }}
                          />
                        </div>
                        <div style={{ width: "130px" }}>
                          <img
                            src={TaxInvoiceLogo}
                            alt="tax invoice"
                            style={{ width: "100%", objectFit: "contain" }}
                          />
                        </div>
                      </div>
                      <div
                        style={{
                          width: "100%",
                          height: 0.76,
                          left: 31.77,
                          background: "var(--White-Stroke, #EAEAEA)",
                          marginTop: "8px",
                        }}
                      />
                      <div
                        style={{
                          width: "100%",
                          display: "flex",
                          justifyContent: "space-between",
                          marginTop: "2px",
                        }}
                      >
                        <span>
                          INVOICE Date -{" "}
                          {invoiceData.invoiceDate
                            ? format(
                              new Date(invoiceData.invoiceDate),
                              "dd MMM yyyy",
                            )
                            : "N/A"}
                        </span>
                        <span style={{ marginRight: "12px" }}>
                          INVOICE No. - {invoiceData.invoiceNo}
                        </span>
                      </div>
                      <div
                        style={{
                          width: "100%",
                          height: 0.76,
                          left: 31.77,
                          marginTop: "1px",
                          background: "var(--White-Stroke, #EAEAEA)",
                        }}
                      />
                      <div
                        style={{
                          width: "100%",
                          display: "flex",
                          justifyContent: "space-around",
                          marginTop: "2px",
                          alignItems: "center",
                          borderBottom: "1px solid #EAEAEA",
                        }}
                      >
                        <div
                          style={{
                            borderRight: "1px solid #EAEAEA",
                            width: "50%",
                            textAlign: "center",
                          }}
                        >
                          <span>From</span>
                        </div>
                        <div style={{ width: "50%", textAlign: "center" }}>
                          <span>Customer Details</span>
                        </div>
                      </div>
                      <div
                        style={{
                          width: "100%",
                          display: "flex",
                          justifyContent: "space-around",
                          marginTop: "2px",
                          alignItems: "center",
                          borderBottom: "1px solid #EAEAEA",
                        }}
                      >
                        <div
                          style={{
                            borderRight: "1px solid #EAEAEA",
                            width: "50%",
                            padding: "3px",
                          }}
                        >
                          <div>
                            Name :{" "}
                            <span style={{ color: "black", fontWeight: "600" }}>
                              {companyData?.companyName || "N/A"}
                            </span>
                          </div>
                          <div>
                            <b>Address:</b>
                            {companyData?.companyaddress || "N/A"}
                          </div>
                          <div>
                            <b>Phone:</b> {companyData?.companyphone || "N/A"}
                          </div>
                          <div>
                            <b>Email:</b> {companyData?.companyemail || "N/A"}
                          </div>
                          <div>
                            <b>GSTIN:</b> {companyData?.gstin || "N/A"}
                          </div>
                        </div>
                        <div style={{ width: "50%", padding: "3px" }}>
                          <div>
                            Name :{" "}
                            <span style={{ color: "black", fontWeight: "600" }}>
                              {customer.name || "N/A"}
                            </span>
                          </div>
                          <div>
                            Address :{" "}
                            <span style={{ color: "black", fontWeight: "600" }}>
                              {customer.address || "N/A"}
                            </span>
                          </div>
                          <div style={{ marginTop: "8px" }}>
                            Phone :{" "}
                            <span style={{ color: "black", fontWeight: "600" }}>
                              {customer.phone || "N/A"}
                            </span>
                          </div>
                          <div style={{ marginTop: "0px" }}>
                            Email :{" "}
                            <span style={{ color: "black", fontWeight: "600" }}>
                              {customer.email || "N/A"}
                            </span>
                          </div>
                          <div style={{ marginTop: "0px" }}>
                            GSTIN :{" "}
                            <span style={{ color: "black", fontWeight: "600" }}>
                              {customer.gstin || "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="table-responsive mt-3">
                        <table
                          className=""
                          style={{
                            width: "100%",
                            border: "1px solid #EAEAEA",
                            borderCollapse: "collapse",
                          }}
                        >
                          <thead style={{ textAlign: "center" }}>
                            <tr>
                              <th
                                style={{
                                  borderRight: "1px solid #EAEAEA",
                                  borderBottom: "1px solid #EAEAEA",
                                  fontWeight: "400",
                                }}
                                rowSpan="2"
                              >
                                Sr No.
                              </th>
                              <th
                                style={{
                                  borderRight: "1px solid #EAEAEA",
                                  borderBottom: "1px solid #EAEAEA",
                                  fontWeight: "400",
                                }}
                                rowSpan="2"
                              >
                                Name of the Products
                              </th>
                              {printSettings.showHSN && (
                                <th
                                  style={{
                                    borderRight: "1px solid #EAEAEA",
                                    borderBottom: "1px solid #EAEAEA",
                                    fontWeight: "400",
                                  }}
                                  rowSpan="2"
                                >
                                  HSN
                                </th>
                              )}
                              <th
                                style={{
                                  borderRight: "1px solid #EAEAEA",
                                  borderBottom: "1px solid #EAEAEA",
                                  fontWeight: "400",
                                }}
                                rowSpan="3"
                              >
                                Lot No.
                              </th>
                              <th
                                style={{
                                  borderRight: "1px solid #EAEAEA",
                                  borderBottom: "1px solid #EAEAEA",
                                  fontWeight: "400",
                                }}
                                rowSpan="2"
                              >
                                QTY
                              </th>
                              {printSettings.showRate && (
                                <th
                                  style={{
                                    borderRight: "1px solid #EAEAEA",
                                    borderBottom: "1px solid #EAEAEA",
                                    fontWeight: "400",
                                  }}
                                  rowSpan="2"
                                >
                                  Rate
                                </th>
                              )}
                              {printSettings.showTax && (
                                <th
                                  style={{
                                    borderRight: "1px solid #EAEAEA",
                                    borderBottom: "1px solid #EAEAEA",
                                    fontWeight: "400",
                                  }}
                                  colSpan="2"
                                >
                                  Tax
                                </th>
                              )}
                              <th
                                style={{
                                  borderRight: "1px solid #EAEAEA",
                                  borderBottom: "1px solid #EAEAEA",
                                  fontWeight: "400",
                                }}
                                rowSpan="2"
                              >
                                Total
                              </th>
                            </tr>
                            {printSettings.showTax && (
                              <tr>
                                <th
                                  style={{
                                    borderRight: "1px solid #EAEAEA",
                                    borderBottom: "1px solid #EAEAEA",
                                    width: "40px",
                                    fontWeight: "400",
                                  }}
                                >
                                  %
                                </th>
                                <th
                                  style={{
                                    borderRight: "1px solid #EAEAEA",
                                    borderBottom: "1px solid #EAEAEA",
                                    width: "40px",
                                    fontWeight: "400",
                                  }}
                                >
                                  ₹
                                </th>
                              </tr>
                            )}
                          </thead>
                          <tbody>
                            {products.map((item, i) => (
                              <>
                                <tr key={i}>
                                  <td
                                    style={{
                                      borderRight: "1px solid #EAEAEA",
                                      height: "40px",
                                      textAlign: "center",
                                    }}
                                  >
                                    {i + 1}
                                  </td>
                                  <td
                                    style={{
                                      borderRight: "1px solid #EAEAEA",
                                      padding: "8px 20px",
                                      verticalAlign: "top",
                                    }}
                                  >
                                    <div style={{ fontWeight: "500", marginBottom: "4px" }}>
                                      {item.itemName}
                                    </div>
                                    {/* Serial Numbers Below Product Name */}
                                    {item.selectedSerialNos && item.selectedSerialNos.length > 0 && (
                                      <div
                                        style={{
                                          fontSize: "11px",
                                          color: "#666",
                                          fontStyle: "italic",
                                          marginTop: "4px",
                                          lineHeight: "1.3",
                                        }}
                                      >
                                        <div style={{ fontWeight: "400", marginBottom: "2px" }}>
                                          {item.selectedSerialNos.join(", ")}
                                        </div>
                                      </div>
                                    )}
                                  </td>
                                  {printSettings.showHSN && (
                                    <td
                                      style={{
                                        borderRight: "1px solid #EAEAEA",
                                        textAlign: "center",
                                      }}
                                    >
                                      {item.hsnCode || "-"}
                                    </td>
                                  )}
                                  {/* Lot Number Before QTY */}
                                  <td
                                    style={{
                                      borderRight: "1px solid #EAEAEA",
                                      textAlign: "center",
                                      verticalAlign: "top",
                                      paddingTop: "8px",
                                    }}
                                  >
                                    {item.lotNumber || "-"}
                                  </td>
                                  <td
                                    style={{
                                      borderRight: "1px solid #EAEAEA",
                                      textAlign: "center",
                                    }}
                                  >
                                    {item.qty}
                                  </td>

                                  {printSettings.showRate && (
                                    <td
                                      style={{
                                        borderRight: "1px solid #EAEAEA",
                                        textAlign: "center",
                                      }}
                                    >
                                      {item.unitPrice}
                                    </td>
                                  )}
                                  {printSettings.showTax && (
                                    <td
                                      style={{
                                        borderRight: "1px solid #EAEAEA",
                                        textAlign: "center",
                                      }}
                                    >
                                      {item.taxRate.toFixed(2)} %
                                    </td>
                                  )}
                                  <td
                                    style={{
                                      borderRight: "1px solid #EAEAEA",
                                      textAlign: "center",
                                    }}
                                  >
                                    ₹{item.taxAmount.toFixed(2)}
                                  </td>
                                  <td
                                    style={{
                                      borderRight: "1px solid #EAEAEA",
                                      textAlign: "center",
                                    }}
                                  >
                                    ₹{item.amount.toFixed(2)}
                                  </td>
                                </tr>

                                <tr>
                                  <td
                                    style={{
                                      borderRight: "1px solid #EAEAEA",
                                      height: "20px",
                                      textAlign: "center",
                                    }}
                                  ></td>
                                  <td
                                    style={{
                                      borderRight: "1px solid #EAEAEA",
                                      padding: "0px 20px",
                                    }}
                                  ></td>
                                  <td
                                    style={{
                                      borderRight: "1px solid #EAEAEA",
                                      textAlign: "center",
                                    }}
                                  ></td>
                                  <td
                                    style={{
                                      borderRight: "1px solid #EAEAEA",
                                      textAlign: "center",
                                    }}
                                  ></td>
                                  <td
                                    style={{
                                      borderRight: "1px solid #EAEAEA",
                                      textAlign: "center",
                                    }}
                                  ></td>
                                  <td
                                    style={{
                                      borderRight: "1px solid #EAEAEA",
                                      textAlign: "center",
                                    }}
                                  ></td>
                                  <td
                                    style={{
                                      borderRight: "1px solid #EAEAEA",
                                      textAlign: "center",
                                    }}
                                  ></td>
                                  <td
                                    style={{
                                      borderRight: "1px solid #EAEAEA",
                                      textAlign: "center",
                                    }}
                                  ></td>
                                </tr>
                              </>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div
                        style={{
                          width: "100%",
                          display: "flex",
                          justifyContent: "space-around",
                          marginTop: "15px",
                          borderTop: "1px solid #EAEAEA",
                          borderBottom: "1px solid #EAEAEA",
                        }}
                      >
                        <div
                          style={{
                            borderRight: "",
                            width: "50%",
                            padding: "3px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                          }}
                        >
                          {printSettings.showTotalsInWords && (
                            <>
                              <u>Total in words</u>
                              <div
                                style={{
                                  fontSize: "12px",
                                  marginTop: "5px",
                                  fontWeight: "600",
                                }}
                              >
                                {totalInWords}
                              </div>
                            </>
                          )}
                          {printSettings.showBankDetails && (
                            <>
                              <div
                                style={{
                                  width: "100%",
                                  height: 0.76,
                                  left: 31.77,
                                  background: "var(--White-Stroke, #EAEAEA)",
                                  marginTop: "10px",
                                }}
                              />
                              <div
                                style={{
                                  marginTop: "2px",
                                  textDecoration: "underline",
                                }}
                              >
                                Bank Details
                              </div>
                              <div
                                style={{
                                  width: "100%",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  padding: "0px 5px",
                                }}
                              >
                                <div style={{ textAlign: "left" }}>
                                  <div>
                                    Bank :{" "}
                                    <span
                                      style={{
                                        color: "black",
                                        fontWeight: "600",
                                      }}
                                    >
                                      {banks.length > 0
                                        ? banks[0]?.bankName
                                        : "N/A"}
                                    </span>
                                  </div>
                                  <div>
                                    Branch :{" "}
                                    <span
                                      style={{
                                        color: "black",
                                        fontWeight: "600",
                                      }}
                                    >
                                      {banks.length > 0
                                        ? banks[0]?.branch
                                        : "N/A"}
                                    </span>
                                  </div>
                                  <div>
                                    Account Holder :{" "}
                                    <span
                                      style={{
                                        color: "black",
                                        fontWeight: "600",
                                      }}
                                    >
                                      {banks.length > 0
                                        ? banks[0]?.accountHolderName
                                        : "N/A"}
                                    </span>
                                  </div>
                                  <div>
                                    Account No.:{" "}
                                    <span
                                      style={{
                                        color: "black",
                                        fontWeight: "600",
                                      }}
                                    >
                                      {banks.length > 0
                                        ? banks[0]?.accountNumber
                                        : "N/A"}
                                    </span>
                                  </div>
                                  <div>
                                    IFSC :{" "}
                                    <span
                                      style={{
                                        color: "black",
                                        fontWeight: "600",
                                      }}
                                    >
                                      {banks.length > 0
                                        ? banks[0]?.ifsc
                                        : "N/A"}
                                    </span>
                                  </div>
                                  <div>
                                    UPI :{" "}
                                    <span
                                      style={{
                                        color: "black",
                                        fontWeight: "600",
                                      }}
                                    >
                                      {banks.length > 0
                                        ? banks[0]?.upiId
                                        : "N/A"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>

                        <div
                          style={{
                            width: "50%",
                            padding: "3px",
                            borderLeft: "1px solid #EAEAEA",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              borderBottom: "1px solid #EAEAEA",
                              padding: "2px 8px",
                            }}
                          >
                            <span>Sub-total</span>
                            <span style={{ color: "black" }}>
                              ₹{invoiceData.subtotal?.toFixed(2)}
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              borderBottom: "1px solid #EAEAEA",
                              padding: "2px 8px",
                            }}
                          >
                            <span>Tax Amount</span>
                            <span style={{ color: "black" }}>
                              ₹{invoiceData.totalTax?.toFixed(2)}
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              borderBottom: "1px solid #EAEAEA",
                              padding: "2px 8px",
                            }}
                          >
                            <span>Discount</span>
                            <span style={{ color: "black" }}>
                              ₹{invoiceData.totalDiscount?.toFixed(2)}
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              borderBottom: "1px solid #EAEAEA",
                              padding: "2px 8px",
                            }}
                          >
                            <span>🪙 Shopping Points</span>
                            <span style={{ color: "black" }}>
                              ₹{invoiceData.shoppingPointsUsed || 0}
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              borderBottom: "1px solid #EAEAEA",
                              padding: "2px 8px",
                            }}
                          >
                            <span>Additional Charges</span>
                            <span style={{ color: "black" }}>
                              ₹{invoiceData.additionalCharges?.toFixed(2)}
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              borderBottom: "1px solid #EAEAEA",
                              padding: "2px 8px",
                            }}
                          >
                            <span
                              style={{ fontWeight: "700", fontSize: "20px" }}
                            >
                              Total
                            </span>
                            <span
                              style={{
                                color: "black",
                                fontWeight: "600",
                                fontSize: "20px",
                              }}
                            >
                              ₹{invoiceData.grandTotal?.toFixed(2)}
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              padding: "1px 8px",
                            }}
                          >
                            <span>Due Amount</span>
                            <span style={{ color: "black" }}>
                              ₹{invoiceData.dueAmount?.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          width: "100%",
                          display: "flex",
                          justifyContent: "space-around",
                          borderBottom: "1px solid #EAEAEA",
                        }}
                      >
                        {printSettings.showTermsConditions && (
                          <div
                            style={{
                              borderRight: "",
                              width: "50%",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                            }}
                          >
                            <u>Term & Conditions</u>
                            {terms?.termsText}
                          </div>
                        )}
                        <div
                          style={{
                            width: "50%",
                            borderLeft: "1px solid #EAEAEA",
                          }}
                        >
                          {/* qr start */}
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            <div
                              style={{ width: "90px", objectFit: "contain" }}
                            >
                              <img
                                src={
                                  banks.length > 0
                                    ? banks[0]?.qrCode
                                    : "https://via.placeholder.com/100"
                                }
                                alt="QR Code"
                                style={{ width: "100%" }}
                              />
                            </div>
                            <div>Pay Using Upi</div>
                          </div>
                          {/* qr end */}
                          {/* <div
                            style={{
                              display: "flex",
                              justifyContent: "center",
                              borderTop: "1px solid #EAEAEA",
                              padding: "1px 8px",
                              // marginTop: "60px",
                            }}
                          >
                            <span
                              style={{ fontWeight: "500", fontSize: "10px", paddingTop: "30px" }}
                            >
                              Signature
                            </span>
                          </div> */}
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "center",
                              borderTop: "1px solid #EAEAEA",
                              padding: "1px 8px",
                            }}
                          >
                            {printSettings.signatureUrl ? (
                              <div
                                style={{
                                  textAlign: "center",
                                  paddingTop: "30px",
                                }}
                              >
                                <img
                                  src={printSettings.signatureUrl}
                                  alt="Signature"
                                  style={{
                                    maxWidth: "150px",
                                    maxHeight: "60px",
                                    objectFit: "contain",
                                    marginBottom: "5px",
                                  }}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.style.display = "none";
                                    // Fallback to text if image fails to load
                                    e.target.parentElement.innerHTML += `
              <div style="border-top: 1px solid #000; width: 150px; padding-top: 5px">
                <div style="font-weight: 500; font-size: 10px">Signature</div>
              </div>
            `;
                                  }}
                                />
                                <div
                                  style={{
                                    fontWeight: "500",
                                    fontSize: "10px",
                                  }}
                                >
                                  Signature
                                </div>
                              </div>
                            ) : (
                              <div
                                style={{
                                  borderTop: "1px solid #000",
                                  width: "150px",
                                  paddingTop: "35px",
                                  textAlign: "center",
                                }}
                              >
                                <div
                                  style={{
                                    fontWeight: "500",
                                    fontSize: "10px",
                                  }}
                                >
                                  Signature
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          width: "100%",
                          justifyContent: "center",
                          display: "flex",
                        }}
                      >
                        <span style={{ marginTop: "5px" }}>
                          Earned 🪙 Shopping Point on this purchase. Redeem on
                          your next purchase.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* ttend */}
              </div>
            </div>

            {/* Right side */}
            <div
              style={{
                width: "100%",
                height: "auto",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                  alignItems: "flex-start",
                  gap: 24,
                  display: "inline-flex",
                }}
              >
                {/* prind & send */}
                <div
                  style={{
                    alignSelf: "stretch",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 24,
                    display: "flex",
                    width: "100%",
                  }}
                >
                  {/* print */}
                  <div
                    style={{
                      flex: "1 1 0",
                      padding: 16,
                      background: "var(--White-Universal-White, white)",
                      boxShadow:
                        "-0.9059333801269531px -0.9059333801269531px 0.8153400421142578px rgba(0, 0, 0, 0.10) inset",
                      borderRadius: 14.49,
                      outline: "0.91px var(--White-Stroke, #EAEAEA) solid",
                      outlineOffset: "-0.91px",
                      flexDirection: "column",
                      justifyContent: "flex-start",
                      alignItems: "flex-start",
                      gap: 16,
                      display: "inline-flex",
                      width: "50%",
                    }}
                  >
                    <div
                      style={{
                        alignSelf: "stretch",
                        flexDirection: "column",
                        justifyContent: "flex-start",
                        alignItems: "flex-start",
                        gap: 8,
                        display: "flex",
                      }}
                    >
                      <div
                        style={{
                          alignSelf: "stretch",
                          color: "var(--Black-Black, #0E101A)",
                          fontSize: 16,
                          fontFamily: "Inter",
                          fontWeight: "500",
                          wordWrap: "break-word",
                        }}
                      >
                        Print
                      </div>
                      <div
                        style={{
                          alignSelf: "stretch",
                          height: 0.91,
                          background: "var(--White-Stroke, #EAEAEA)",
                        }}
                      />
                    </div>
                    <div
                      style={{
                        alignSelf: "stretch",
                        justifyContent: "flex-start",
                        alignItems: "center",
                        gap: 24,
                        display: "inline-flex",
                        flexWrap: "wrap",
                        alignContent: "center",
                      }}
                    >
                      <div
                        data-property-1="Pdf"
                        data-selected="False"
                        style={{
                          height: 42,
                          paddingLeft: 16,
                          paddingRight: 16,
                          background: "var(--White-Universal-White, white)",
                          borderRadius: 8,
                          outline: "1px var(--White-Stroke, #EAEAEA) solid",
                          outlineOffset: "-1px",
                          justifyContent: "center",
                          alignItems: "center",
                          gap: 8,
                          display: "flex",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          data-property-1="Download"
                          style={{
                            width: 20,
                            height: 20,
                            position: "relative",
                            overflow: "hidden",
                            color: "#1F7FFF",
                            fontSize: "20px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <RiFileDownloadLine />
                        </div>
                        <div
                          style={{
                            width: 114,
                            height: 19,
                            color: "black",
                            fontSize: 14,
                            fontFamily: "Inter",
                            fontWeight: "400",
                            wordWrap: "break-word",
                          }}
                          onClick={handleDownloadPDF}
                        >
                          {isDownloading ? "Download.. PDF" : "Download PDF"}
                        </div>
                      </div>
                      <div
                        data-property-1="Thermal print"
                        data-selected="False"
                        style={{
                          height: 42,
                          paddingLeft: 16,
                          paddingRight: 16,
                          background: "var(--White-Universal-White, white)",
                          borderRadius: 8,
                          outline: "1px var(--White-Stroke, #EAEAEA) solid",
                          outlineOffset: "-1px",
                          justifyContent: "center",
                          alignItems: "center",
                          gap: 8,
                          display: "flex",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          data-property-1="Download"
                          style={{
                            width: 20,
                            height: 20,
                            position: "relative",
                            overflow: "hidden",
                            color: "#1F7FFF",
                            fontSize: "20px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <PiNewspaperClipping />
                        </div>
                        <div
                          style={{
                            width: 114,
                            height: 19,
                            color: "black",
                            fontSize: 14,
                            fontFamily: "Inter",
                            fontWeight: "400",
                            wordWrap: "break-word",
                          }}
                        >
                          Thermal Print
                        </div>
                      </div>
                      <div
                        data-property-1="Normsal priont"
                        data-selected="False"
                        style={{
                          height: 42,
                          paddingLeft: 16,
                          paddingRight: 16,
                          background: "var(--White-Universal-White, white)",
                          borderRadius: 8,
                          outline: "1px var(--White-Stroke, #EAEAEA) solid",
                          outlineOffset: "-1px",
                          justifyContent: "center",
                          alignItems: "center",
                          gap: 8,
                          display: "flex",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          data-property-1="Download"
                          style={{
                            width: 20,
                            height: 20,
                            position: "relative",
                            overflow: "hidden",
                            color: "#1F7FFF",
                            fontSize: "20px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <ImPrinter />
                        </div>
                        <div
                          style={{
                            width: 114,
                            height: 19,
                            color: "black",
                            fontSize: 14,
                            fontFamily: "Inter",
                            fontWeight: "400",
                            wordWrap: "break-word",
                          }}
                        >
                          Normal Print
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* send */}
                  <div
                    style={{
                      flex: "1 1 0",
                      padding: 16,
                      background: "var(--White-Universal-White, white)",
                      boxShadow:
                        "-0.9059333801269531px -0.9059333801269531px 0.8153400421142578px rgba(0, 0, 0, 0.10) inset",
                      borderRadius: 14.49,
                      outline: "0.91px var(--White-Stroke, #EAEAEA) solid",
                      outlineOffset: "-0.91px",
                      flexDirection: "column",
                      justifyContent: "flex-start",
                      alignItems: "flex-start",
                      gap: 16,
                      display: "inline-flex",
                      width: "50%",
                    }}
                  >
                    <div
                      style={{
                        alignSelf: "stretch",
                        flexDirection: "column",
                        justifyContent: "flex-start",
                        alignItems: "flex-start",
                        gap: 8,
                        display: "flex",
                      }}
                    >
                      <div
                        style={{
                          alignSelf: "stretch",
                          color: "var(--Black-Black, #0E101A)",
                          fontSize: 16,
                          fontFamily: "Inter",
                          fontWeight: "500",
                          wordWrap: "break-word",
                        }}
                      >
                        Send
                      </div>
                      <div
                        style={{
                          alignSelf: "stretch",
                          height: 0.91,
                          background: "var(--White-Stroke, #EAEAEA)",
                        }}
                      />
                    </div>
                    <div
                      style={{
                        alignSelf: "stretch",
                        justifyContent: "flex-start",
                        alignItems: "center",
                        gap: 24,
                        display: "inline-flex",
                        flexWrap: "wrap",
                        alignContent: "center",
                      }}
                    >
                      <div
                        data-property-1="Message"
                        data-selected="False"
                        style={{
                          height: 42,
                          paddingLeft: 16,
                          paddingRight: 16,
                          background: "var(--White-Universal-White, white)",
                          borderRadius: 8,
                          outline: "1px var(--White-Stroke, #EAEAEA) solid",
                          outlineOffset: "-1px",
                          justifyContent: "center",
                          alignItems: "center",
                          gap: 8,
                          display: "flex",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          data-property-1="Download"
                          style={{
                            width: 20,
                            height: 20,
                            position: "relative",
                            overflow: "hidden",
                            color: "#1F7FFF",
                            fontSize: "20px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <RiMessage2Fill />
                        </div>
                        <div
                          style={{
                            width: 114,
                            height: 19,
                            color: "black",
                            fontSize: 14,
                            fontFamily: "Inter",
                            fontWeight: "400",
                            wordWrap: "break-word",
                          }}
                        >
                          Message
                        </div>
                      </div>
                      <div
                        data-property-1="Whatsapp"
                        data-selected="False"
                        style={{
                          height: 42,
                          paddingLeft: 16,
                          paddingRight: 16,
                          background: "var(--White-Universal-White, white)",
                          borderRadius: 8,
                          outline: "1px var(--White-Stroke, #EAEAEA) solid",
                          outlineOffset: "-1px",
                          justifyContent: "center",
                          alignItems: "center",
                          gap: 8,
                          display: "flex",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          data-property-1="Download"
                          style={{
                            width: 20,
                            height: 20,
                            position: "relative",
                            overflow: "hidden",
                            color: "#25D366",
                            fontSize: "20px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <RiWhatsappFill />
                        </div>
                        <div
                          style={{
                            width: 114,
                            height: 19,
                            color: "black",
                            fontSize: 14,
                            fontFamily: "Inter",
                            fontWeight: "400",
                            wordWrap: "break-word",
                          }}
                        >
                          WhatsApp
                        </div>
                      </div>
                      <div
                        data-property-1="Mail"
                        data-selected="False"
                        style={{
                          height: 42,
                          paddingLeft: 16,
                          paddingRight: 16,
                          background: "var(--White-Universal-White, white)",
                          borderRadius: 8,
                          outline: "1px var(--White-Stroke, #EAEAEA) solid",
                          outlineOffset: "-1px",
                          justifyContent: "center",
                          alignItems: "center",
                          gap: 8,
                          display: "flex",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          data-property-1="Gmail"
                          style={{
                            width: 20,
                            height: 15,
                            position: "relative",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: 4.54,
                              height: 11.08,
                              left: 0,
                              top: 3.85,
                              position: "absolute",
                              background: "#4285F4",
                            }}
                          />
                          <div
                            style={{
                              width: 4.54,
                              height: 11.08,
                              left: 15.45,
                              top: 3.85,
                              position: "absolute",
                              background: "#34A853",
                            }}
                          />
                          <div
                            style={{
                              width: 11.6,
                              height: 6,
                              left: 4.22,
                              top: 3,
                              position: "absolute",
                              background: "#EA4335",
                            }}
                          />
                          <div
                            style={{
                              width: 4,
                              height: 6,
                              left: 8,
                              top: 6,
                              position: "absolute",
                              background: "#EA4335",
                            }}
                          />
                          <div
                            style={{
                              width: 4.54,
                              height: 7.24,
                              left: 15.45,
                              top: 0,
                              position: "absolute",
                              background: "#FBBC04",
                            }}
                          />
                          <div
                            style={{
                              width: 4.54,
                              height: 7.24,
                              left: 0,
                              top: 0,
                              position: "absolute",
                              background: "#C5221F",
                            }}
                          />
                        </div>
                        <div
                          style={{
                            width: 114,
                            height: 19,
                            color: "black",
                            fontSize: 14,
                            fontFamily: "Inter",
                            fontWeight: "400",
                            wordWrap: "break-word",
                          }}
                        >
                          Mail
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* invoice format */}
                <div
                  style={{
                    width: "100%",
                    paddingTop: 24,
                    paddingBottom: 24,
                    paddingLeft: 24,
                    paddingRight: 43.48,
                    background: "var(--White-Universal-White, white)",
                    boxShadow:
                      "-0.9059333801269531px -0.9059333801269531px 0.8153400421142578px rgba(0, 0, 0, 0.10) inset",
                    borderRadius: 14.49,
                    outline: "0.91px var(--White-Stroke, #EAEAEA) solid",
                    outlineOffset: "-0.91px",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    alignItems: "flex-start",
                    gap: 16,
                    display: "flex",
                    height: "auto",
                  }}
                >
                  <div
                    style={{
                      alignSelf: "stretch",
                      flexDirection: "column",
                      justifyContent: "flex-start",
                      alignItems: "flex-start",
                      gap: 8,
                      display: "flex",
                    }}
                  >
                    <div
                      style={{
                        alignSelf: "stretch",
                        color: "var(--Black-Black, #0E101A)",
                        fontSize: 19.93,
                        fontFamily: "Poppins",
                        fontWeight: "500",
                        wordWrap: "break-word",
                      }}
                    >
                      Invoice Format
                    </div>
                    <div
                      style={{
                        alignSelf: "stretch",
                        height: 0.91,
                        background: "var(--White-Stroke, #EAEAEA)",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      justifyContent: "flex-start",
                      alignItems: "center",
                      gap: 24,
                      display: "inline-flex",
                    }}
                  >
                    <Link
                      to="/m/thermaltemplate"
                      style={{
                        paddingLeft: 16,
                        paddingRight: 16,
                        paddingTop: 8,
                        paddingBottom: 8,
                        background: "var(--White-Universal-White, white)",
                        borderRadius: 8,
                        outline: "2px var(--Blue-Blue, #1F7FFF) solid",
                        outlineOffset: "-2px",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 8,
                        display: "flex",
                        cursor: "pointer",
                        textDecoration: "none",
                      }}
                    >
                      <div
                        data-property-1="Download"
                        style={{
                          width: 20,
                          height: 20,
                          position: "relative",
                          overflow: "hidden",
                          color: "#1F7FFF",
                          fontSize: "20px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <PiNewspaperClipping />
                      </div>
                      <div
                        style={{
                          width: 114,
                          height: 19,
                          color: "black",
                          fontSize: 14,
                          fontFamily: "Inter",
                          fontWeight: "400",
                          wordWrap: "break-word",
                        }}
                      >
                        Thermal Print
                      </div>
                    </Link>
                    <div
                      style={{
                        paddingLeft: 16,
                        paddingRight: 16,
                        paddingTop: 8,
                        paddingBottom: 8,
                        background: "var(--White-Universal-White, white)",
                        borderRadius: 8,
                        outline: "1px var(--White-Stroke, #EAEAEA) solid",
                        outlineOffset: "-1px",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 8,
                        display: "flex",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        data-property-1="Download"
                        style={{
                          width: 20,
                          height: 20,
                          position: "relative",
                          overflow: "hidden",
                          color: "#1F7FFF",
                          fontSize: "20px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <ImPrinter />
                      </div>
                      <div
                        style={{
                          width: 114,
                          height: 19,
                          color: "black",
                          fontSize: 14,
                          fontFamily: "Inter",
                          fontWeight: "400",
                          wordWrap: "break-word",
                        }}
                      >
                        Normal Print
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: 410,
                      position: "relative",
                    }}
                  >
                    <Link
                      to="/m/invoicetemplate2"
                      style={{
                        width: "32%",
                        maxWidth: 280,
                        height: 409,
                        left: 0,
                        top: 1.28,
                        position: "absolute",
                        background: "var(--White-Stroke, #EAEAEA)",
                        overflow: "hidden",
                        borderRadius: 6.04,
                        outline: "2px var(--Blue-Blue, #1F7FFF) solid",
                        outlineOffset: "-1.51px",
                        cursor: "pointer",
                        color: "black",
                      }}
                    >
                      <div
                        style={{
                          width: 245,
                          height: 390,
                          left: 7,
                          top: 10,
                          position: "absolute",
                          backgroundColor: "white",
                        }}
                      >
                        <div
                          style={{
                            width: "100%",
                            justifyContent: "center",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            padding: "0px 10px",
                          }}
                        >
                          <div
                            style={{
                              marginTop: "5px",
                              fontWeight: "500",
                              fontSize: "12px",
                            }}
                          >
                            Shop Name
                          </div>
                          <div
                            style={{
                              marginTop: "0px",
                              fontWeight: "500",
                              fontSize: "10px",
                              color: "#727681",
                            }}
                          >
                            Address and contact no.
                          </div>
                          <div
                            style={{
                              marginTop: "0px",
                              fontWeight: "500",
                              fontSize: "10px",
                            }}
                          >
                            *** INVOICE ***
                          </div>
                          <div
                            style={{
                              marginTop: "0px",
                              fontWeight: "500",
                              fontSize: "10px",
                              display: "flex",
                              justifyContent: "left",
                              width: "100%",
                            }}
                          >
                            <span>Invoice No.: 1822</span>
                          </div>
                          <div
                            style={{
                              marginTop: "1px",
                              fontWeight: "500",
                              fontSize: "10px",
                              display: "flex",
                              justifyContent: "left",
                              width: "100%",
                            }}
                          >
                            <span>Payment Mode: CASH</span>
                          </div>
                          <div
                            style={{
                              width: "100%",
                              height: 0.76,
                              left: 31.77,
                              marginTop: "1px",
                              background: "var(--White-Stroke, #EAEAEA)",
                            }}
                          />
                          <div
                            style={{
                              marginTop: "1px",
                              fontWeight: "500",
                              fontSize: "10px",
                              display: "flex",
                              justifyContent: "left",
                              width: "100%",
                              flexDirection: "column",
                            }}
                          >
                            <div>Customer Name</div>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                              }}
                            >
                              <span>Alok Ranjan</span>
                              <span>9876543210</span>
                            </div>
                          </div>
                          <div
                            style={{
                              width: "100%",
                              height: 0.76,
                              left: 31.77,
                              marginTop: "1px",
                              background: "var(--White-Stroke, #EAEAEA)",
                            }}
                          />
                          <div
                            style={{
                              marginTop: "1px",
                              fontWeight: "500",
                              fontSize: "10px",
                              display: "flex",
                              justifyContent: "left",
                              width: "100%",
                              flexDirection: "column",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                              }}
                            >
                              <span>Counter - #1</span>
                              <span>03/02/2025 09:45 am</span>
                            </div>
                          </div>
                          <div
                            style={{
                              width: "100%",
                              borderTop: "1px dashed #EAEAEA", // dashed line
                              marginTop: "1px",
                            }}
                          />
                          <div style={{ fontSize: "10px", width: "100%" }}>
                            <table style={{ fontSize: "10px", width: "100%" }}>
                              <thead>
                                <tr>
                                  <th>Item</th>
                                  <th>QTY</th>
                                  <th style={{ textAlign: "right" }}>COST</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td>White T-Shirt - Nike</td>
                                  <td>01</td>
                                  <td style={{ textAlign: "right" }}>
                                    ₹1,935.2
                                  </td>
                                </tr>
                                <tr>
                                  <td>White T-Shirt - Nike</td>
                                  <td>01</td>
                                  <td style={{ textAlign: "right" }}>
                                    ₹1,935.2
                                  </td>
                                </tr>
                                <tr>
                                  <td>White T-Shirt - Nike</td>
                                  <td>01</td>
                                  <td style={{ textAlign: "right" }}>
                                    ₹1,935.2
                                  </td>
                                </tr>
                                <tr>
                                  <td>White T-Shirt - Nike</td>
                                  <td>01</td>
                                  <td style={{ textAlign: "right" }}>
                                    ₹1,935.2
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            <div
                              style={{
                                width: "100%",
                                borderTop: "1px dashed #EAEAEA", // dashed line
                                marginTop: "1px",
                              }}
                            />
                            <table style={{ fontSize: "10px", width: "100%" }}>
                              <tbody>
                                <tr>
                                  <td>Subtotal</td>
                                  <td>04</td>
                                  <td style={{ textAlign: "right" }}>
                                    ₹7,740.8
                                  </td>
                                </tr>
                                <tr>
                                  <td>Discount</td>
                                  <td></td>
                                  <td style={{ textAlign: "right" }}>
                                    - ₹1,935.2
                                  </td>
                                </tr>
                                <tr>
                                  <td>CGST @ 18%</td>
                                  <td></td>
                                  <td style={{ textAlign: "right" }}>
                                    + ₹1,935.2
                                  </td>
                                </tr>
                                <tr>
                                  <td>SGST @ 18%</td>
                                  <td></td>
                                  <td style={{ textAlign: "right" }}>
                                    + ₹1,935.2
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            <div
                              style={{
                                width: "100%",
                                borderTop: "1px dashed #EAEAEA", // dashed line
                                marginTop: "1px",
                              }}
                            />
                            <div
                              style={{
                                marginTop: "1px",
                                fontWeight: "500",
                                fontSize: "10px",
                                display: "flex",
                                justifyContent: "left",
                                width: "100%",
                                flexDirection: "column",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                }}
                              >
                                <span>🪙 Shopping Points</span>
                                <span>- ₹1,935.2</span>
                              </div>
                            </div>
                            <div
                              style={{
                                width: "100%",
                                borderTop: "1px dashed #EAEAEA", // dashed line
                                marginTop: "1px",
                              }}
                            />
                            <div
                              style={{
                                marginTop: "1px",
                                fontWeight: "500",
                                fontSize: "10px",
                                display: "flex",
                                justifyContent: "left",
                                width: "100%",
                                flexDirection: "column",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                }}
                              >
                                <span>Additional Charges</span>
                                <span>- ₹1,935.2</span>
                              </div>
                            </div>
                            <div
                              style={{
                                width: "100%",
                                borderTop: "1px dashed #EAEAEA", // dashed line
                                marginTop: "1px",
                              }}
                            />
                            <div
                              style={{
                                marginTop: "1px",
                                fontWeight: "500",
                                fontSize: "10px",
                                display: "flex",
                                justifyContent: "left",
                                width: "100%",
                                flexDirection: "column",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                }}
                              >
                                <span>Total</span>
                                <span>₹1,935.2</span>
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                }}
                              >
                                <span>Due</span>
                                <span>Nil</span>
                              </div>
                            </div>
                            <div
                              style={{
                                width: "100%",
                                display: "flex",
                                justifyContent: "center",
                                color: "var(--Black-Black, #0E101A)",
                                fontSize: 8,
                                fontFamily: "Poppins",
                                fontStyle: "italic",
                                fontWeight: "400",
                                wordWrap: "break-word",
                                marginTop: "10px",
                              }}
                            >
                              Congratulations! You’ve earned 🪙 50 shopping
                              points 🎉
                            </div>
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          padding: 3.02,
                          left: 2.26,
                          top: 3.09,
                          position: "absolute",
                          background: "rgba(255, 255, 255, 0.78)",
                          borderRadius: 3.02,
                          justifyContent: "center",
                          alignItems: "center",
                          gap: 6.04,
                          display: "inline-flex",
                        }}
                      >
                        <div
                          style={{
                            textAlign: "center",
                            color: "var(--Black-Black, #0E101A)",
                            fontSize: 10.51,
                            fontFamily: "Poppins",
                            fontStyle: "italic",
                            fontWeight: "500",
                            wordWrap: "break-word",
                          }}
                        >
                          #1 Default Template
                        </div>
                      </div>
                    </Link>
                    <Link
                      to="/m/invoicetemplate2"
                      style={{
                        width: "32%",
                        maxWidth: 280,
                        height: 409,
                        left: "34.5%",
                        top: 1.28,
                        position: "absolute",
                        background: "var(--White-Stroke, #EAEAEA)",
                        overflow: "hidden",
                        borderRadius: 6.04,
                        outline: "2px var(--Blue-Blue, #1F7FFF) solid",
                        outlineOffset: "-1.51px",
                        cursor: "pointer",
                        color: "black",
                      }}
                    >
                      <div
                        style={{
                          width: 245,
                          height: 390,
                          left: 7,
                          top: 10,
                          position: "absolute",
                          backgroundColor: "white",
                        }}
                      >
                        <div
                          style={{
                            width: "100%",
                            justifyContent: "center",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            padding: "0px 10px",
                          }}
                        >
                          <div
                            style={{
                              marginTop: "5px",
                              fontWeight: "500",
                              fontSize: "12px",
                            }}
                          >
                            Shop Name
                          </div>
                          <div
                            style={{
                              marginTop: "0px",
                              fontWeight: "500",
                              fontSize: "10px",
                              color: "#727681",
                            }}
                          >
                            Address and contact no.
                          </div>
                          <div
                            style={{
                              marginTop: "0px",
                              fontWeight: "500",
                              fontSize: "10px",
                            }}
                          >
                            *** INVOICE ***
                          </div>
                          <div
                            style={{
                              marginTop: "0px",
                              fontWeight: "500",
                              fontSize: "10px",
                              display: "flex",
                              justifyContent: "left",
                              width: "100%",
                            }}
                          >
                            <span>Invoice No.: 1822</span>
                          </div>
                          <div
                            style={{
                              marginTop: "1px",
                              fontWeight: "500",
                              fontSize: "10px",
                              display: "flex",
                              justifyContent: "left",
                              width: "100%",
                            }}
                          >
                            <span>Payment Mode: CASH</span>
                          </div>
                          <div
                            style={{
                              width: "100%",
                              height: 0.76,
                              left: 31.77,
                              marginTop: "1px",
                              background: "var(--White-Stroke, #EAEAEA)",
                            }}
                          />
                          <div
                            style={{
                              marginTop: "1px",
                              fontWeight: "500",
                              fontSize: "10px",
                              display: "flex",
                              justifyContent: "left",
                              width: "100%",
                              flexDirection: "column",
                            }}
                          >
                            <div>Customer Name</div>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                              }}
                            >
                              <span>Alok Ranjan</span>
                              <span>9876543210</span>
                            </div>
                          </div>
                          <div
                            style={{
                              width: "100%",
                              height: 0.76,
                              left: 31.77,
                              marginTop: "1px",
                              background: "var(--White-Stroke, #EAEAEA)",
                            }}
                          />
                          <div
                            style={{
                              marginTop: "1px",
                              fontWeight: "500",
                              fontSize: "10px",
                              display: "flex",
                              justifyContent: "left",
                              width: "100%",
                              flexDirection: "column",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                              }}
                            >
                              <span>Counter - #1</span>
                              <span>03/02/2025 09:45 am</span>
                            </div>
                          </div>
                          <div
                            style={{
                              width: "100%",
                              borderTop: "1px dashed #EAEAEA", // dashed line
                              marginTop: "1px",
                            }}
                          />
                          <div style={{ fontSize: "10px", width: "100%" }}>
                            <table style={{ fontSize: "10px", width: "100%" }}>
                              <thead>
                                <tr>
                                  <th>Item</th>
                                  <th>QTY</th>
                                  <th style={{ textAlign: "right" }}>COST</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td>White T-Shirt - Nike</td>
                                  <td>01</td>
                                  <td style={{ textAlign: "right" }}>
                                    ₹1,935.2
                                  </td>
                                </tr>
                                <tr>
                                  <td>White T-Shirt - Nike</td>
                                  <td>01</td>
                                  <td style={{ textAlign: "right" }}>
                                    ₹1,935.2
                                  </td>
                                </tr>
                                <tr>
                                  <td>White T-Shirt - Nike</td>
                                  <td>01</td>
                                  <td style={{ textAlign: "right" }}>
                                    ₹1,935.2
                                  </td>
                                </tr>
                                <tr>
                                  <td>White T-Shirt - Nike</td>
                                  <td>01</td>
                                  <td style={{ textAlign: "right" }}>
                                    ₹1,935.2
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            <div
                              style={{
                                width: "100%",
                                borderTop: "1px dashed #EAEAEA", // dashed line
                                marginTop: "1px",
                              }}
                            />
                            <table style={{ fontSize: "10px", width: "100%" }}>
                              <tbody>
                                <tr>
                                  <td>Subtotal</td>
                                  <td>04</td>
                                  <td style={{ textAlign: "right" }}>
                                    ₹7,740.8
                                  </td>
                                </tr>
                                <tr>
                                  <td>Discount</td>
                                  <td></td>
                                  <td style={{ textAlign: "right" }}>
                                    - ₹1,935.2
                                  </td>
                                </tr>
                                <tr>
                                  <td>CGST @ 18%</td>
                                  <td></td>
                                  <td style={{ textAlign: "right" }}>
                                    + ₹1,935.2
                                  </td>
                                </tr>
                                <tr>
                                  <td>SGST @ 18%</td>
                                  <td></td>
                                  <td style={{ textAlign: "right" }}>
                                    + ₹1,935.2
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            <div
                              style={{
                                width: "100%",
                                borderTop: "1px dashed #EAEAEA", // dashed line
                                marginTop: "1px",
                              }}
                            />
                            <div
                              style={{
                                marginTop: "1px",
                                fontWeight: "500",
                                fontSize: "10px",
                                display: "flex",
                                justifyContent: "left",
                                width: "100%",
                                flexDirection: "column",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                }}
                              >
                                <span>🪙 Shopping Points</span>
                                <span>- ₹1,935.2</span>
                              </div>
                            </div>
                            <div
                              style={{
                                width: "100%",
                                borderTop: "1px dashed #EAEAEA", // dashed line
                                marginTop: "1px",
                              }}
                            />
                            <div
                              style={{
                                marginTop: "1px",
                                fontWeight: "500",
                                fontSize: "10px",
                                display: "flex",
                                justifyContent: "left",
                                width: "100%",
                                flexDirection: "column",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                }}
                              >
                                <span>Additional Charges</span>
                                <span>- ₹1,935.2</span>
                              </div>
                            </div>
                            <div
                              style={{
                                width: "100%",
                                borderTop: "1px dashed #EAEAEA", // dashed line
                                marginTop: "1px",
                              }}
                            />
                            <div
                              style={{
                                marginTop: "1px",
                                fontWeight: "500",
                                fontSize: "10px",
                                display: "flex",
                                justifyContent: "left",
                                width: "100%",
                                flexDirection: "column",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                }}
                              >
                                <span>Total</span>
                                <span>₹1,935.2</span>
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                }}
                              >
                                <span>Due</span>
                                <span>Nil</span>
                              </div>
                            </div>
                            <div
                              style={{
                                width: "100%",
                                display: "flex",
                                justifyContent: "center",
                                color: "var(--Black-Black, #0E101A)",
                                fontSize: 8,
                                fontFamily: "Poppins",
                                fontStyle: "italic",
                                fontWeight: "400",
                                wordWrap: "break-word",
                                marginTop: "10px",
                              }}
                            >
                              Congratulations! You’ve earned 🪙 50 shopping
                              points 🎉
                            </div>
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          padding: 3.02,
                          left: 2.26,
                          top: 3.09,
                          position: "absolute",
                          background: "rgba(255, 255, 255, 0.78)",
                          borderRadius: 3.02,
                          justifyContent: "center",
                          alignItems: "center",
                          gap: 6.04,
                          display: "inline-flex",
                        }}
                      >
                        <div
                          style={{
                            textAlign: "center",
                            color: "var(--Black-Black, #0E101A)",
                            fontSize: 10.51,
                            fontFamily: "Poppins",
                            fontStyle: "italic",
                            fontWeight: "500",
                            wordWrap: "break-word",
                          }}
                        >
                          #2 Template
                        </div>
                      </div>
                    </Link>
                    <Link
                      to="/m/invoicetemplate2"
                      style={{
                        width: "32%",
                        maxWidth: 280,
                        height: 409,
                        left: "69%",
                        top: 1.28,
                        position: "absolute",
                        background: "var(--White-Stroke, #EAEAEA)",
                        overflow: "hidden",
                        borderRadius: 6.04,
                        outline: "2px var(--Blue-Blue, #1F7FFF) solid",
                        outlineOffset: "-1.51px",
                        cursor: "pointer",
                        color: "black",
                      }}
                    >
                      <div
                        style={{
                          width: 245,
                          height: 390,
                          left: 7,
                          top: 10,
                          position: "absolute",
                          backgroundColor: "white",
                        }}
                      >
                        <div
                          style={{
                            width: "100%",
                            justifyContent: "center",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            padding: "0px 10px",
                          }}
                        >
                          <div
                            style={{
                              marginTop: "5px",
                              fontWeight: "500",
                              fontSize: "12px",
                            }}
                          >
                            Shop Name
                          </div>
                          <div
                            style={{
                              marginTop: "0px",
                              fontWeight: "500",
                              fontSize: "10px",
                              color: "#727681",
                            }}
                          >
                            Address and contact no.
                          </div>
                          <div
                            style={{
                              marginTop: "0px",
                              fontWeight: "500",
                              fontSize: "10px",
                            }}
                          >
                            *** INVOICE ***
                          </div>
                          <div
                            style={{
                              marginTop: "0px",
                              fontWeight: "500",
                              fontSize: "10px",
                              display: "flex",
                              justifyContent: "left",
                              width: "100%",
                            }}
                          >
                            <span>Invoice No.: 1822</span>
                          </div>
                          <div
                            style={{
                              marginTop: "1px",
                              fontWeight: "500",
                              fontSize: "10px",
                              display: "flex",
                              justifyContent: "left",
                              width: "100%",
                            }}
                          >
                            <span>Payment Mode: CASH</span>
                          </div>
                          <div
                            style={{
                              width: "100%",
                              height: 0.76,
                              left: 31.77,
                              marginTop: "1px",
                              background: "var(--White-Stroke, #EAEAEA)",
                            }}
                          />
                          <div
                            style={{
                              marginTop: "1px",
                              fontWeight: "500",
                              fontSize: "10px",
                              display: "flex",
                              justifyContent: "left",
                              width: "100%",
                              flexDirection: "column",
                            }}
                          >
                            <div>Customer Name</div>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                              }}
                            >
                              <span>Alok Ranjan</span>
                              <span>9876543210</span>
                            </div>
                          </div>
                          <div
                            style={{
                              width: "100%",
                              height: 0.76,
                              left: 31.77,
                              marginTop: "1px",
                              background: "var(--White-Stroke, #EAEAEA)",
                            }}
                          />
                          <div
                            style={{
                              marginTop: "1px",
                              fontWeight: "500",
                              fontSize: "10px",
                              display: "flex",
                              justifyContent: "left",
                              width: "100%",
                              flexDirection: "column",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                              }}
                            >
                              <span>Counter - #1</span>
                              <span>03/02/2025 09:45 am</span>
                            </div>
                          </div>
                          <div
                            style={{
                              width: "100%",
                              borderTop: "1px dashed #EAEAEA", // dashed line
                              marginTop: "1px",
                            }}
                          />
                          <div style={{ fontSize: "10px", width: "100%" }}>
                            <table style={{ fontSize: "10px", width: "100%" }}>
                              <thead>
                                <tr>
                                  <th>Item</th>
                                  <th>QTY</th>
                                  <th style={{ textAlign: "right" }}>COST</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td>White T-Shirt - Nike</td>
                                  <td>01</td>
                                  <td style={{ textAlign: "right" }}>
                                    ₹1,935.2
                                  </td>
                                </tr>
                                <tr>
                                  <td>White T-Shirt - Nike</td>
                                  <td>01</td>
                                  <td style={{ textAlign: "right" }}>
                                    ₹1,935.2
                                  </td>
                                </tr>
                                <tr>
                                  <td>White T-Shirt - Nike</td>
                                  <td>01</td>
                                  <td style={{ textAlign: "right" }}>
                                    ₹1,935.2
                                  </td>
                                </tr>
                                <tr>
                                  <td>White T-Shirt - Nike</td>
                                  <td>01</td>
                                  <td style={{ textAlign: "right" }}>
                                    ₹1,935.2
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            <div
                              style={{
                                width: "100%",
                                borderTop: "1px dashed #EAEAEA", // dashed line
                                marginTop: "1px",
                              }}
                            />
                            <table style={{ fontSize: "10px", width: "100%" }}>
                              <tbody>
                                <tr>
                                  <td>Subtotal</td>
                                  <td>04</td>
                                  <td style={{ textAlign: "right" }}>
                                    ₹7,740.8
                                  </td>
                                </tr>
                                <tr>
                                  <td>Discount</td>
                                  <td></td>
                                  <td style={{ textAlign: "right" }}>
                                    - ₹1,935.2
                                  </td>
                                </tr>
                                <tr>
                                  <td>CGST @ 18%</td>
                                  <td></td>
                                  <td style={{ textAlign: "right" }}>
                                    + ₹1,935.2
                                  </td>
                                </tr>
                                <tr>
                                  <td>SGST @ 18%</td>
                                  <td></td>
                                  <td style={{ textAlign: "right" }}>
                                    + ₹1,935.2
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            <div
                              style={{
                                width: "100%",
                                borderTop: "1px dashed #EAEAEA", // dashed line
                                marginTop: "1px",
                              }}
                            />
                            <div
                              style={{
                                marginTop: "1px",
                                fontWeight: "500",
                                fontSize: "10px",
                                display: "flex",
                                justifyContent: "left",
                                width: "100%",
                                flexDirection: "column",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                }}
                              >
                                <span>🪙 Shopping Points</span>
                                <span>- ₹1,935.2</span>
                              </div>
                            </div>
                            <div
                              style={{
                                width: "100%",
                                borderTop: "1px dashed #EAEAEA", // dashed line
                                marginTop: "1px",
                              }}
                            />
                            <div
                              style={{
                                marginTop: "1px",
                                fontWeight: "500",
                                fontSize: "10px",
                                display: "flex",
                                justifyContent: "left",
                                width: "100%",
                                flexDirection: "column",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                }}
                              >
                                <span>Additional Charges</span>
                                <span>- ₹1,935.2</span>
                              </div>
                            </div>
                            <div
                              style={{
                                width: "100%",
                                borderTop: "1px dashed #EAEAEA", // dashed line
                                marginTop: "1px",
                              }}
                            />
                            <div
                              style={{
                                marginTop: "1px",
                                fontWeight: "500",
                                fontSize: "10px",
                                display: "flex",
                                justifyContent: "left",
                                width: "100%",
                                flexDirection: "column",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                }}
                              >
                                <span>Total</span>
                                <span>₹1,935.2</span>
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                }}
                              >
                                <span>Due</span>
                                <span>Nil</span>
                              </div>
                            </div>
                            <div
                              style={{
                                width: "100%",
                                display: "flex",
                                justifyContent: "center",
                                color: "var(--Black-Black, #0E101A)",
                                fontSize: 8,
                                fontFamily: "Poppins",
                                fontStyle: "italic",
                                fontWeight: "400",
                                wordWrap: "break-word",
                                marginTop: "10px",
                              }}
                            >
                              Congratulations! You’ve earned 🪙 50 shopping
                              points 🎉
                            </div>
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          padding: 3.02,
                          left: 2.26,
                          top: 3.09,
                          position: "absolute",
                          background: "rgba(255, 255, 255, 0.78)",
                          borderRadius: 3.02,
                          justifyContent: "center",
                          alignItems: "center",
                          gap: 6.04,
                          display: "inline-flex",
                        }}
                      >
                        <div
                          style={{
                            textAlign: "center",
                            color: "var(--Black-Black, #0E101A)",
                            fontSize: 10.51,
                            fontFamily: "Poppins",
                            fontStyle: "italic",
                            fontWeight: "500",
                            wordWrap: "break-word",
                          }}
                        >
                          #3 Template
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>

                {/* buttons */}
                <div
                  style={{
                    height: 36,
                    padding: 8,
                    background: "var(--Blue-Blue, #1F7FFF)",
                    boxShadow: "-1px -1px 4px rgba(0, 0, 0, 0.25) inset",
                    borderRadius: 8,
                    outline: "1.50px var(--Blue-Blue, #1F7FFF) solid",
                    outlineOffset: "-1.50px",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    gap: 4,
                    display: "inline-flex",
                    cursor: "pointer",
                  }}
                >
                  <Link
                    // to="/m/sales-list"
                    style={{
                      color: "white",
                      fontSize: 14,
                      fontFamily: "Inter",
                      fontWeight: "500",
                      lineHeight: 5,
                      wordWrap: "break-word",
                      textDecoration: "none",
                    }}
                  >
                    Done
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShowCustomerInvoice;
