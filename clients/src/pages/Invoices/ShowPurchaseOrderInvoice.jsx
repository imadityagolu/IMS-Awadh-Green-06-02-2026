import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { IoIosArrowBack } from "react-icons/io";
import { RiFileDownloadLine, RiMessage2Fill, RiWhatsappFill } from "react-icons/ri";
import { PiNewspaperClipping } from "react-icons/pi";
import { ImPrinter } from "react-icons/im";
import { format } from "date-fns";
import { toast } from "react-toastify";
import api from "../config/axiosInstance";
import CompanyLogo from "../../assets/images/kasperlogo.png";
import TaxInvoiceLogo from "../../assets/images/taxinvoice.png";
import Qrcode from "../../assets/images/qrcode.png";
import numberToWords from "number-to-words";

function ShowPurchaseOrderInvoice() {
    const { invoiceId } = useParams();
    const navigate = useNavigate();
    const [invoiceData, setInvoiceData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [companyData, setCompanyData] = useState(null);
    const [terms, setTerms] = useState(null);
    const [template, setTemplate] = useState(null);
    const invoiceRef = useRef(null);

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                // Change the API endpoint to fetch supplier invoice
                const res = await api.get(`/api/purchase-orders/${invoiceId}`);
                console.log("Supplier Invoice Data:", res.data);
                setInvoiceData(res.data.invoice);
            } catch (err) {
                toast.error("Failed to load supplier invoice");
                navigate("/suppliers"); // Redirect to suppliers page
            } finally {
                setLoading(false);
            }
        };
        fetchInvoice();
    }, [invoiceId, navigate]);

    const fetchCompanyData = async () => {
        try {
            const res = await api.get(`/api/companyprofile/get`);
            console.log("Companyss data:", res.data);
            setCompanyData(res.data.data);
        } catch (error) {
            console.error("Error fetching company profile:", error);
        }
    };

    const fetchSettings = async () => {
        try {
            const res = await api.get('/api/notes-terms-settings');
            setTerms(res.data.data)
            console.log('reddd', res.data)
        } catch (error) {
            console.error('Error fetching notes & terms settings:', error);
        }
    };

    const fetchSignature = async () => {
        try {
            const res = await api.get('/api/print-templates/all');
            setTemplate(res.data.data)
            console.log('ddrrr', res.data)
        } catch (error) {
            console.error('Error fetching tempate settings:', error);
        }
    }


    useEffect(() => {
        fetchCompanyData();
        fetchSettings();
        fetchSignature();
    }, []);

    if (loading) return <div>Loading supplier invoice...</div>;
    if (!invoiceData) return <div>Supplier invoice not found</div>;

    // Assuming supplier data is in invoiceData.supplierId
    const supplier = invoiceData.supplierId || {};
    console.log("sssuplier", supplier)
    const products = invoiceData.items || [];
    console.log("sssuplssier", products)
    const totalInWords =
        invoiceData.grandTotal != null
            ? `${numberToWords.toWords(invoiceData.grandTotal).toUpperCase()} RUPEES ONLY`
            : "";

    return (
        <div className="px-4 py-4">
            <div className="">
                <div
                    style={{
                        height: "calc(100vh - 70px)",
                        overflow: 'auto',
                    }}>
                    <div style={{
                        width: "100%",
                        padding: "16px",
                        display: "flex",
                        gap: 24,
                        alignItems: "stretch",
                        minHeight: "100%",
                    }}
                    >
                        {/* back button */}
                        <div style={{
                            position: 'absolute',
                            top: '120px',
                            left: '5px',
                            zIndex: '999'
                        }}>
                            <Link
                                style={{
                                    padding: '8px 10px 10px 10px',
                                    backgroundColor: 'white',
                                    borderRadius: '50%',
                                    textDecoration: 'none',
                                    color: 'gray'
                                }}
                                to='/supplier-list' // Change to suppliers route
                            >
                                <IoIosArrowBack style={{ fontSize: '18px' }} />
                            </Link>
                        </div>

                        {/* Left Side */}
                        <div
                            style={{
                                width: '100%',
                                height: '100%',
                                paddingTop: 20.37,
                                paddingBottom: 20.37,
                                paddingLeft: 30.37,
                                paddingRight: 30.37,
                                position: 'relative',
                                background: '#F3F5F6',
                                boxShadow: '-0.7576505541801453px -0.7576505541801453px 0.6818854808807373px rgba(0, 0, 0, 0.10) inset',
                                borderRadius: 12.12,
                                outline: '0.76px var(--White-Stroke, #EAEAEA) solid',
                                outlineOffset: '-0.76px',
                                flexDirection: 'column',
                                justifyContent: 'flex-start',
                                alignItems: 'flex-start',
                                gap: 18.18,
                                display: 'inline-flex'
                            }}
                        >
                            <span
                                style={{
                                    fontSize: "18px",
                                    fontWeight: "700",
                                    padding: 0,
                                    margin: 0,
                                    color: "#474951",
                                }}
                            >
                                Purchase Invoice
                            </span>
                            <div
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    position: 'relative'
                                }}
                            >
                                <div
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        paddingTop: 20,
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
                                                        src={companyData?.CompanyLogo || CompanyLogo}
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
                                                    Invoice Date - {invoiceData.invoiceDate
                                                        ? format(new Date(invoiceData.invoiceDate), "dd MMM yyyy")
                                                        : "N/A"}
                                                </span>
                                                <span style={{ marginRight: "12px" }}>
                                                    Invoice No. - {invoiceData.invoiceNo}
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
                                                    <span>Supplier Details</span>
                                                </div>
                                                <div style={{ width: "50%", textAlign: "center" }}>
                                                    <span>Company Details</span>
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
                                                            {supplier.supplierName || "N/A"}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        Address :{" "}
                                                        <span style={{ color: "black", fontWeight: "600" }}>
                                                            {supplier.address
                                                                ? (typeof supplier.address === 'string'
                                                                    ? supplier.address
                                                                    : `${supplier.address.addressLine || ''},${supplier.address.state || ''}, ${supplier.address.pincode || ''}`
                                                                )
                                                                : "N/A"}
                                                        </span>
                                                    </div>
                                                    <div style={{ marginTop: "8px" }}>
                                                        Phone :{" "}
                                                        <span style={{ color: "black", fontWeight: "600" }}>
                                                            {supplier.phone || "N/A"}
                                                        </span>
                                                    </div>
                                                    <div style={{ marginTop: "0px" }}>
                                                        Email :{" "}
                                                        <span style={{ color: "black", fontWeight: "600" }}>
                                                            {supplier.email || "N/A"}
                                                        </span>
                                                    </div>
                                                    <div style={{ marginTop: "0px" }}>
                                                        GSTIN :{" "}
                                                        <span style={{ color: "black", fontWeight: "600" }}>
                                                            {supplier.gstin || "N/A"}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div style={{ width: "50%", padding: "3px" }}>
                                                    <div>
                                                        Name :{" "}
                                                        <span style={{ color: "black", fontWeight: "600" }}>
                                                            {companyData?.companyName || "N/A"}
                                                        </span>
                                                    </div>
                                                    <div><b>Address:</b> {companyData?.companyaddress || "N/A"}</div>
                                                    <div><b>Phone:</b> {companyData?.companyphone || "N/A"}</div>
                                                    <div><b>Email:</b> {companyData?.companyemail || "N/A"}</div>
                                                    <div><b>GSTIN:</b> {companyData?.gstin || "N/A"}</div>
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
                                                                Product Name
                                                            </th>
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
                                                                            padding: "0px 20px",
                                                                        }}
                                                                    >
                                                                        {item.itemName}
                                                                    </td>
                                                                    <td
                                                                        style={{
                                                                            borderRight: "1px solid #EAEAEA",
                                                                            textAlign: "center",
                                                                        }}
                                                                    >
                                                                        {item.hsn || "-"}
                                                                    </td>
                                                                    <td
                                                                        style={{
                                                                            borderRight: "1px solid #EAEAEA",
                                                                            textAlign: "center",
                                                                        }}
                                                                    >
                                                                        {item.qty}
                                                                    </td>
                                                                    <td
                                                                        style={{
                                                                            borderRight: "1px solid #EAEAEA",
                                                                            textAlign: "center",
                                                                        }}
                                                                    >
                                                                        {item.unitPrice}
                                                                    </td>
                                                                    <td
                                                                        style={{
                                                                            borderRight: "1px solid #EAEAEA",
                                                                            textAlign: "center",
                                                                        }}
                                                                    >
                                                                        {item.taxRate} %
                                                                    </td>
                                                                    <td
                                                                        style={{
                                                                            borderRight: "1px solid #EAEAEA",
                                                                            textAlign: "center",
                                                                        }}
                                                                    >
                                                                        ₹{item.taxAmount}
                                                                    </td>
                                                                    <td
                                                                        style={{
                                                                            borderRight: "1px solid #EAEAEA",
                                                                            textAlign: "center",
                                                                        }}
                                                                    >
                                                                        ₹{item.amount}
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
                                                    <div
                                                        style={{
                                                            width: "100%",
                                                            height: 0.76,
                                                            left: 31.77,
                                                            background: "var(--White-Stroke, #EAEAEA)",
                                                            marginTop: "10px",
                                                        }}
                                                    />
                                                    {/* <div
                                                        style={{
                                                            marginTop: "2px",
                                                            textDecoration: "underline",
                                                        }}
                                                    >
                                                        Payment Details
                                                    </div> */}
                                                    {/* <div
                                                        style={{
                                                            width: "100%",
                                                            display: "flex",
                                                            justifyContent: "space-between",
                                                            padding: "0px 5px",
                                                        }}
                                                    >
                                                        <div style={{ textAlign: "left" }}>
                                                            <div>
                                                                Payment Terms :{" "}
                                                                <span
                                                                    style={{ color: "black", fontWeight: "600" }}
                                                                >
                                                                    {invoiceData.paymentTerms || "30 Days"}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                Due Date :{" "}
                                                                <span
                                                                    style={{ color: "black", fontWeight: "600" }}
                                                                >
                                                                    {invoiceData.dueDate
                                                                        ? format(new Date(invoiceData.dueDate), "dd MMM yyyy")
                                                                        : "N/A"}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                Payment Status :{" "}
                                                                <span
                                                                    style={{
                                                                        color: invoiceData.paymentStatus === 'Paid' ? 'green' :
                                                                            invoiceData.paymentStatus === 'Partial' ? 'orange' : 'red',
                                                                        fontWeight: "600"
                                                                    }}
                                                                >
                                                                    {invoiceData.paymentStatus || "Pending"}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                Payment Method :{" "}
                                                                <span
                                                                    style={{ color: "black", fontWeight: "600" }}
                                                                >
                                                                    {invoiceData.paymentMethod || "N/A"}
                                                                </span>
                                                            </div>
                                                        </div>
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
                                                                    src={Qrcode}
                                                                    alt="QR Code"
                                                                    style={{ width: "100%" }}
                                                                />
                                                            </div>
                                                            <div>Supplier UPI ID</div>
                                                        </div>
                                                    </div> */}
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
                                                        <span>Freight/Shipping</span>
                                                        <span style={{ color: "black" }}>
                                                            ₹{invoiceData.freightCharges || 0}
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
                                                        <span>Other Charges</span>
                                                        <span style={{ color: "black" }}>
                                                            ₹{invoiceData.otherCharges?.toFixed(2) || 0}
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
                                                            Total Amount
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
                                                        <span>Advance Paid</span>
                                                        <span style={{ color: "black" }}>
                                                            ₹{invoiceData.advancePaid?.toFixed(2) || 0}
                                                        </span>
                                                    </div>
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            justifyContent: "space-between",
                                                            padding: "1px 8px",
                                                        }}
                                                    >
                                                        <span>Amount Due</span>
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
                                                <div
                                                    style={{
                                                        borderRight: "",
                                                        width: "50%",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        alignItems: "center",
                                                    }}
                                                >
                                                    <u>Terms & Conditions</u>
                                                    <div style={{ fontSize: "10px", marginTop: "5px", textAlign: "center" }}>
                                                        {/* {invoiceData.terms || "1. Goods once sold will not be taken back.\n2. Payment must be made within due date.\n3. All disputes subject to jurisdiction of Noida."} */}
                                                    </div>
                                                </div>

                                                <div
                                                    style={{
                                                        width: "50%",
                                                        borderLeft: "1px solid #EAEAEA",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            justifyContent: "center",
                                                            borderTop: "1px solid #EAEAEA",
                                                            padding: "1px 8px",
                                                            marginTop: "60px",
                                                        }}
                                                    >
                                                        <span
                                                            style={{ fontWeight: "500", fontSize: "10px" }}
                                                        >
                                                            Authorized Signature
                                                        </span>
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
                                                <span style={{ marginTop: "5px", fontSize: "10px", color: "#666" }}>
                                                    This is a computer generated invoice and does not require a physical signature.
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right side - Keep as is, just update Done button link */}
                        <div style={{
                            width: '100%',
                            height: 'auto',
                        }}
                        >
                            <div
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    flexDirection: 'column',
                                    justifyContent: 'flex-start',
                                    alignItems: 'flex-start',
                                    gap: 24,
                                    display: 'inline-flex'
                                }}
                            >
                                {/* Your existing print & send section remains the same */}
                                <div
                                    style={{
                                        alignSelf: 'stretch',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        gap: 24,
                                        display: 'flex',
                                        width: '100%'
                                    }}
                                >
                                    {/* print */}
                                    <div
                                        style={{
                                            flex: '1 1 0',
                                            padding: 16,
                                            background: 'var(--White-Universal-White, white)',
                                            boxShadow: '-0.9059333801269531px -0.9059333801269531px 0.8153400421142578px rgba(0, 0, 0, 0.10) inset',
                                            borderRadius: 14.49,
                                            outline: '0.91px var(--White-Stroke, #EAEAEA) solid',
                                            outlineOffset: '-0.91px',
                                            flexDirection: 'column',
                                            justifyContent: 'flex-start',
                                            alignItems: 'flex-start',
                                            gap: 16,
                                            display: 'inline-flex',
                                            width: '50%'
                                        }}
                                    >
                                        <div
                                            style={{
                                                alignSelf: 'stretch',
                                                flexDirection: 'column',
                                                justifyContent: 'flex-start',
                                                alignItems: 'flex-start',
                                                gap: 8,
                                                display: 'flex'
                                            }}
                                        >
                                            <div
                                                style={{
                                                    alignSelf: 'stretch',
                                                    color: 'var(--Black-Black, #0E101A)',
                                                    fontSize: 16,
                                                    fontFamily: 'Inter',
                                                    fontWeight: '500',
                                                    wordWrap: 'break-word'
                                                }}
                                            >
                                                Print
                                            </div>
                                            <div
                                                style={{
                                                    alignSelf: 'stretch',
                                                    height: 0.91,
                                                    background: 'var(--White-Stroke, #EAEAEA)'
                                                }}
                                            />
                                        </div>
                                        <div
                                            style={{
                                                alignSelf: 'stretch',
                                                justifyContent: 'flex-start',
                                                alignItems: 'center',
                                                gap: 24,
                                                display: 'inline-flex',
                                                flexWrap: 'wrap',
                                                alignContent: 'center'
                                            }}
                                        >
                                            <div
                                                data-property-1="Pdf"
                                                data-selected="False"
                                                style={{
                                                    height: 42,
                                                    paddingLeft: 16,
                                                    paddingRight: 16,
                                                    background: 'var(--White-Universal-White, white)',
                                                    borderRadius: 8,
                                                    outline: '1px var(--White-Stroke, #EAEAEA) solid',
                                                    outlineOffset: '-1px',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    gap: 8,
                                                    display: 'flex',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <div
                                                    data-property-1="Download"
                                                    style={{
                                                        width: 20,
                                                        height: 20,
                                                        position: 'relative',
                                                        overflow: 'hidden',
                                                        color: '#1F7FFF',
                                                        fontSize: '20px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    <RiFileDownloadLine />
                                                </div>
                                                <div
                                                    style={{
                                                        width: 114,
                                                        height: 19,
                                                        color: 'black',
                                                        fontSize: 14,
                                                        fontFamily: 'Inter',
                                                        fontWeight: '400',
                                                        wordWrap: 'break-word'
                                                    }}
                                                >
                                                    Download PDF
                                                </div>
                                            </div>
                                            <div
                                                data-property-1="Thermal print"
                                                data-selected="False"
                                                style={{
                                                    height: 42,
                                                    paddingLeft: 16,
                                                    paddingRight: 16,
                                                    background: 'var(--White-Universal-White, white)',
                                                    borderRadius: 8,
                                                    outline: '1px var(--White-Stroke, #EAEAEA) solid',
                                                    outlineOffset: '-1px',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    gap: 8,
                                                    display: 'flex',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <div
                                                    data-property-1="Download"
                                                    style={{
                                                        width: 20,
                                                        height: 20,
                                                        position: 'relative',
                                                        overflow: 'hidden',
                                                        color: '#1F7FFF',
                                                        fontSize: '20px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    <PiNewspaperClipping />
                                                </div>
                                                <div
                                                    style={{
                                                        width: 114,
                                                        height: 19,
                                                        color: 'black',
                                                        fontSize: 14,
                                                        fontFamily: 'Inter',
                                                        fontWeight: '400',
                                                        wordWrap: 'break-word'
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
                                                    background: 'var(--White-Universal-White, white)',
                                                    borderRadius: 8,
                                                    outline: '1px var(--White-Stroke, #EAEAEA) solid',
                                                    outlineOffset: '-1px',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    gap: 8,
                                                    display: 'flex',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <div
                                                    data-property-1="Download"
                                                    style={{
                                                        width: 20,
                                                        height: 20,
                                                        position: 'relative',
                                                        overflow: 'hidden',
                                                        color: '#1F7FFF',
                                                        fontSize: '20px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    <ImPrinter />
                                                </div>
                                                <div
                                                    style={{
                                                        width: 114,
                                                        height: 19,
                                                        color: 'black',
                                                        fontSize: 14,
                                                        fontFamily: 'Inter',
                                                        fontWeight: '400',
                                                        wordWrap: 'break-word'
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
                                            flex: '1 1 0',
                                            padding: 16,
                                            background: 'var(--White-Universal-White, white)',
                                            boxShadow: '-0.9059333801269531px -0.9059333801269531px 0.8153400421142578px rgba(0, 0, 0, 0.10) inset',
                                            borderRadius: 14.49,
                                            outline: '0.91px var(--White-Stroke, #EAEAEA) solid',
                                            outlineOffset: '-0.91px',
                                            flexDirection: 'column',
                                            justifyContent: 'flex-start',
                                            alignItems: 'flex-start',
                                            gap: 16,
                                            display: 'inline-flex',
                                            width: '50%',
                                        }}
                                    >
                                        <div
                                            style={{
                                                alignSelf: 'stretch',
                                                flexDirection: 'column',
                                                justifyContent: 'flex-start',
                                                alignItems: 'flex-start',
                                                gap: 8,
                                                display: 'flex'
                                            }}
                                        >
                                            <div
                                                style={{
                                                    alignSelf: 'stretch',
                                                    color: 'var(--Black-Black, #0E101A)',
                                                    fontSize: 16,
                                                    fontFamily: 'Inter',
                                                    fontWeight: '500',
                                                    wordWrap: 'break-word'
                                                }}
                                            >
                                                Send
                                            </div>
                                            <div
                                                style={{
                                                    alignSelf: 'stretch',
                                                    height: 0.91,
                                                    background: 'var(--White-Stroke, #EAEAEA)'
                                                }}
                                            />
                                        </div>
                                        <div
                                            style={{
                                                alignSelf: 'stretch',
                                                justifyContent: 'flex-start',
                                                alignItems: 'center',
                                                gap: 24,
                                                display: 'inline-flex',
                                                flexWrap: 'wrap',
                                                alignContent: 'center'
                                            }}
                                        >
                                            <div
                                                data-property-1="Message"
                                                data-selected="False"
                                                style={{
                                                    height: 42,
                                                    paddingLeft: 16,
                                                    paddingRight: 16,
                                                    background: 'var(--White-Universal-White, white)',
                                                    borderRadius: 8,
                                                    outline: '1px var(--White-Stroke, #EAEAEA) solid',
                                                    outlineOffset: '-1px',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    gap: 8,
                                                    display: 'flex',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <div
                                                    data-property-1="Download"
                                                    style={{
                                                        width: 20,
                                                        height: 20,
                                                        position: 'relative',
                                                        overflow: 'hidden',
                                                        color: '#1F7FFF',
                                                        fontSize: '20px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    <RiMessage2Fill />
                                                </div>
                                                <div
                                                    style={{
                                                        width: 114,
                                                        height: 19,
                                                        color: 'black',
                                                        fontSize: 14,
                                                        fontFamily: 'Inter',
                                                        fontWeight: '400',
                                                        wordWrap: 'break-word'
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
                                                    background: 'var(--White-Universal-White, white)',
                                                    borderRadius: 8,
                                                    outline: '1px var(--White-Stroke, #EAEAEA) solid',
                                                    outlineOffset: '-1px',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    gap: 8,
                                                    display: 'flex',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <div
                                                    data-property-1="Download"
                                                    style={{
                                                        width: 20,
                                                        height: 20,
                                                        position: 'relative',
                                                        overflow: 'hidden',
                                                        color: '#25D366',
                                                        fontSize: '20px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    <RiWhatsappFill />
                                                </div>
                                                <div
                                                    style={{
                                                        width: 114,
                                                        height: 19,
                                                        color: 'black',
                                                        fontSize: 14,
                                                        fontFamily: 'Inter',
                                                        fontWeight: '400',
                                                        wordWrap: 'break-word'
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
                                                    background: 'var(--White-Universal-White, white)',
                                                    borderRadius: 8,
                                                    outline: '1px var(--White-Stroke, #EAEAEA) solid',
                                                    outlineOffset: '-1px',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    gap: 8,
                                                    display: 'flex',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <div
                                                    data-property-1="Gmail"
                                                    style={{
                                                        width: 20,
                                                        height: 15,
                                                        position: 'relative',
                                                        overflow: 'hidden'
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            width: 4.54,
                                                            height: 11.08,
                                                            left: 0,
                                                            top: 3.85,
                                                            position: 'absolute',
                                                            background: '#4285F4'
                                                        }}
                                                    />
                                                    <div
                                                        style={{
                                                            width: 4.54,
                                                            height: 11.08,
                                                            left: 15.45,
                                                            top: 3.85,
                                                            position: 'absolute',
                                                            background: '#34A853'
                                                        }}
                                                    />
                                                    <div
                                                        style={{
                                                            width: 11.60,
                                                            height: 6,
                                                            left: 4.22,
                                                            top: 3,
                                                            position: 'absolute',
                                                            background: '#EA4335'
                                                        }}
                                                    />
                                                    <div
                                                        style={{
                                                            width: 4,
                                                            height: 6,
                                                            left: 8,
                                                            top: 6,
                                                            position: 'absolute',
                                                            background: '#EA4335'
                                                        }}
                                                    />
                                                    <div
                                                        style={{
                                                            width: 4.54,
                                                            height: 7.24,
                                                            left: 15.45,
                                                            top: 0,
                                                            position: 'absolute',
                                                            background: '#FBBC04'
                                                        }}
                                                    />
                                                    <div
                                                        style={{
                                                            width: 4.54,
                                                            height: 7.24,
                                                            left: 0,
                                                            top: 0,
                                                            position: 'absolute',
                                                            background: '#C5221F'
                                                        }}
                                                    />
                                                </div>
                                                <div
                                                    style={{
                                                        width: 114,
                                                        height: 19,
                                                        color: 'black',
                                                        fontSize: 14,
                                                        fontFamily: 'Inter',
                                                        fontWeight: '400',
                                                        wordWrap: 'break-word'
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
                                        width: '100%',
                                        paddingTop: 24,
                                        paddingBottom: 24,
                                        paddingLeft: 24,
                                        paddingRight: 43.48,
                                        background: 'var(--White-Universal-White, white)',
                                        boxShadow: '-0.9059333801269531px -0.9059333801269531px 0.8153400421142578px rgba(0, 0, 0, 0.10) inset',
                                        borderRadius: 14.49,
                                        outline: '0.91px var(--White-Stroke, #EAEAEA) solid',
                                        outlineOffset: '-0.91px',
                                        flexDirection: 'column',
                                        justifyContent: 'flex-start',
                                        alignItems: 'flex-start',
                                        gap: 16,
                                        display: 'flex',
                                        height: 'auto',
                                    }}
                                >
                                    <div
                                        style={{
                                            alignSelf: 'stretch',
                                            flexDirection: 'column',
                                            justifyContent: 'flex-start',
                                            alignItems: 'flex-start',
                                            gap: 8,
                                            display: 'flex'
                                        }}
                                    >
                                        <div
                                            style={{
                                                alignSelf: 'stretch',
                                                color: 'var(--Black-Black, #0E101A)',
                                                fontSize: 19.93,
                                                fontFamily: 'Poppins',
                                                fontWeight: '500',
                                                wordWrap: 'break-word'
                                            }}
                                        >
                                            Invoice Format
                                        </div>
                                        <div
                                            style={{
                                                alignSelf: 'stretch',
                                                height: 0.91,
                                                background: 'var(--White-Stroke, #EAEAEA)'
                                            }}
                                        />
                                    </div>
                                    <div
                                        style={{
                                            justifyContent: 'flex-start',
                                            alignItems: 'center',
                                            gap: 24,
                                            display: 'inline-flex'
                                        }}
                                    >
                                        <Link
                                            to='/m/thermaltemplate'
                                            style={{
                                                paddingLeft: 16,
                                                paddingRight: 16,
                                                paddingTop: 8,
                                                paddingBottom: 8,
                                                background: 'var(--White-Universal-White, white)',
                                                borderRadius: 8,
                                                outline: '2px var(--Blue-Blue, #1F7FFF) solid',
                                                outlineOffset: '-2px',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                gap: 8,
                                                display: 'flex',
                                                cursor: 'pointer',
                                                textDecoration: 'none',
                                            }}
                                        >
                                            <div
                                                data-property-1="Download"
                                                style={{
                                                    width: 20,
                                                    height: 20,
                                                    position: 'relative',
                                                    overflow: 'hidden',
                                                    color: '#1F7FFF',
                                                    fontSize: '20px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <PiNewspaperClipping />
                                            </div>
                                            <div
                                                style={{
                                                    width: 114,
                                                    height: 19,
                                                    color: 'black',
                                                    fontSize: 14,
                                                    fontFamily: 'Inter',
                                                    fontWeight: '400',
                                                    wordWrap: 'break-word'
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
                                                background: 'var(--White-Universal-White, white)',
                                                borderRadius: 8,
                                                outline: '1px var(--White-Stroke, #EAEAEA) solid',
                                                outlineOffset: '-1px',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                gap: 8,
                                                display: 'flex',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <div
                                                data-property-1="Download"
                                                style={{
                                                    width: 20,
                                                    height: 20,
                                                    position: 'relative',
                                                    overflow: 'hidden',
                                                    color: '#1F7FFF',
                                                    fontSize: '20px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <ImPrinter />
                                            </div>
                                            <div
                                                style={{
                                                    width: 114,
                                                    height: 19,
                                                    color: 'black',
                                                    fontSize: 14,
                                                    fontFamily: 'Inter',
                                                    fontWeight: '400',
                                                    wordWrap: 'break-word'
                                                }}
                                            >
                                                Normal Print
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            width: '100%',
                                            height: 410,
                                            position: 'relative',
                                        }}
                                    >
                                        <Link
                                            to="/m/invoicetemplate2"
                                            style={{
                                                width: '32%',
                                                maxWidth: 280,
                                                height: 409,
                                                left: 0,
                                                top: 1.28,
                                                position: 'absolute',
                                                background: 'var(--White-Stroke, #EAEAEA)',
                                                overflow: 'hidden',
                                                borderRadius: 6.04,
                                                outline: '2px var(--Blue-Blue, #1F7FFF) solid',
                                                outlineOffset: '-1.51px',
                                                cursor: 'pointer',
                                                color: 'black',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: 245,
                                                    height: 390,
                                                    left: 7,
                                                    top: 10,
                                                    position: 'absolute',
                                                    backgroundColor: 'white',
                                                }}
                                            >
                                                <div style={{ width: '100%', justifyContent: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0px 10px' }}>
                                                    <div style={{ marginTop: '5px', fontWeight: '500', fontSize: '12px' }}>Shop Name</div>
                                                    <div style={{ marginTop: '0px', fontWeight: '500', fontSize: '10px', color: '#727681' }}>Address and contact no.</div>
                                                    <div style={{ marginTop: '0px', fontWeight: '500', fontSize: '10px', }}>*** INVOICE ***</div>
                                                    <div style={{ marginTop: '0px', fontWeight: '500', fontSize: '10px', display: 'flex', justifyContent: 'left', width: '100%', }}>
                                                        <span>Invoice No.: 1822</span>
                                                    </div>
                                                    <div style={{ marginTop: '1px', fontWeight: '500', fontSize: '10px', display: 'flex', justifyContent: 'left', width: '100%', }}>
                                                        <span>Payment Mode: CASH</span>
                                                    </div>
                                                    <div
                                                        style={{
                                                            width: '100%',
                                                            height: 0.76,
                                                            left: 31.77,
                                                            marginTop: '1px',
                                                            background: 'var(--White-Stroke, #EAEAEA)'
                                                        }}
                                                    />
                                                    <div style={{ marginTop: '1px', fontWeight: '500', fontSize: '10px', display: 'flex', justifyContent: 'left', width: '100%', flexDirection: 'column' }}>
                                                        <div>Customer Name</div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <span>Alok Ranjan</span>
                                                            <span>9876543210</span>
                                                        </div>
                                                    </div>
                                                    <div
                                                        style={{
                                                            width: '100%',
                                                            height: 0.76,
                                                            left: 31.77,
                                                            marginTop: '1px',
                                                            background: 'var(--White-Stroke, #EAEAEA)'
                                                        }}
                                                    />
                                                    <div style={{ marginTop: '1px', fontWeight: '500', fontSize: '10px', display: 'flex', justifyContent: 'left', width: '100%', flexDirection: 'column' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <span>Counter - #1</span>
                                                            <span>03/02/2025 09:45 am</span>
                                                        </div>
                                                    </div>
                                                    <div
                                                        style={{
                                                            width: '100%',
                                                            borderTop: '1px dashed #EAEAEA', // dashed line
                                                            marginTop: '1px',
                                                        }}
                                                    />
                                                    <div style={{ fontSize: '10px', width: '100%' }}>
                                                        <table style={{ fontSize: '10px', width: '100%' }}>
                                                            <thead>
                                                                <tr>
                                                                    <th>Item</th>
                                                                    <th>QTY</th>
                                                                    <th style={{ textAlign: 'right' }}>COST</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                <tr>
                                                                    <td>White T-Shirt - Nike</td>
                                                                    <td>01</td>
                                                                    <td style={{ textAlign: 'right' }}>₹1,935.2</td>
                                                                </tr>
                                                                <tr>
                                                                    <td>White T-Shirt - Nike</td>
                                                                    <td>01</td>
                                                                    <td style={{ textAlign: 'right' }}>₹1,935.2</td>
                                                                </tr>
                                                                <tr>
                                                                    <td>White T-Shirt - Nike</td>
                                                                    <td>01</td>
                                                                    <td style={{ textAlign: 'right' }}>₹1,935.2</td>
                                                                </tr>
                                                                <tr>
                                                                    <td>White T-Shirt - Nike</td>
                                                                    <td>01</td>
                                                                    <td style={{ textAlign: 'right' }}>₹1,935.2</td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                        <div
                                                            style={{
                                                                width: '100%',
                                                                borderTop: '1px dashed #EAEAEA', // dashed line
                                                                marginTop: '1px',
                                                            }}
                                                        />
                                                        <table style={{ fontSize: '10px', width: '100%' }}>
                                                            <tbody>
                                                                <tr>
                                                                    <td>Subtotal</td>
                                                                    <td>04</td>
                                                                    <td style={{ textAlign: 'right' }}>₹7,740.8</td>
                                                                </tr>
                                                                <tr>
                                                                    <td>Discount</td>
                                                                    <td></td>
                                                                    <td style={{ textAlign: 'right' }}>- ₹1,935.2</td>
                                                                </tr>
                                                                <tr>
                                                                    <td>CGST @ 18%</td>
                                                                    <td></td>
                                                                    <td style={{ textAlign: 'right' }}>+ ₹1,935.2</td>
                                                                </tr>
                                                                <tr>
                                                                    <td>SGST @ 18%</td>
                                                                    <td></td>
                                                                    <td style={{ textAlign: 'right' }}>+ ₹1,935.2</td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                        <div
                                                            style={{
                                                                width: '100%',
                                                                borderTop: '1px dashed #EAEAEA', // dashed line
                                                                marginTop: '1px',
                                                            }}
                                                        />
                                                        <div style={{ marginTop: '1px', fontWeight: '500', fontSize: '10px', display: 'flex', justifyContent: 'left', width: '100%', flexDirection: 'column' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                <span>🪙 Shopping Points</span>
                                                                <span>- ₹1,935.2</span>
                                                            </div>
                                                        </div>
                                                        <div
                                                            style={{
                                                                width: '100%',
                                                                borderTop: '1px dashed #EAEAEA', // dashed line
                                                                marginTop: '1px',
                                                            }}
                                                        />
                                                        <div style={{ marginTop: '1px', fontWeight: '500', fontSize: '10px', display: 'flex', justifyContent: 'left', width: '100%', flexDirection: 'column' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                <span>Additional Charges</span>
                                                                <span>- ₹1,935.2</span>
                                                            </div>
                                                        </div>
                                                        <div
                                                            style={{
                                                                width: '100%',
                                                                borderTop: '1px dashed #EAEAEA', // dashed line
                                                                marginTop: '1px',
                                                            }}
                                                        />
                                                        <div style={{ marginTop: '1px', fontWeight: '500', fontSize: '10px', display: 'flex', justifyContent: 'left', width: '100%', flexDirection: 'column' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                <span>Total</span>
                                                                <span>₹1,935.2</span>
                                                            </div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                <span>Due</span>
                                                                <span>Nil</span>
                                                            </div>
                                                        </div>
                                                        <div
                                                            style={{
                                                                width: '100%',
                                                                display: 'flex',
                                                                justifyContent: 'center',
                                                                color: 'var(--Black-Black, #0E101A)',
                                                                fontSize: 8,
                                                                fontFamily: 'Poppins',
                                                                fontStyle: 'italic',
                                                                fontWeight: '400',
                                                                wordWrap: 'break-word',
                                                                marginTop: '10px',
                                                            }}
                                                        >
                                                            Congratulations! You’ve earned 🪙 50 shopping points 🎉
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div
                                                style={{
                                                    padding: 3.02,
                                                    left: 2.26,
                                                    top: 3.09,
                                                    position: 'absolute',
                                                    background: 'rgba(255, 255, 255, 0.78)',
                                                    borderRadius: 3.02,
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    gap: 6.04,
                                                    display: 'inline-flex'
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        textAlign: 'center',
                                                        color: 'var(--Black-Black, #0E101A)',
                                                        fontSize: 10.51,
                                                        fontFamily: 'Poppins',
                                                        fontStyle: 'italic',
                                                        fontWeight: '500',
                                                        wordWrap: 'break-word'
                                                    }}
                                                >
                                                    #1 Default Template
                                                </div>
                                            </div>
                                        </Link>
                                        <Link
                                            to="/m/invoicetemplate2"
                                            style={{
                                                width: '32%',
                                                maxWidth: 280,
                                                height: 409,
                                                left: '34.5%',
                                                top: 1.28,
                                                position: 'absolute',
                                                background: 'var(--White-Stroke, #EAEAEA)',
                                                overflow: 'hidden',
                                                borderRadius: 6.04,
                                                outline: '2px var(--Blue-Blue, #1F7FFF) solid',
                                                outlineOffset: '-1.51px',
                                                cursor: 'pointer',
                                                color: 'black',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: 245,
                                                    height: 390,
                                                    left: 7,
                                                    top: 10,
                                                    position: 'absolute',
                                                    backgroundColor: 'white',
                                                }}
                                            >
                                                <div style={{ width: '100%', justifyContent: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0px 10px' }}>
                                                    <div style={{ marginTop: '5px', fontWeight: '500', fontSize: '12px' }}>Shop Name</div>
                                                    <div style={{ marginTop: '0px', fontWeight: '500', fontSize: '10px', color: '#727681' }}>Address and contact no.</div>
                                                    <div style={{ marginTop: '0px', fontWeight: '500', fontSize: '10px', }}>*** INVOICE ***</div>
                                                    <div style={{ marginTop: '0px', fontWeight: '500', fontSize: '10px', display: 'flex', justifyContent: 'left', width: '100%', }}>
                                                        <span>Invoice No.: 1822</span>
                                                    </div>
                                                    <div style={{ marginTop: '1px', fontWeight: '500', fontSize: '10px', display: 'flex', justifyContent: 'left', width: '100%', }}>
                                                        <span>Payment Mode: CASH</span>
                                                    </div>
                                                    <div
                                                        style={{
                                                            width: '100%',
                                                            height: 0.76,
                                                            left: 31.77,
                                                            marginTop: '1px',
                                                            background: 'var(--White-Stroke, #EAEAEA)'
                                                        }}
                                                    />
                                                    <div style={{ marginTop: '1px', fontWeight: '500', fontSize: '10px', display: 'flex', justifyContent: 'left', width: '100%', flexDirection: 'column' }}>
                                                        <div>Customer Name</div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <span>Alok Ranjan</span>
                                                            <span>9876543210</span>
                                                        </div>
                                                    </div>
                                                    <div
                                                        style={{
                                                            width: '100%',
                                                            height: 0.76,
                                                            left: 31.77,
                                                            marginTop: '1px',
                                                            background: 'var(--White-Stroke, #EAEAEA)'
                                                        }}
                                                    />
                                                    <div style={{ marginTop: '1px', fontWeight: '500', fontSize: '10px', display: 'flex', justifyContent: 'left', width: '100%', flexDirection: 'column' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <span>Counter - #1</span>
                                                            <span>03/02/2025 09:45 am</span>
                                                        </div>
                                                    </div>
                                                    <div
                                                        style={{
                                                            width: '100%',
                                                            borderTop: '1px dashed #EAEAEA', // dashed line
                                                            marginTop: '1px',
                                                        }}
                                                    />
                                                    <div style={{ fontSize: '10px', width: '100%' }}>
                                                        <table style={{ fontSize: '10px', width: '100%' }}>
                                                            <thead>
                                                                <tr>
                                                                    <th>Item</th>
                                                                    <th>QTY</th>
                                                                    <th style={{ textAlign: 'right' }}>COST</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                <tr>
                                                                    <td>White T-Shirt - Nike</td>
                                                                    <td>01</td>
                                                                    <td style={{ textAlign: 'right' }}>₹1,935.2</td>
                                                                </tr>
                                                                <tr>
                                                                    <td>White T-Shirt - Nike</td>
                                                                    <td>01</td>
                                                                    <td style={{ textAlign: 'right' }}>₹1,935.2</td>
                                                                </tr>
                                                                <tr>
                                                                    <td>White T-Shirt - Nike</td>
                                                                    <td>01</td>
                                                                    <td style={{ textAlign: 'right' }}>₹1,935.2</td>
                                                                </tr>
                                                                <tr>
                                                                    <td>White T-Shirt - Nike</td>
                                                                    <td>01</td>
                                                                    <td style={{ textAlign: 'right' }}>₹1,935.2</td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                        <div
                                                            style={{
                                                                width: '100%',
                                                                borderTop: '1px dashed #EAEAEA', // dashed line
                                                                marginTop: '1px',
                                                            }}
                                                        />
                                                        <table style={{ fontSize: '10px', width: '100%' }}>
                                                            <tbody>
                                                                <tr>
                                                                    <td>Subtotal</td>
                                                                    <td>04</td>
                                                                    <td style={{ textAlign: 'right' }}>₹7,740.8</td>
                                                                </tr>
                                                                <tr>
                                                                    <td>Discount</td>
                                                                    <td></td>
                                                                    <td style={{ textAlign: 'right' }}>- ₹1,935.2</td>
                                                                </tr>
                                                                <tr>
                                                                    <td>CGST @ 18%</td>
                                                                    <td></td>
                                                                    <td style={{ textAlign: 'right' }}>+ ₹1,935.2</td>
                                                                </tr>
                                                                <tr>
                                                                    <td>SGST @ 18%</td>
                                                                    <td></td>
                                                                    <td style={{ textAlign: 'right' }}>+ ₹1,935.2</td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                        <div
                                                            style={{
                                                                width: '100%',
                                                                borderTop: '1px dashed #EAEAEA', // dashed line
                                                                marginTop: '1px',
                                                            }}
                                                        />
                                                        <div style={{ marginTop: '1px', fontWeight: '500', fontSize: '10px', display: 'flex', justifyContent: 'left', width: '100%', flexDirection: 'column' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                <span>🪙 Shopping Points</span>
                                                                <span>- ₹1,935.2</span>
                                                            </div>
                                                        </div>
                                                        <div
                                                            style={{
                                                                width: '100%',
                                                                borderTop: '1px dashed #EAEAEA', // dashed line
                                                                marginTop: '1px',
                                                            }}
                                                        />
                                                        <div style={{ marginTop: '1px', fontWeight: '500', fontSize: '10px', display: 'flex', justifyContent: 'left', width: '100%', flexDirection: 'column' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                <span>Additional Charges</span>
                                                                <span>- ₹1,935.2</span>
                                                            </div>
                                                        </div>
                                                        <div
                                                            style={{
                                                                width: '100%',
                                                                borderTop: '1px dashed #EAEAEA', // dashed line
                                                                marginTop: '1px',
                                                            }}
                                                        />
                                                        <div style={{ marginTop: '1px', fontWeight: '500', fontSize: '10px', display: 'flex', justifyContent: 'left', width: '100%', flexDirection: 'column' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                <span>Total</span>
                                                                <span>₹1,935.2</span>
                                                            </div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                <span>Due</span>
                                                                <span>Nil</span>
                                                            </div>
                                                        </div>
                                                        <div
                                                            style={{
                                                                width: '100%',
                                                                display: 'flex',
                                                                justifyContent: 'center',
                                                                color: 'var(--Black-Black, #0E101A)',
                                                                fontSize: 8,
                                                                fontFamily: 'Poppins',
                                                                fontStyle: 'italic',
                                                                fontWeight: '400',
                                                                wordWrap: 'break-word',
                                                                marginTop: '10px',
                                                            }}
                                                        >
                                                            Congratulations! You’ve earned 🪙 50 shopping points 🎉
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div
                                                style={{
                                                    padding: 3.02,
                                                    left: 2.26,
                                                    top: 3.09,
                                                    position: 'absolute',
                                                    background: 'rgba(255, 255, 255, 0.78)',
                                                    borderRadius: 3.02,
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    gap: 6.04,
                                                    display: 'inline-flex'
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        textAlign: 'center',
                                                        color: 'var(--Black-Black, #0E101A)',
                                                        fontSize: 10.51,
                                                        fontFamily: 'Poppins',
                                                        fontStyle: 'italic',
                                                        fontWeight: '500',
                                                        wordWrap: 'break-word'
                                                    }}
                                                >
                                                    #2 Template
                                                </div>
                                            </div>
                                        </Link>
                                        <Link
                                            to="/m/invoicetemplate2"
                                            style={{
                                                width: '32%',
                                                maxWidth: 280,
                                                height: 409,
                                                left: '69%',
                                                top: 1.28,
                                                position: 'absolute',
                                                background: 'var(--White-Stroke, #EAEAEA)',
                                                overflow: 'hidden',
                                                borderRadius: 6.04,
                                                outline: '2px var(--Blue-Blue, #1F7FFF) solid',
                                                outlineOffset: '-1.51px',
                                                cursor: 'pointer',
                                                color: 'black',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: 245,
                                                    height: 390,
                                                    left: 7,
                                                    top: 10,
                                                    position: 'absolute',
                                                    backgroundColor: 'white',
                                                }}
                                            >
                                                <div style={{ width: '100%', justifyContent: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0px 10px' }}>
                                                    <div style={{ marginTop: '5px', fontWeight: '500', fontSize: '12px' }}>Shop Name</div>
                                                    <div style={{ marginTop: '0px', fontWeight: '500', fontSize: '10px', color: '#727681' }}>Address and contact no.</div>
                                                    <div style={{ marginTop: '0px', fontWeight: '500', fontSize: '10px', }}>*** INVOICE ***</div>
                                                    <div style={{ marginTop: '0px', fontWeight: '500', fontSize: '10px', display: 'flex', justifyContent: 'left', width: '100%', }}>
                                                        <span>Invoice No.: 1822</span>
                                                    </div>
                                                    <div style={{ marginTop: '1px', fontWeight: '500', fontSize: '10px', display: 'flex', justifyContent: 'left', width: '100%', }}>
                                                        <span>Payment Mode: CASH</span>
                                                    </div>
                                                    <div
                                                        style={{
                                                            width: '100%',
                                                            height: 0.76,
                                                            left: 31.77,
                                                            marginTop: '1px',
                                                            background: 'var(--White-Stroke, #EAEAEA)'
                                                        }}
                                                    />
                                                    <div style={{ marginTop: '1px', fontWeight: '500', fontSize: '10px', display: 'flex', justifyContent: 'left', width: '100%', flexDirection: 'column' }}>
                                                        <div>Customer Name</div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <span>Alok Ranjan</span>
                                                            <span>9876543210</span>
                                                        </div>
                                                    </div>
                                                    <div
                                                        style={{
                                                            width: '100%',
                                                            height: 0.76,
                                                            left: 31.77,
                                                            marginTop: '1px',
                                                            background: 'var(--White-Stroke, #EAEAEA)'
                                                        }}
                                                    />
                                                    <div style={{ marginTop: '1px', fontWeight: '500', fontSize: '10px', display: 'flex', justifyContent: 'left', width: '100%', flexDirection: 'column' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <span>Counter - #1</span>
                                                            <span>03/02/2025 09:45 am</span>
                                                        </div>
                                                    </div>
                                                    <div
                                                        style={{
                                                            width: '100%',
                                                            borderTop: '1px dashed #EAEAEA', // dashed line
                                                            marginTop: '1px',
                                                        }}
                                                    />
                                                    <div style={{ fontSize: '10px', width: '100%' }}>
                                                        <table style={{ fontSize: '10px', width: '100%' }}>
                                                            <thead>
                                                                <tr>
                                                                    <th>Item</th>
                                                                    <th>QTY</th>
                                                                    <th style={{ textAlign: 'right' }}>COST</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                <tr>
                                                                    <td>White T-Shirt - Nike</td>
                                                                    <td>01</td>
                                                                    <td style={{ textAlign: 'right' }}>₹1,935.2</td>
                                                                </tr>
                                                                <tr>
                                                                    <td>White T-Shirt - Nike</td>
                                                                    <td>01</td>
                                                                    <td style={{ textAlign: 'right' }}>₹1,935.2</td>
                                                                </tr>
                                                                <tr>
                                                                    <td>White T-Shirt - Nike</td>
                                                                    <td>01</td>
                                                                    <td style={{ textAlign: 'right' }}>₹1,935.2</td>
                                                                </tr>
                                                                <tr>
                                                                    <td>White T-Shirt - Nike</td>
                                                                    <td>01</td>
                                                                    <td style={{ textAlign: 'right' }}>₹1,935.2</td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                        <div
                                                            style={{
                                                                width: '100%',
                                                                borderTop: '1px dashed #EAEAEA', // dashed line
                                                                marginTop: '1px',
                                                            }}
                                                        />
                                                        <table style={{ fontSize: '10px', width: '100%' }}>
                                                            <tbody>
                                                                <tr>
                                                                    <td>Subtotal</td>
                                                                    <td>04</td>
                                                                    <td style={{ textAlign: 'right' }}>₹7,740.8</td>
                                                                </tr>
                                                                <tr>
                                                                    <td>Discount</td>
                                                                    <td></td>
                                                                    <td style={{ textAlign: 'right' }}>- ₹1,935.2</td>
                                                                </tr>
                                                                <tr>
                                                                    <td>CGST @ 18%</td>
                                                                    <td></td>
                                                                    <td style={{ textAlign: 'right' }}>+ ₹1,935.2</td>
                                                                </tr>
                                                                <tr>
                                                                    <td>SGST @ 18%</td>
                                                                    <td></td>
                                                                    <td style={{ textAlign: 'right' }}>+ ₹1,935.2</td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                        <div
                                                            style={{
                                                                width: '100%',
                                                                borderTop: '1px dashed #EAEAEA', // dashed line
                                                                marginTop: '1px',
                                                            }}
                                                        />
                                                        <div style={{ marginTop: '1px', fontWeight: '500', fontSize: '10px', display: 'flex', justifyContent: 'left', width: '100%', flexDirection: 'column' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                <span>🪙 Shopping Points</span>
                                                                <span>- ₹1,935.2</span>
                                                            </div>
                                                        </div>
                                                        <div
                                                            style={{
                                                                width: '100%',
                                                                borderTop: '1px dashed #EAEAEA', // dashed line
                                                                marginTop: '1px',
                                                            }}
                                                        />
                                                        <div style={{ marginTop: '1px', fontWeight: '500', fontSize: '10px', display: 'flex', justifyContent: 'left', width: '100%', flexDirection: 'column' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                <span>Additional Charges</span>
                                                                <span>- ₹1,935.2</span>
                                                            </div>
                                                        </div>
                                                        <div
                                                            style={{
                                                                width: '100%',
                                                                borderTop: '1px dashed #EAEAEA', // dashed line
                                                                marginTop: '1px',
                                                            }}
                                                        />
                                                        <div style={{ marginTop: '1px', fontWeight: '500', fontSize: '10px', display: 'flex', justifyContent: 'left', width: '100%', flexDirection: 'column' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                <span>Total</span>
                                                                <span>₹1,935.2</span>
                                                            </div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                <span>Due</span>
                                                                <span>Nil</span>
                                                            </div>
                                                        </div>
                                                        <div
                                                            style={{
                                                                width: '100%',
                                                                display: 'flex',
                                                                justifyContent: 'center',
                                                                color: 'var(--Black-Black, #0E101A)',
                                                                fontSize: 8,
                                                                fontFamily: 'Poppins',
                                                                fontStyle: 'italic',
                                                                fontWeight: '400',
                                                                wordWrap: 'break-word',
                                                                marginTop: '10px',
                                                            }}
                                                        >
                                                            Congratulations! You’ve earned 🪙 50 shopping points 🎉
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div
                                                style={{
                                                    padding: 3.02,
                                                    left: 2.26,
                                                    top: 3.09,
                                                    position: 'absolute',
                                                    background: 'rgba(255, 255, 255, 0.78)',
                                                    borderRadius: 3.02,
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    gap: 6.04,
                                                    display: 'inline-flex'
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        textAlign: 'center',
                                                        color: 'var(--Black-Black, #0E101A)',
                                                        fontSize: 10.51,
                                                        fontFamily: 'Poppins',
                                                        fontStyle: 'italic',
                                                        fontWeight: '500',
                                                        wordWrap: 'break-word'
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
                                        background: 'var(--Blue-Blue, #1F7FFF)',
                                        boxShadow: '-1px -1px 4px rgba(0, 0, 0, 0.25) inset',
                                        borderRadius: 8,
                                        outline: '1.50px var(--Blue-Blue, #1F7FFF) solid',
                                        outlineOffset: '-1.50px',
                                        justifyContent: 'flex-start',
                                        alignItems: 'center',
                                        gap: 4,
                                        display: 'inline-flex',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Link
                                        to="/suppliers" // Update to suppliers route
                                        style={{
                                            color: 'white',
                                            fontSize: 14,
                                            fontFamily: 'Inter',
                                            fontWeight: '500',
                                            lineHeight: 5,
                                            wordWrap: 'break-word',
                                            textDecoration: 'none',
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
    )
}

export default ShowPurchaseOrderInvoice;