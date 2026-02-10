import React, { useEffect, useState, useRef } from 'react'
import { RiFileDownloadLine } from "react-icons/ri";
import { PiNewspaperClipping } from "react-icons/pi";
import { ImPrinter } from "react-icons/im";
import { RiMessage2Fill } from "react-icons/ri";
import { RiWhatsappFill } from "react-icons/ri";
import { IoIosArrowBack } from "react-icons/io";
import { Link } from 'react-router-dom';
import { format } from "date-fns";
import { toast } from "react-toastify";
import numberToWords from "number-to-words";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import api from '../../pages/config/axiosInstance';
import CompanyLogo from '../../assets/images/kasperlogo.png'
import TaxInvoiceLogo from '../../assets/images/taxinvoice.png'
import Qrcode from '../../assets/images/qrcode.png';

const convertToIndianWords = (num) => {
    if (num === 0 || num === null || num === undefined) return 'ZERO';

    const n = Math.floor(Number(num));
    if (isNaN(n)) return 'ZERO';
    if (n === 0) return 'ZERO';

    const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
    const teens = ['TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
    const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

    const convertBelow100 = (num) => {
        if (num < 10) return ones[num];
        if (num < 20) return teens[num - 10];
        const ten = Math.floor(num / 10);
        const one = num % 10;
        return tens[ten] + (one ? ' ' + ones[one] : '');
    };

    const convertBelow1000 = (num) => {
        const hundred = Math.floor(num / 100);
        const remainder = num % 100;
        let result = '';
        if (hundred) result += ones[hundred] + ' HUNDRED';
        if (hundred && remainder) result += ' ';
        if (remainder) result += convertBelow100(remainder);
        return result;
    };

    let result = '';
    let tempNum = n;

    // Crores
    if (tempNum >= 10000000) {
        const crores = Math.floor(tempNum / 10000000);
        result += convertBelow1000(crores) + ' CRORE';
        tempNum %= 10000000;
    }

    // Lakhs
    if (tempNum >= 100000) {
        const lakhs = Math.floor(tempNum / 100000);
        if (result) result += ' ';
        result += convertBelow1000(lakhs) + ' LAKH';
        tempNum %= 100000;
    }

    // Thousands
    if (tempNum >= 1000) {
        const thousands = Math.floor(tempNum / 1000);
        if (result) result += ' ';
        result += convertBelow1000(thousands) + ' THOUSAND';
        tempNum %= 1000;
    }

    // Hundreds and below
    if (tempNum > 0) {
        if (result) result += ' ';
        result += convertBelow1000(tempNum);
    }

    return result.trim() || 'ZERO';
};


function RecentViewInvoiceModal({ invoiceData, supplierData, customerData, type = "purchase", invoiceId }) {
    const [invoice, setInvoice] = useState(invoiceData || null);
    const [companyData, setCompanyData] = useState(null);
    const [terms, setTerms] = useState(null);
    const [loading, setLoading] = useState(!invoiceData);
    const [isDownloading, setIsDownloading] = useState(false);
    const invoiceRef = useRef(null);
    const [signatureUrl, setSignatureUrl] = useState("");

    // Fetch invoice data if not provided
    useEffect(() => {
        const fetchInvoice = async () => {
            if (invoiceData) return;
            try {
                const res = await api.get(`/api/invoices/${invoiceId}`);
                setInvoice(res.data.invoice);
            } catch (err) {
                toast.error("Failed to load invoice");
            } finally {
                setLoading(false);
            }
        };
        fetchInvoice();
    }, [invoiceId, invoiceData]);

    // Fetch company data
    useEffect(() => {
        const fetchCompanyData = async () => {
            try {
                const res = await api.get(`/api/companyprofile/get`);
                setCompanyData(res.data.data);
            } catch (error) {
                console.error("Error fetching company profile:", error);
            }
        };
        fetchCompanyData();
    }, []);

    useEffect(() => {
        const fetchPrintTemplate = async () => {
            try {
                const res = await api.get('/api/print-templates?type=normal');
                if (res.data.data.template?.signatureUrl) {
                    setSignatureUrl(res.data.data.template.signatureUrl);
                }
            } catch (error) {
                console.error('Error fetching print template:', error);
            }
        };
        fetchPrintTemplate();
    }, []);

    // Fetch terms and conditions
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/api/notes-terms-settings');
                setTerms(res.data.data);
            } catch (error) {
                console.error('Error fetching notes & terms settings:', error);
            }
        };
        fetchSettings();
    }, []);

    // Function to handle PDF download
    const handleDownloadPDF = async () => {
        if (!invoiceRef.current) return;
        setIsDownloading(true);

        try {
            const element = invoiceRef.current;
            const canvas = await html2canvas(element, {
                scale: 2,
                backgroundColor: "#ffffff",
                useCORS: true,
                width: 595,
                height: 842,
            });

            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = 210;
            const pdfHeight = auto;

            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

            const fileName = `${type === "purchase" ? 'purchase' : 'sales'}-invoice-${invoice?.invoiceNo || "invoice"}.pdf`;
            pdf.save(fileName);
            toast.success("PDF downloaded successfully!");

        } catch (error) {
            console.error("Error generating PDF:", error);
            toast.error("Failed to generate PDF");
        } finally {
            setIsDownloading(false);
        }
    };

    // Function to handle printing
    const handlePrint = () => {
        if (!invoiceRef.current) {
            toast.error("Invoice content not available");
            return;
        }

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Print Invoice - ${invoice?.invoiceNo}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 20px;
                    }
                    @media print {
                        body {
                            padding: 0;
                        }
                    }
                </style>
            </head>
            <body>
                ${invoiceRef.current.innerHTML}
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(() => window.close(), 1000);
                    }
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return format(new Date(dateString), "dd MMM yyyy");
        } catch (error) {
            return 'N/A';
        }
    };

    // Helper function to format currency
    const formatCurrency = (amount) => {
        if (amount == null) return '₹0.00';
        return `₹${parseFloat(amount).toFixed(2)}`;
    };

    // Get company info based on type
    const getCompanyInfo = () => {
        const customer = invoice?.customerId || {};

        if (type === "purchase") {
            return {
                fromTitle: "From",
                toTitle: "Company Details",
                fromName: supplierData?.supplier?.supplierName || supplierData?.supplierName || 'N/A',
                fromAddress: supplierData?.supplier?.address?.addressLine || supplierData?.address?.addressLine || 'N/A',
                fromPhone: supplierData?.supplier?.phone || supplierData?.phone || 'N/A',
                fromEmail: supplierData?.supplier?.email || supplierData?.email || 'N/A',
                fromGSTIN: supplierData?.supplier?.gstin || supplierData?.gstin || 'N/A',
                toName: companyData?.companyName || "Your Company Name",
                toAddress: companyData?.companyaddress || "Your Company Address Here",
                toPhone: companyData?.companyphone || "Your Company Phone",
                toEmail: companyData?.companyemail || "Your Company Email",
                toGSTIN: companyData?.gstin || "Your Company GSTIN",
                documentTitle: "PURCHASE INVOICE"
            };
        } else {
            return {
                fromTitle: "From",
                toTitle: "Customer Details",
                fromName: companyData?.companyName || "Your Company Name",
                fromAddress: companyData?.companyaddress || "Your Company Address Here",
                fromPhone: companyData?.companyphone || "Your Company Phone",
                fromEmail: companyData?.companyemail || "Your Company Email",
                fromGSTIN: companyData?.gstin || "Your Company GSTIN",
                toName: customer.name || customerData?.name || 'N/A',
                toAddress: customer.address || customerData?.address || 'N/A',
                toPhone: customer.phone || customerData?.phone || 'N/A',
                toEmail: customer.email || customerData?.email || 'N/A',
                toGSTIN: customer.gstin || customerData?.gstin || 'N/A',
                documentTitle: "TAX INVOICE"
            };
        }
    };

    const companyInfo = getCompanyInfo();

    // Get invoice items
    const invoiceItems = Array.isArray(invoice?.items) ? invoice.items : [];
    const bankDetails = invoice?.bankDetails || {};
    const totalInWords = invoice?.grandTotal != null
        ? `${convertToIndianWords(invoice.grandTotal).toUpperCase()} RUPEES ONLY`
        : "";

    if (loading) return <div>Loading invoice...</div>;
    if (!invoice) return <div>Invoice not found</div>;

    return (
        <div
            ref={invoiceRef}
            style={{
                height: "auto",
                overflow: 'visible',
            }}>
            <div style={{
                width: "100%",
                borderRadius: "16px",
                justifyContent: "flex-start",
                alignItems: "flex-start",
                gap: "100px",
                display: "flex",
                height: 'auto'
            }}>
                {/* Left Side */}
                <div
                    style={{
                        width: '100%',
                        height: 'auto',
                        position: 'relative'
                    }}
                >
                    <div
                        style={{
                            width: '100%',
                            height: '100%',
                            left: 0,
                            top: 0,
                            background: 'var(--White-White-1, white)',
                            boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.10)',
                            padding: '10px 15px',
                            fontSize: '8px',
                            fontFamily: 'IBM Plex Mono',
                        }}
                    >
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}>
                            <div style={{ width: '100px' }}>
                                <img src={companyData?.companyLogo || CompanyLogo} alt='company logo' style={{ width: '100%', objectFit: 'contain', }} />
                            </div>
                            <div style={{ width: '130px' }}>
                                <img src={TaxInvoiceLogo} alt='tax invoice' style={{ width: '100%', objectFit: 'contain', }} />
                            </div>
                        </div>
                        <div
                            style={{
                                width: '100%',
                                height: 0.76,
                                left: 31.77,
                                background: 'var(--White-Stroke, #EAEAEA)',
                                marginTop: '8px'
                            }}
                        />
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                            <span>{companyInfo.documentTitle} Date - {formatDate(invoice?.invoiceDate)}</span>
                            <span style={{ marginRight: '12px' }}>Invoice No. - {invoice?.invoiceNo || 'N/A'}</span>
                        </div>
                        <div
                            style={{
                                width: '100%',
                                height: 0.76,
                                left: 31.77,
                                marginTop: '1px',
                                background: 'var(--White-Stroke, #EAEAEA)',
                            }}
                        />
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-around', marginTop: '2px', alignItems: 'center', borderBottom: '1px solid #EAEAEA' }}>
                            <div style={{ borderRight: '1px solid #EAEAEA', width: '50%', textAlign: 'center' }}>
                                <span>{companyInfo.fromTitle}</span>
                            </div>
                            <div style={{ width: '50%', textAlign: 'center' }}>
                                <span>{companyInfo.toTitle}</span>
                            </div>
                        </div>
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-around', marginTop: '2px', alignItems: 'center', borderBottom: '1px solid #EAEAEA' }}>
                            <div style={{ borderRight: '1px solid #EAEAEA', width: '50%', padding: '3px' }}>
                                <div>Name : <span style={{ color: 'black', fontWeight: '600' }}>{companyInfo.fromName}</span></div>
                                <div>Address : {companyInfo.fromAddress}</div>
                                <div style={{ marginTop: '8px' }}>Phone : {companyInfo.fromPhone}</div>
                                <div>Email : {companyInfo.fromEmail}</div>
                                <div>GSTIN : {companyInfo.fromGSTIN}</div>
                            </div>
                            <div style={{ width: '50%', padding: '3px' }}>
                                <div>Name : <span style={{ color: 'black', fontWeight: '600' }}>{companyInfo.toName}</span></div>
                                <div>Address : {companyInfo.toAddress} </div>
                                <div style={{ marginTop: '8px' }}>Phone :  {companyInfo.toPhone}</div>
                                <div>Email : {companyInfo.toEmail}</div>
                                <div>GSTIN :  {companyInfo.toGSTIN}</div>
                            </div>
                        </div>
                        <div className='table-responsive mt-3' >
                            <table className='' style={{ width: '100%', border: '1px solid #EAEAEA', borderCollapse: 'collapse' }}>
                                <thead style={{ textAlign: 'center', }}>
                                    <tr>
                                        <th style={{ borderRight: '1px solid #EAEAEA', borderBottom: '1px solid #EAEAEA', color: "black" }} rowSpan='2'>Sr No.</th>
                                        <th style={{ borderRight: '1px solid #EAEAEA', borderBottom: '1px solid #EAEAEA', color: "black" }} rowSpan='2'>Name of the Products</th>
                                        <th style={{ borderRight: '1px solid #EAEAEA', borderBottom: '1px solid #EAEAEA', color: "black" }} rowSpan='2'>HSN</th>
                                        <th style={{ borderRight: '1px solid #EAEAEA', borderBottom: '1px solid #EAEAEA', color: "black" }} rowSpan='2'>Lot No.</th>
                                        <th style={{ borderRight: '1px solid #EAEAEA', borderBottom: '1px solid #EAEAEA', color: "black" }} rowSpan='2'>QTY</th>
                                        <th style={{ borderRight: '1px solid #EAEAEA', borderBottom: '1px solid #EAEAEA', color: "black" }} rowSpan='2'>Rate</th>
                                        <th style={{ borderRight: '1px solid #EAEAEA', borderBottom: '1px solid #EAEAEA', color: "black" }} colSpan="2">Tax</th>
                                        <th style={{ borderRight: '1px solid #EAEAEA', borderBottom: '1px solid #EAEAEA', color: "black" }} rowSpan='2'>Total</th>
                                    </tr>
                                    <tr>
                                        <th style={{ borderRight: '1px solid #EAEAEA', borderBottom: '1px solid #EAEAEA', color: "black" }}>%</th>
                                        <th style={{ borderRight: '1px solid #EAEAEA', borderBottom: '1px solid #EAEAEA', color: "black" }}>₹</th>
                                    </tr>
                                </thead>
                                <tbody style={{ textAlign: "center" }}>
                                    {invoiceItems.map((item, index) => (
                                        <tr key={index}>
                                            <td style={{ borderRight: '1px solid #EAEAEA', height: '30px' }}>{index + 1}</td>
                                            {/* <td style={{ borderRight: '1px solid #EAEAEA', }}>{item.itemName || item.name || 'N/A'}</td> */}
                                            <td style={{ borderRight: '1px solid #EAEAEA', }}>
                                                <div style={{ fontWeight: "500", marginBottom: "4px" }}>
                                                    {item.itemName}
                                                </div>
                                                {item.selectedSerialNos && item.selectedSerialNos.length > 0 && (
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            flexDirection: "column",
                                                            fontSize: "11px",
                                                            color: "#666",
                                                            fontStyle: "italic",
                                                            marginTop: "4px",
                                                            lineHeight: "1.4",
                                                        }}
                                                    >
                                                        <div style={{ fontWeight: "500", marginBottom: "2px" }}>
                                                            Serial Nos:
                                                        </div>

                                                        {item.selectedSerialNos.map((sn, index) => (
                                                            <div key={index}>• {sn}</div>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ borderRight: '1px solid #EAEAEA', }}>{item.hsnCode || item.hsn || '-'}</td>
                                            <td style={{ borderRight: '1px solid #EAEAEA', }}>{item.lotNumber || '-'}</td>
                                            <td style={{ borderRight: '1px solid #EAEAEA', }}>{item.qty || 0}</td>
                                            <td style={{ borderRight: '1px solid #EAEAEA', }}>{formatCurrency(item.unitPrice)}</td>
                                            <td style={{ borderRight: '1px solid #EAEAEA', }}>{item.taxRate || 0}%</td>
                                            <td style={{ borderRight: '1px solid #EAEAEA', }}>{formatCurrency(item.taxAmount)}</td>
                                            <td style={{ borderRight: '1px solid #EAEAEA', }}>{formatCurrency(item.amount)}</td>
                                        </tr>
                                    ))}
                                    {/* Fill remaining rows for consistent layout */}
                                    {Array.from({ length: Math.max(0, 8 - invoiceItems.length) }).map((_, idx) => (
                                        <tr key={`empty-${idx}`}>
                                            <td style={{ borderRight: '1px solid #EAEAEA', height: '30px' }}></td>
                                            <td style={{ borderRight: '1px solid #EAEAEA' }}></td>
                                            <td style={{ borderRight: '1px solid #EAEAEA' }}></td>
                                            <td style={{ borderRight: '1px solid #EAEAEA' }}></td>
                                            <td style={{ borderRight: '1px solid #EAEAEA' }}></td>
                                            <td style={{ borderRight: '1px solid #EAEAEA' }}></td>
                                            <td style={{ borderRight: '1px solid #EAEAEA' }}></td>
                                            <td style={{ borderRight: '1px solid #EAEAEA' }}></td>
                                        </tr>
                                    ))}

                                </tbody>
                            </table>
                        </div>
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-around', marginTop: '15px', borderTop: '1px solid #EAEAEA', borderBottom: '1px solid #EAEAEA', }}>
                            <div style={{ borderRight: '', width: '50%', padding: '3px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <u style={{ color: "black" }}>Total in words</u>
                                <div style={{ marginTop: '5px', fontWeight: '600', fontSize: '12px' }}>{totalInWords}</div>
                                {/* <div
                                    style={{
                                        width: '100%',
                                        height: 0.76,
                                        left: 31.77,
                                        background: 'var(--White-Stroke, #EAEAEA)',
                                        marginTop: '10px'
                                    }}
                                /> */}
                                {/* <div style={{ marginTop: '2px', textDecoration: 'underline' }}>Bank Details</div>
                                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '0px 5px' }}>
                                    <div style={{ textAlign: 'left' }}>
                                        <div>Bank : <span style={{ color: 'black', fontWeight: '600' }}>{bankDetails?.bankName || 'N/A'}</span></div>
                                        <div>Branch : <span style={{ color: 'black', fontWeight: '600' }}>{bankDetails?.branch || 'N/A'}</span></div>
                                        <div>Account Holder : <span style={{ color: 'black', fontWeight: '600' }}>{bankDetails?.accountHolderName || 'N/A'}</span></div>
                                        <div>Account No.: <span style={{ color: 'black', fontWeight: '600' }}>{bankDetails?.accountNumber || 'N/A'}</span></div>
                                        <div>IFSC : <span style={{ color: 'black', fontWeight: '600' }}>{bankDetails?.ifsc || 'N/A'}</span></div>
                                        <div>UPI : <span style={{ color: 'black', fontWeight: '600' }}>{bankDetails?.upiId || 'N/A'}</span></div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                        <div style={{ width: '45px', objectFit: 'contain' }}>
                                            <img src={bankDetails?.qrCode || Qrcode} alt='QR Code' style={{ width: '100%' }} />
                                        </div>
                                        <div>Pay Using UPI</div>
                                    </div>
                                </div> */}
                            </div>

                            <div style={{ width: '50%', padding: '3px', borderLeft: '1px solid #EAEAEA' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #EAEAEA', padding: '1px 8px' }}>
                                    <span style={{ color: "black" }}>Sub-total</span>
                                    <span style={{ color: 'black', }}>{formatCurrency(invoice?.subtotal)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #EAEAEA', padding: '1px 8px' }}>
                                    <span style={{ color: "black" }}>Tax Amount</span>
                                    <span style={{ color: 'black', }}>{formatCurrency(invoice?.totalTax)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #EAEAEA', padding: '2px 8px' }}>
                                    <span style={{ color: "black" }}>Discount</span>
                                    <span style={{ color: 'black', }}>{formatCurrency(invoice?.totalDiscount)}</span>
                                </div>
                                {type === "sales" && invoice?.shoppingPointsUsed > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #EAEAEA', padding: '2px 8px' }}>
                                        <span style={{ color: "black" }}>🪙 Shopping Points</span>
                                        <span style={{ color: 'black', }}>{formatCurrency(invoice?.shoppingPointsUsed || 0)}</span>
                                    </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #EAEAEA', padding: '2px 8px' }}>
                                    <span style={{ color: "black" }}>Additional Charges</span>
                                    <span style={{ color: 'black', }}>{formatCurrency(invoice?.additionalCharges)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #EAEAEA', padding: '1px 8px', }}>
                                    <span style={{ color: "black", fontWeight: '700', fontSize: '10px' }}>Total</span>
                                    <span style={{ color: 'black', fontWeight: '600', fontSize: '10px' }}>{formatCurrency(invoice?.grandTotal)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 8px' }}>
                                    <span style={{ color: "black" }}>Due Amount</span>
                                    <span style={{ color: invoice?.dueAmount > 0 ? 'red' : 'black', fontWeight: invoice?.dueAmount > 0 ? '600' : '400' }}>
                                        {formatCurrency(invoice?.dueAmount)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-around', borderBottom: '1px solid #EAEAEA', }}>
                            <div style={{ borderRight: '', width: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <u style={{ color: "black" }}>Term & Conditions</u>
                                <div style={{ marginTop: '5px', fontSize: '10px' }}>{terms?.termsText || 'No terms and conditions set.'}</div>
                            </div>

                            {/* <div style={{ width: '50%', borderLeft: '1px solid #EAEAEA' }}>
                                <div style={{ display: 'flex', justifyContent: 'center', borderTop: '1px solid #EAEAEA', padding: '1px 8px', marginTop: '60px' }}>
                                    <span style={{ fontWeight: '500', fontSize: '10px', }}>Signature</span>
                                </div>
                            </div> */}
                            <div style={{ width: '50%', borderLeft: '1px solid #EAEAEA' }}>
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    borderTop: '1px solid #EAEAEA', 
    padding: '1px 8px', 
    marginTop: '60px' 
  }}>
    {signatureUrl ? (
      <div style={{ textAlign: 'center' }}>
        <img 
          src={signatureUrl} 
          alt="Signature" 
          style={{ 
            width: '100px', 
            height: '50px', 
            objectFit: 'contain',
            marginBottom: '5px'
          }} 
        />
        <span style={{ fontWeight: '500', fontSize: '10px' }}>Authorized Signature</span>
      </div>
    ) : (
      <span style={{ fontWeight: '500', fontSize: '10px' }}>Signature</span>
    )}
  </div>
</div>
                        </div>
                        <div style={{ width: '100%', justifyContent: 'center', display: 'flex' }}>
                            <span style={{ marginTop: '5px', fontSize: '10px' }}>
                                Earned 🪙 Shopping Point on this purchase. Redeem on your next purchase.
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default RecentViewInvoiceModal;