//packages
import React, { useEffect, useRef, useState } from 'react'
import { Country, State, City } from "country-state-city";
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AddCustomers from "../../pages/Modal/customerModals/AddCustomerModal";
//host
import BASE_URL from "../../pages/config/config";
import axios from "axios";
//icons
import { IoSearch } from "react-icons/io5";
import { SlHandbag, SlBag } from "react-icons/sl";
import { GoPersonAdd } from "react-icons/go";
import { RiDeleteBinLine, RiArrowUpWideLine, RiArrowDownWideLine } from "react-icons/ri";
import { BsPersonSquare } from "react-icons/bs";
import { FaRegHandPaper } from "react-icons/fa";
import { LuScanLine } from "react-icons/lu";
import { AiOutlineTransaction, AiOutlineRetweet } from "react-icons/ai";
import { CgSortAz } from "react-icons/cg";
import { TbArrowsSort, TbCircleCheckFilled, TbSearch } from "react-icons/tb";
import { IoIosSearch, IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { MdPrint } from "react-icons/md";
import { AiOutlineDownload } from "react-icons/ai";
import { IoMdAdd } from "react-icons/io";
import { PiBagThin, PiShoppingBagThin } from "react-icons/pi";
//images
import PaymentDone from '../../assets/img/payment-done.png';
import Upi from '../../assets/img/upi.png';
import Banks from '../../assets/img/banks.png';
import NoImage from '../../assets/img/products/no_image.png';
import BagSmall from '../../assets/images/bag-small.png';
import Bag10Kg from '../../assets/images/bag-10-kg.png';
import Bag20Kg from '../../assets/images/bag-20-kg.png';
// import NoImages from '../../assets/img/icons/no-image.png';
import { FaHandPaper } from "react-icons/fa";
import { GrPowerReset } from "react-icons/gr";
import { FaExchangeAlt } from "react-icons/fa";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import barcodeDetector from '../../utils/barcodeDetector';
import api from "../../pages/config/axiosInstance"
import { useAuth } from '../../components/auth/AuthContext';
import { IoMdAddCircle } from "react-icons/io";
import { MdKeyboardDoubleArrowRight } from "react-icons/md";
import tick from "../../assets/images/tick.png";
import { RiImageAddFill } from "react-icons/ri";

//New Redesign-----------------------------------------------------------------------------------------------
import { Link } from 'react-router-dom';

import { RiLogoutBoxRLine } from "react-icons/ri";
import { SlCalculator } from "react-icons/sl";
import { CgFileDocument } from "react-icons/cg";
import { FaPause } from "react-icons/fa6";
import { CiBarcode, CiDiscount1 } from "react-icons/ci";
import { MdOutlineSort } from "react-icons/md";

import CompanyLogo from '../../assets/images/kasper-logo.png';
import Banner from '../../assets/images/banner.png';
import All from '../../assets/images/All.png';
import Shirt from '../../assets/images/Shirt.png';
import Cap from '../../assets/images/Cap.png';
import DenimShorts from '../../assets/images/Denim-Shorts.png';
import Jeans from '../../assets/images/Jeans.png';
import Clothes from '../../assets/images/Clothes.png';
import Jersey from '../../assets/images/Jersey.png';
import Kimono from '../../assets/images/Kimono.png';
import Sari from '../../assets/images/Sari.png';
import Trainers from '../../assets/images/Trainers.png';
import Dress from '../../assets/images/Dress.png';
import Shocks from '../../assets/images/Shocks.png';
import WomensBlouse from '../../assets/images/Womens-Blouse.png';
import Sweater from '../../assets/images/Sweater.png';

import EmptyBag from '../../assets/images/shoppingbag.png';

import Greenhoody from '../../assets/images/Greenhoody.png';
import Twoshirts from '../../assets/images/Twoshirts.png';
import Threepiece from '../../assets/images/Threepiece.png';
import Fullhoody from '../../assets/images/Fullhoody.png';
import Whitetshirt from '../../assets/images/Whitetshirt.png';
import Parashuthoody from '../../assets/images/Parashuthoody.png';
import Planetshirt from '../../assets/images/Planetshirt.png';
import SareeL from '../../assets/images/SareeL.png';
import Boytshirt from '../../assets/images/Boytshirt.png';
import Shoen from '../../assets/images/Shoen.png';
import SareeG from '../../assets/images/SareeG.png';
import Coat from '../../assets/images/Coat.png';
import deletebtn from "../../assets/images/delete.png";

const Pos = () => {
  const { user } = useAuth();
  const [isPressed, setIsPressed] = useState(false);
  const [pressedButtonId, setPressedButtonId] = useState(null);

  const [companyImages, setCompanyImages] = useState(null)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [applycoinpopup, setApplycoinpopup] = useState(false);
  const [pointsToApply, setPointsToApply] = useState('');
  const [applyFull, setApplyFull] = useState(false);
  const [appliedPoints, setAppliedPoints] = useState(0);
  const [proceedToPay, setProceedToPay] = useState(false);
  const [showPriceBreakup, setShowPriceBreakup] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [files, setFiles] = useState([]);
  const fileSelectRef = useRef(null);

  useEffect(() => {
    return () => {
      files.forEach(f => URL.revokeObjectURL(f.preview));
    };
  }, [files]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  useEffect(() => {
    const fetchCompanyDetails = async () => {
      // const token = localStorage.getItem("token");
      try {
        const res = await api.get('/api/companyprofile/get')
        if (res.status === 200) {
          setCompanyImages(res.data.data)
        }
      } catch (error) {
        // console.error("API fetch error:", error.response ? error.response.data : error.message);
        toast.error("Unable to find company details", {
          position: 'top-center'
        })
      }
    }
    fetchCompanyDetails();
  }, []);

  const baseStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer',
    gap: '0px',
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '15px 12px',
    border: '1px solid #E6E6E6',
    color: '#888787ff',
    userSelect: 'none', // Prevents text selection on click-and-drag
    transition: 'transform 0.1s ease, filter 0.1s ease', // Smooth transition for the effect
  };

  const pressedStyle = {
    transform: 'scale(0.97)',    // Shrinks the button slightly
    filter: 'brightness(0.9)', // Dims the button a little
  };

  const [isPressed2, setIsPressed2] = useState(false);
  const [pressedButtonId2, setPressedButtonId2] = useState(null);

  const baseStyle2 = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer',
    gap: '0px',
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '15px 12px',
    border: '1px solid #E6E6E6',
    color: '#888787ff',
    userSelect: 'none', // Prevents text selection on click-and-drag
    transition: 'transform 0.1s ease, filter 0.1s ease', // Smooth transition for the effect
  };

  const pressedStyle2 = {
    transform: 'scale(0.97)',    // Shrinks the button slightly
    filter: 'brightness(0.9)', // Dims the button a little
  };

  const [isPressed3, setIsPressed3] = useState(false);
  const [pressedButtonId3, setPressedButtonId3] = useState(null);

  const baseStyle3 = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer',
    gap: '0px',
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '15px 12px',
    border: '1px solid #E6E6E6',
    color: '#888787ff',
    userSelect: 'none', // Prevents text selection on click-and-drag
    transition: 'transform 0.1s ease, filter 0.1s ease', // Smooth transition for the effect
  };

  const pressedStyle3 = {
    transform: 'scale(0.97)',    // Shrinks the button slightly
    filter: 'brightness(0.9)', // Dims the button a little
  };

  const userObj = user;
  const userId = userObj?.id || userObj?._id; // Handle both id and _id
  // const token = localStorage.getItem("token");

  const [searchdrop, setSearchDrop] = useState(false);
  const handleSearchDropChange = () => {
    setSearchDrop(true);
  }

  const [categoryValue, setCategoryValue] = useState('');
  const handleCategoryChange = (e) => {
    // console.log('📂 handleCategoryChange called with:', e.target.value);
    setCategoryValue(e.target.value);
    // Capitalize the status value to match database enum
    const capitalizedValue = e.target.value ? e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1) : '';
    const statusFilter = activeQuickFilter === 'all' ? capitalizedValue : (activeQuickFilter.charAt(0).toUpperCase() + activeQuickFilter.slice(1));
    // console.log('📊 Category status filter:', statusFilter);
    fetchPosSales(1, transactionSearchQuery, statusFilter, socketValue);
  };

  const [socketValue, setSocketValue] = useState('');
  const handleSocketChange = (e) => {
    // console.log('🔌 handleSocketChange called with:', e.target.value);
    setSocketValue(e.target.value);
    // Capitalize the status filter to match database enum
    const statusFilter = activeQuickFilter === 'all' ?
      (categoryValue ? categoryValue.charAt(0).toUpperCase() + categoryValue.slice(1) : '') :
      (activeQuickFilter.charAt(0).toUpperCase() + activeQuickFilter.slice(1));
    // Capitalize payment method value to match database enum (special case for UPI)
    const capitalizedPaymentMethod = e.target.value ?
      (e.target.value.toLowerCase() === 'upi' ? 'UPI' : e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1)) : '';
    // console.log('📊 Socket status filter:', statusFilter);
    // console.log('💳 Payment method filter:', capitalizedPaymentMethod);
    fetchPosSales(1, transactionSearchQuery, statusFilter, capitalizedPaymentMethod);
  };

  const [warehouseValue, setWarehouseValue] = useState('');
  const handleWarehouseChange = (e) => {
    setWarehouseValue(e.target.value);
  };

  const [exprationValue, setExprationValue] = useState('');
  const handleExprationChange = (e) => {
    setExprationValue(e.target.value);
  };

  // Quick filter state
  const [activeQuickFilter, setActiveQuickFilter] = useState('all');

  const handleClear = () => {
    setSearchDrop(false);
    setCategoryValue('');
    setSocketValue('');
    setWarehouseValue('');
    setExprationValue('');
    setActiveQuickFilter('all');
    fetchPosSales(1, transactionSearchQuery, '', '');
  };

  // Quick filter handlers
  const handleQuickFilter = (filterType) => {
    // console.log('🎯 handleQuickFilter called with:', filterType);
    setActiveQuickFilter(filterType);
    // Capitalize the first letter to match database enum values
    const statusFilter = filterType === 'all' ? '' : filterType.charAt(0).toUpperCase() + filterType.slice(1);
    // console.log('📊 Status filter set to:', statusFilter);
    // console.log('🔌 Socket value:', socketValue);
    fetchPosSales(1, transactionSearchQuery, statusFilter, socketValue);
  };

  //bag popup-------------------------------------------------------------------------------------------------------------------
  const [bagpopup, setBagPopup] = useState(false);
  const BagRef = useRef(null);
  const handleBagPopupChange = () => {
    setBagPopup(!bagpopup);
  }
  const closeBag = () => {
    setBagPopup(false);
  };
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (BagRef.current && !BagRef.current.contains(event.target)) {
        closeBag();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Add Bag popup-------------------------------------------------------------------------------------------------------------
  const [addbagpopup, setAddBagPopup] = useState(false);
  const addBagRef = useRef(null);

  // Bag Management Logic
  const [bags, setBags] = useState([]);
  const [newBagName, setNewBagName] = useState('');
  const [newBagPrice, setNewBagPrice] = useState('');
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedBagsToDelete, setSelectedBagsToDelete] = useState([]);

  const fetchBags = async () => {
    try {
      const res = await api.get('/api/bags/get');
      if (res.data && res.data.data) {
        setBags(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching bags:", error);
      // toast.error("Failed to fetch bags");
    }
  };

  useEffect(() => {
    if (bagpopup) {
      fetchBags();
    }
  }, [bagpopup]);

  const handleSaveBag = async (e) => {
    e.preventDefault();
    if (!newBagName || !newBagPrice) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', newBagName);
      formData.append('price', newBagPrice);
      if (files.length > 0) {
        formData.append('image', files[0]);
      }

      const res = await api.post('/api/bags/add', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.status === 201) {
        toast.success("Bag added successfully");
        setNewBagName('');
        setNewBagPrice('');
        setFiles([]);
        setAddBagPopup(false);
        setBagPopup(true); // Re-open bag list
        fetchBags(); // Refresh list
      }
    } catch (error) {
      console.error("Error adding bag:", error);
      toast.error("Failed to add bag");
    }
  };

  const handleToggleDeleteMode = () => {
    setIsDeleteMode(!isDeleteMode);
    setSelectedBagsToDelete([]);
  };

  const handleSelectBagToDelete = (bagId) => {
    if (selectedBagsToDelete.includes(bagId)) {
      setSelectedBagsToDelete(selectedBagsToDelete.filter(id => id !== bagId));
    } else {
      setSelectedBagsToDelete([...selectedBagsToDelete, bagId]);
    }
  };

  const handleDeleteSelectedBags = async () => {
    if (selectedBagsToDelete.length === 0) return;

    try {
      const res = await api.post('/api/bags/delete', { ids: selectedBagsToDelete });
      if (res.status === 200) {
        toast.success("Bags deleted successfully");
        fetchBags();
        setIsDeleteMode(false);
        setSelectedBagsToDelete([]);
      }
    } catch (error) {
      console.error("Error deleting bags:", error);
      toast.error("Failed to delete bags");
    }
  };

  const handleAddBagPopupChange = () => {
    setAddBagPopup(!addbagpopup);
    setBagPopup(false);
  }
  const closeAddBagForm = () => {
    setAddBagPopup(false);
    setFiles('');
  };
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (addBagRef.current && !addBagRef.current.contains(event.target)) {
        closeAddBagForm();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  //customer popup-------------------------------------------------------------------------------------------------------------
  const [popup, setPopup] = useState(false);
  const formRef = useRef(null);
  const handlePopupChange = () => {
    setPopup(!popup);
  }
  const closeForm = () => {
    setPopup(false);
  };
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (formRef.current && !formRef.current.contains(event.target)) {
        closeForm();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Customer Model------------------------------------------------------------------------------------------------------------

  const [openAddModal, setOpenAddModal] = useState(false);

  //cash popup------------------------------------------------------------------------------------------------------------------
  const [cashpopup, setCashPopup] = useState(false);
  const CashRef = useRef(null);
  const handleCashPopupChange = () => {
    if (!selectedCustomer) {
      toast.error('Please select a customer first');
      return;
    }
    if (selectedItems.length === 0) {
      toast.error('Please select at least one product');
      return;
    }
    setCashPopup(!cashpopup);
  }
  const closeCash = () => {
    setCashPopup(false);
  };
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (CashRef.current && !CashRef.current.contains(event.target)) {
        closeCash();
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "F1") {
        event.preventDefault();
        setCashPopup((prev) => !prev);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  //card popup-----------------------------------------------------------------------------------------------------------------------
  const [cardpopup, setCardPopup] = useState(false);
  const CardRef = useRef(null);
  const handleCardPopupChange = () => {
    if (!selectedCustomer) {
      toast.error('Please select a customer first');
      return;
    }
    if (selectedItems.length === 0) {
      toast.error('Please select at least one product');
      return;
    }
    setCardPopup(!cardpopup);
  }
  const closeCard = () => {
    setCardPopup(false);
    // Reset card form when closing
    setCardNumber('');
    setCardHolderName('');
    setValidTill('');
    setCvv('');
  };

  // Card form state variables
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  const [validTill, setValidTill] = useState('');
  const [cvv, setCvv] = useState('');

  // Card validation functions
  const handleCardNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length <= 16) {
      setCardNumber(value);
    }
  };

  const handleCardHolderNameChange = (e) => {
    const value = e.target.value.replace(/[^a-zA-Z\s]/g, ''); // Only letters and spaces
    setCardHolderName(value);
  };

  const handleValidTillChange = (e) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits

    if (value.length >= 2) {
      const month = value.substring(0, 2);
      const year = value.substring(2, 4);

      // Validate month (01-12)
      if (parseInt(month) > 12 || parseInt(month) < 1) {
        return; // Don't update if invalid month
      }

      value = month + (year ? '/' + year : '');
    }

    if (value.length <= 5) { // MM/YY format
      setValidTill(value);
    }
  };

  const handleCvvChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length <= 3) {
      setCvv(value);
    }
  };
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (CardRef.current && !CardRef.current.contains(event.target)) {
        closeCard();
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "F2") {
        event.preventDefault();
        setCardPopup((prev) => !prev);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  //upi popup--------------------------------------------------------------------------------------------------------------------------
  const [upipopup, setUpiPopup] = useState(false);
  const UpiRef = useRef(null);
  const handleUpiPopupChange = () => {
    if (!selectedCustomer) {
      toast.error('Please select a customer first');
      return;
    }
    if (selectedItems.length === 0) {
      toast.error('Please select at least one product');
      return;
    }
    setUpiPopup(!upipopup);
  }
  const closeUpi = () => {
    setUpiPopup(false);
  };
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (UpiRef.current && !UpiRef.current.contains(event.target)) {
        closeUpi();
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "F3") {
        event.preventDefault();
        setUpiPopup((prev) => !prev);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Selected payment method state for highlighting
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);

  //transaction popup---------------------------------------------------------------------------------------------------------------
  const [transactionpopup, setTransactionPopup] = useState(false);
  const TransactionRef = useRef(null);
  const handleTransactionPopupChange = () => {
    setTransactionPopup(!transactionpopup);
  }
  const closeTransaction = () => {
    setTransactionPopup(false);
  };

  const handlePopupClose = () => {
    setTransactionPopup(false); // open popup
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (TransactionRef.current && !TransactionRef.current.contains(event.target)) {
        closeTransaction();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  //add customer popup--------------------------------------------------------------------------------------------------------------
  const [addcustomerpopup, setAddCustomerPopup] = useState(false);
  const AddCustomerRef = useRef(null);
  const handleAddCustomerPopupChange = () => {
    setAddCustomerPopup(!addcustomerpopup);
  }
  const closeAddCustomer = () => {
    setAddCustomerPopup(false);
  };
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (AddCustomerRef.current && !AddCustomerRef.current.contains(event.target)) {
        closeAddCustomer();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  //discount popup--------------------------------------------------------------------------------------------------------------------
  const [discountpopup, setDiscountPopup] = useState(false);
  const [selectedItemForDiscount, setSelectedItemForDiscount] = useState(null);
  const [discountQuantity, setDiscountQuantity] = useState(1);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [discountFixed, setDiscountFixed] = useState(0);
  const [discountType, setDiscountType] = useState('Fixed');

  const DiscountRef = useRef(null);
  const handleProductDiscountClick = (item) => {
    // setSelectedItemForDiscount(item);
    const product = products.find(p => p._id === item._id); // Find the product in the products array
    setSelectedItemForDiscount({
      ...item,
      availableQuantity: product ? product.quantity : 0, // Store the available quantity
    });
    setDiscountQuantity(item.quantity);
    setDiscountPercentage(item.discountType === 'Percentage' ? item.discountValue : 0);
    setDiscountFixed(item.discountType === 'Fixed' ? item.discountValue : 0);
    setDiscountType(item.discountType || 'Fixed');
    setDiscountPopup(true);
  }
  const closeDiscount = () => {
    setDiscountPopup(false);
    setSelectedItemForDiscount(null);
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity > 0) {
      setDiscountQuantity(newQuantity);
    }
  };

  const handleDiscountPercentageChange = (value) => {
    setDiscountPercentage(Number(value) || 0);
    setDiscountType('Percentage');
  };

  const handleDiscountFixedChange = (value) => {
    setDiscountFixed(Number(value) || 0);
    setDiscountType('Fixed');
  };

  const applyDiscountChanges = () => {
    if (selectedItemForDiscount) {
      const updatedItems = selectedItems.map(item =>
        item._id === selectedItemForDiscount._id
          ? {
            ...item,
            quantity: discountQuantity,
            discountAmount: discountType === 'Percentage' ? discountPercentage : discountFixed,
            discountType: discountType,
            totalPrice: discountQuantity * item.sellingPrice,
            totalTax: (item.tax * discountQuantity * item.sellingPrice) / 100,
            totalDiscount: discountType === 'Percentage'
              ? (discountQuantity * item.sellingPrice * discountPercentage) / 100
              : discountFixed * discountQuantity
          }
          : item
      );
      setSelectedItems(updatedItems);
      closeDiscount();
    }
  };
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (DiscountRef.current && !DiscountRef.current.contains(event.target)) {
        closeDiscount();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    }
  }, []);

  // Function to calculate discounted price
  const calculateDiscountedPrice = (product) => {
    // First check if product itself has discount properties
    if (product.discountAmount && product.discountAmount > 0) {
      if (product.discountType === 'Percentage') {
        // Calculate percentage discount from product data
        const discountAmount = (product.sellingPrice * product.discountAmount) / 100;
        return product.sellingPrice - discountAmount;
      } else if (product.discountType === 'Fixed') {
        // Calculate fixed discount from product data
        return product.sellingPrice - product.discountAmount;
      }
    }

    // If no product discount, check if product has discount applied in cart
    const cartItem = selectedItems.find(item => item._id === product._id);

    if (cartItem && cartItem.discountValue && cartItem.discountValue > 0) {
      if (cartItem.discountType === 'Percentage') {
        // Calculate percentage discount
        const discountAmount = (product.sellingPrice * cartItem.discountValue) / 100;
        return product.sellingPrice - discountAmount;
      } else if (cartItem.discountType === 'Fixed') {
        // Calculate fixed discount
        return product.sellingPrice - cartItem.discountValue;
      }
    }

    // Return original price if no discount
    return product.sellingPrice;
  };

  // Function to calculate total price after discount for cart items
  const calculateDiscountedTotalPrice = (item) => {
    if (item.discountValue && item.discountValue > 0) {
      if (item.discountType === 'Percentage') {
        // Calculate percentage discount
        const discountAmount = (item.sellingPrice * item.discountValue) / 100;
        const discountedPrice = item.sellingPrice - discountAmount;
        return item.quantity * discountedPrice;
      } else if (item.discountType === 'Fixed') {
        // Calculate fixed discount per unit
        const discountedPrice = item.sellingPrice - item.discountValue;
        return item.quantity * discountedPrice;
      }
    }

    // Return original total price if no discount
    return item.quantity * item.sellingPrice;
  };

  // Function to calculate tax on discounted price
  const calculateDiscountedTax = (item) => {
    if (item.discountValue && item.discountValue > 0) {
      if (item.discountType === 'Percentage') {
        // Calculate percentage discount
        const discountAmount = (item.sellingPrice * item.discountValue) / 100;
        const discountedPrice = item.sellingPrice - discountAmount;
        return (discountedPrice * item.tax * item.quantity) / 100;
      } else if (item.discountType === 'Fixed') {
        // Calculate fixed discount per unit
        const discountedPrice = item.sellingPrice - item.discountValue;
        return (discountedPrice * item.tax * item.quantity) / 100;
      }
    }

    // Return original tax calculation if no discount
    return (item.sellingPrice * item.tax * item.quantity) / 100;
  };

  //payment done popup-------------------------------------------------------------------------------------------------------
  const [paymentpopup, setPaymentPopup] = useState(false);
  const PaymentRef = useRef(null);
  const handlePaymentPopupChange = () => {
    setPaymentPopup(!paymentpopup);
  }
  const closePayment = () => {
    setPaymentPopup(false);
  };
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (PaymentRef.current && !PaymentRef.current.contains(event.target)) {
        closePayment();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    }
  }, []);

  //fetch products details---------------------------------------------------------------------------------------------------------
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]); // Store all products for filtering
  const [activeTabs, setActiveTabs] = useState({});

  // Search functionality

  const [productSearchQuery, setProductSearchQuery] = useState('')
  const [lowHighSortActive, setLowHighSortActive] = useState(false)
  const [preSortProductsSnapshot, setPreSortProductsSnapshot] = useState([])
  const [selectedSortMode, setSelectedSortMode] = useState(null) // 'price' | 'date' | null

  const [barcodeInput, setBarcodeInput] = useState('');
  const barcodeInputRef = React.useRef(null);

  // Highlight scanned product in product list briefly
  const [highlightedProductId, setHighlightedProductId] = useState(null);
  const highlightTimerRef = useRef(null);

  // Global keyboard scanner buffer (for hardware scanners that act like keyboards)
  const scannerBufferRef = React.useRef([]); // array of {char, time}
  const scannerClearTimerRef = React.useRef(null);
  // Per-code cooldown map to avoid repeated requests for same normalized barcode
  const lastScanMapRef = React.useRef(new Map());
  // Track in-flight lookups to avoid concurrent network requests for the same code
  const inFlightRef = React.useRef(new Set());

  useEffect(() => {
    const onKeyDown = (e) => {
      try {
        const key = e.key;
        const now = Date.now();

        // Only consider printable single-character keys and Enter
        if (key === 'Enter') {
          const buf = scannerBufferRef.current;
          if (buf.length >= 2) {
            const duration = buf[buf.length - 1].time - buf[0].time;
            // Heuristic: treat as scanner if many chars typed quickly (fast duration)
            if (duration <= 1000) {
              const code = buf.map(x => x.char).join('');
              // Clear buffer before processing
              scannerBufferRef.current = [];
              if (barcodeInputRef.current) barcodeInputRef.current.focus();
              setBarcodeInput(code);
              lookupBarcodeAndAdd(code);
              e.preventDefault();
              return;
            }
          }
          // Not a fast buffered input — clear buffer and let Enter behave normally
          scannerBufferRef.current = [];
          return;
        }

        if (key && key.length === 1) {
          // push char into buffer
          scannerBufferRef.current.push({ char: key, time: now });

          // reset clear timer
          if (scannerClearTimerRef.current) clearTimeout(scannerClearTimerRef.current);
          scannerClearTimerRef.current = setTimeout(() => {
            scannerBufferRef.current = [];
          }, 1200);
        }
      } catch (err) {
        // console.error('scanner onKeyDown error', err);
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      if (scannerClearTimerRef.current) clearTimeout(scannerClearTimerRef.current);
    };
  }, []);

  // Camera barcode scanner state
  const videoRef = React.useRef(null);
  const fileInputRef = React.useRef(null);
  const [scanning, setScanning] = useState(false);
  const scanStreamRef = React.useRef(null);
  const detectorRef = React.useRef(null);

  const lookupBarcodeAndAdd = async (code, opts = { showToast: true }) => {
    if (!code) return false;
    // normalize code so small variations don't cause duplicate requests
    const normalize = (c) => String(c || '').replace(/\s+/g, ' ').trim().toUpperCase();
    const normCode = normalize(code);
    const COOLDOWN_MS = 1500;
    // per-code cooldown: ignore repeated quick scans for same normalized code
    const lastMap = lastScanMapRef.current;
    const lastTime = lastMap.get(normCode) || 0;
    if (Date.now() - lastTime < COOLDOWN_MS) {
      barcodeInputRef.current?.focus();
      return false;
    }
    // prevent concurrent lookups for the same normalized code
    if (inFlightRef.current.has(normCode)) return false;
    inFlightRef.current.add(normCode);
    try {
      // const token = localStorage.getItem('token');
      const res = await api.get(`/api/products/barcode/${encodeURIComponent(normCode)}`);
      if (res && res.data) {
        const prod = res.data;
        const frontendProduct = {
          _id: prod._id,
          productName: prod.productName,
          sellingPrice: Number(prod.sellingPrice) || 0,
          discountValue: Number(prod.discountAmount) || 0,
          tax: Number(prod.tax) || 0,
          images: prod.images || [],
          quantity: Number(prod.stockQuantity || 0),
          unit: prod.unit || 'pcs'
        };
        handleProductClick(frontendProduct);
        // show brief success with name and price (optional)
        try {
          if (opts && opts.showToast !== false) {
            const priceDisplay = prod.sellingPrice != null ? `₹${Number(prod.sellingPrice).toFixed(2)}` : '';
            // toast.success(`${prod.productName}${priceDisplay ? ' — ' + priceDisplay : ''}`);
          }
        } catch (e) { /* ignore */ }
        // highlight the product in the product grid and scroll to it
        try {
          setHighlightedProductId(prod._id);
          if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
          highlightTimerRef.current = setTimeout(() => setHighlightedProductId(null), 2500);
          const el = document.getElementById(`product-card-${prod._id}`);
          if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch (e) { /* ignore */ }

        // clear barcode input and keep focus so next scan/input is ready
        setBarcodeInput('');
        barcodeInputRef.current?.focus();
        // record last successful scan time for this normalized code
        lastMap.set(normCode, Date.now());
        return true;
      }
    } catch (err) {
      // console.error('Barcode lookup failed', err);
      toast.error('Product not found for scanned barcode');
      barcodeInputRef.current?.focus();
      return false;
    } finally {
      inFlightRef.current.delete(normCode);
    }
  };

  // Listen for global barcode found events (e.g., from the lookup modal) and add silently
  useEffect(() => {
    const handler = async (e) => {
      try {
        const prod = e.detail;
        const code = prod?.itemBarcode || prod?.barcode || prod?.productBarcode || null;
        if (code) {
          // call lookupBarcodeAndAdd but suppress the toast because the lookup modal already showed it
          await lookupBarcodeAndAdd(code, { showToast: false });
        }
      } catch (err) {
        // ignore
      }
    };
    window.addEventListener('barcode:found', handler);
    return () => window.removeEventListener('barcode:found', handler);
  }, []);

  // Fallback: decode barcode from an image file (mobile photo capture)
  const handleFileInput = async (e) => {
    try {
      const file = e?.target?.files?.[0];
      if (!file) return;
      const objectUrl = URL.createObjectURL(file);
      const img = document.createElement('img');
      img.src = objectUrl;
      await img.decode();

      // Use shared detector utility (tries native BarcodeDetector then ZXing fallback).
      const code = await barcodeDetector.detectFromImageElement(img);
      if (code) {
        const ok = await lookupBarcodeAndAdd(code);
        if (ok) {
          // give haptic feedback on supported devices
          if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(100);
          // close camera overlay if open
          try { stopScanner(); } catch (e) { /* ignore */ }
        }
      } else {
        toast.error('No barcode found in the selected image');
      }

      URL.revokeObjectURL(objectUrl);
      e.target.value = '';
    } catch (err) {
      // console.error('handleFileInput error', err);
      toast.error('Error processing image');
      if (e && e.target) e.target.value = '';
    }
  };

  const startScanner = async () => {
    try {
      if (!('mediaDevices' in navigator) || !navigator.mediaDevices.getUserMedia) {
        // Some mobile browsers (especially older iOS Safari) don't expose getUserMedia.
        // Offer the photo-capture fallback instead of failing.
        toast.info('Camera not available — please capture or select a photo to scan');
        fileInputRef.current?.click();
        return;
      }
      setScanning(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      scanStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Start unified video detector (native BarcodeDetector or ZXing fallback) from utility
      try {
        detectorRef.current = barcodeDetector.startVideoDetector(
          videoRef.current,
          async (code) => {
            try {
              const ok = await lookupBarcodeAndAdd(code);
              // give haptic feedback on supported devices
              if (ok && typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(100);
            } catch (err) {
              // console.error('Error handling detected code', err);
            } finally {
              // stop scanner and close camera overlay after handling
              stopScanner();
            }
          },
          { formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code'], intervalMs: 300 }
        );
      } catch (err) {
        // console.warn('video detector failed', err);
        toast.error('Barcode scanning is not supported in this browser.');
        stopScanner();
        return;
      }
    } catch (err) {
      // console.error('startScanner error', err);
      // If camera access fails (permissions / unsupported), fall back to image picker on mobile
      // console.warn('getUserMedia failed, falling back to image picker', err);
      toast.info('Unable to access camera — please capture or select a photo to scan');
      setScanning(false);
      // open file picker to allow user to capture a photo
      setTimeout(() => fileInputRef.current?.click(), 200);
    }
  };

  const stopScanner = () => {
    try {
      setScanning(false);
      if (scanStreamRef.current) {
        scanStreamRef.current.getTracks().forEach(t => t.stop());
        scanStreamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      }
      // Stop any running detector (supports both utility stop() and legacy zxingReader)
      if (detectorRef.current) {
        try {
          if (typeof detectorRef.current.stop === 'function') {
            detectorRef.current.stop();
          } else if (detectorRef.current.zxingReader && typeof detectorRef.current.zxingReader.reset === 'function') {
            detectorRef.current.zxingReader.reset();
          }
        } catch (e) {
          // console.warn('Error stopping detector', e);
        }
      }
      detectorRef.current = null;
    } catch (err) {
      // console.error('stopScanner error', err);
    }
  };

  const handleBarcodeSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const code = (barcodeInput || '').trim();
    if (!code) return;
    try {
      // Use centralized lookup to avoid duplicate add logic and respect cooldown
      const ok = await lookupBarcodeAndAdd(code);
      // clear input and keep focus regardless of success so scanner can continue
      setBarcodeInput('');
      barcodeInputRef.current?.focus();
      return ok;
    } catch (err) {
      // console.error('Barcode submit failed', err);
      setBarcodeInput('');
      barcodeInputRef.current?.focus();
    }
  };

  const [transactionSearchQuery, setTransactionSearchQuery] = useState('');

  // Helper function to check if a product is expired
  const isProductExpired = (product) => {
    const expiryArr = product.variants?.get?.('Expire') || product.variants?.['Expire'] || product.variants?.get?.('expire') || product.variants?.['expire'];
    if (!expiryArr || expiryArr.length === 0) return false;

    return expiryArr.some(dateStr => {
      // Handle multiple date formats: DD-MM-YYYY, D-M-YYYY, DD/MM/YYYY, etc.
      if (typeof dateStr === "string") {
        // Try DD-MM-YYYY or D-M-YYYY format
        const dateMatch = dateStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
        if (dateMatch) {
          const [, day, month, year] = dateMatch.map(Number);
          if (day && month && year && day <= 31 && month <= 12) {
            const expDate = new Date(year, month - 1, day);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            expDate.setHours(0, 0, 0, 0);

            if (!isNaN(expDate.getTime())) {
              return expDate < today; // Check if expired
            }
          }
        }
      }
      return false;
    });
  };

  // Product search functionality
  const handleProductSearch = (query) => {
    setProductSearchQuery(query);

    if (!query.trim()) {
      setProducts(allProducts);
      return;
    }

    const searchTerm = query.toLowerCase();
    const filteredProducts = allProducts.filter(product => {
      // First check if product is not expired, then apply search filters
      if (isProductExpired(product)) return false;

      return (
        product.productName?.toLowerCase().includes(searchTerm) ||
        product.itemBarcode?.toLowerCase().includes(searchTerm) ||
        product.barcode?.toLowerCase().includes(searchTerm) ||
        product.productBarcode?.toLowerCase().includes(searchTerm) ||
        product.description?.toLowerCase().includes(searchTerm) ||
        (product.brand && typeof product.brand === 'object' && product.brand.brandName?.toLowerCase().includes(searchTerm)) ||
        (product.brand && typeof product.brand === 'string' && product.brand.toLowerCase().includes(searchTerm)) ||
        product.seoTitle?.toLowerCase().includes(searchTerm) ||
        product.seoDescription?.toLowerCase().includes(searchTerm) ||
        (product.category && typeof product.category === 'object' && product.category.categoryName?.toLowerCase().includes(searchTerm)) ||
        (product.category && typeof product.category === 'string' && product.category.toLowerCase().includes(searchTerm)) ||
        (product.subcategory && typeof product.subcategory === 'object' && product.subcategory.subCategoryName?.toLowerCase().includes(searchTerm)) ||
        (product.subcategory && typeof product.subcategory === 'string' && product.subcategory.toLowerCase().includes(searchTerm))
      );
    });

    setProducts(filteredProducts);
  };

  const handleLowHighSortToggle = () => {
    if (!lowHighSortActive) {
      setPreSortProductsSnapshot(products);
      if (selectedSortMode === 'date') {
        const sortedAscDate = [...products].sort((a, b) => {
          const ad = new Date(a.createdAt || a.updatedAt || 0).getTime();
          const bd = new Date(b.createdAt || b.updatedAt || 0).getTime();
          return ad - bd; // Old -> New
        });
        setProducts(sortedAscDate);
      } else {
        const sortedAscPrice = [...products].sort((a, b) => Number(a.sellingPrice || 0) - Number(b.sellingPrice || 0));
        setProducts(sortedAscPrice);
      }
      setLowHighSortActive(true);
    } else {
      if (preSortProductsSnapshot && preSortProductsSnapshot.length > 0) {
        setProducts(preSortProductsSnapshot);
      } else {
        setProducts(allProducts);
      }
      setLowHighSortActive(false);
    }
  };

  const handleSortModeChange = (value) => {
    let mode = null;
    if (value === 'sortByPrice') mode = 'price';
    if (value === 'sortByDate') mode = 'date';
    setSelectedSortMode(mode);
    setLowHighSortActive(false);
    const base = products;
    setPreSortProductsSnapshot([]); // fresh snapshot next toggle
    if (mode === 'price') {
      const sortedDescPrice = [...base].sort((a, b) => Number(b.sellingPrice || 0) - Number(a.sellingPrice || 0)); // High -> Low
      setProducts(sortedDescPrice);
      setPreSortProductsSnapshot(sortedDescPrice);
    } else if (mode === 'date') {
      const sortedDescDate = [...base].sort((a, b) => {
        const ad = new Date(a.createdAt || a.updatedAt || 0).getTime();
        const bd = new Date(b.createdAt || b.updatedAt || 0).getTime();
        return bd - ad; // New -> Old
      });
      setProducts(sortedDescDate);
      setPreSortProductsSnapshot(sortedDescDate);
    }
  };

  const refreshProducts = async () => {
    try {
      const res = await api.get('/api/products?limit=10000');
      const productsData = res.data.products || res.data || [];
      const activeProducts = productsData
        .filter(product => !isProductExpired(product) && !product.isDelete)
        .map(product => ({
          ...product,
          quantity: product.quantity !== undefined ? product.quantity : (product.stockQuantity || 0)
        }));
      setProducts(activeProducts);
      setAllProducts(activeProducts);
      const initialTabs = activeProducts.reduce((acc, product) => {
        acc[product._id] = "general";
        return acc;
      }, {});
      setActiveTabs(initialTabs);
    } catch (err) { }
  };

  useEffect(() => {
    refreshProducts();
  }, []);


  //fetch category of products----------------------------------------------------------------------------------------------------
  const [categories, setCategories] = useState([]);
  const fetchCategories = async () => {
    try {
      const res = await api.get('/api/category/categories');
      const activeCategories = res.data.filter(cat => !cat.isDelete);
      setCategories(activeCategories);
    } catch (error) {
      // console.error("Error fetching categories:", error);
    }
  };
  useEffect(() => {
    fetchCategories();
  }, []);

  // Category filtering functionality
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleCategoryClick = (category) => {
    if (selectedCategory && selectedCategory._id === category._id) {
      // If same category is clicked again, show all products
      setSelectedCategory(null);
      setProducts(allProducts);
    } else {
      // Filter products by selected category, excluding expired products
      setSelectedCategory(category);
      const filteredProducts = allProducts.filter(product =>
        product.category && product.category._id === category._id && !isProductExpired(product)
      );
      setProducts(filteredProducts);
    }
  };

  const handleAllItemsClick = () => {
    setSelectedCategory(null);
    setProducts(allProducts);
  };


  // Product selection and cart functionality---------------------------------------------------------------------------------
  const [selectedItems, setSelectedItems] = useState([]);
  const [subTotal, setSubTotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [roundedAmount, setRoundedAmount] = useState(0);
  const [totalTax, setTotalTax] = useState('');
  const [totalItems, setTotalItems] = useState(0);
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [bagCharge, setBagCharge] = useState(0);
  const [posSales, setPosSales] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSales, setTotalSales] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);

  useEffect(() => {
    // Filter for only the bag items and sum their totalPrice
    const total = selectedItems
      .filter(item => item.isBag)
      .reduce((sum, currentBag) => sum + currentBag.totalPrice, 0);

    setBagCharge(total);
  }, [selectedItems]); // The dependency array ensures this runs only when needed

  const handleProductClick = (product) => {
    if (!product || !product._id) return;
    // Use functional updater to avoid stale-state/race conditions when scan and manual add happen together
    setSelectedItems(prevItems => {
      const existingIndex = prevItems.findIndex(item => String(item._id) === String(product._id));
      if (existingIndex !== -1) {
        const current = prevItems[existingIndex];
        const maxQty = Number(
          current.availableQuantity ??
          (products.find(p => String(p._id) === String(current._id))?.quantity) ??
          0
        );
        const nextQty = Math.min((current.quantity || 0) + 1, maxQty);
        if (nextQty === current.quantity) {
          toast.info('Maximum available quantity reached');
          return prevItems;
        }
        const sellingPrice = Number(current.sellingPrice || 0);
        const discountValue = Number(current.discountValue || 0);
        const tax = Number(current.tax || 0);
        let actualDiscountPerUnit = 0;
        if (current.discountType === 'Percentage') {
          actualDiscountPerUnit = (sellingPrice * discountValue) / 100;
        } else {
          actualDiscountPerUnit = discountValue;
        }
        const updated = prevItems.map((it, idx) => {
          if (idx !== existingIndex) return it;
          return {
            ...it,
            quantity: nextQty,
            totalPrice: nextQty * sellingPrice,
            totalDiscount: nextQty * actualDiscountPerUnit,
            totalTax: (sellingPrice * tax * nextQty) / 100,
          };
        });
        return updated;
      }

      // Add new product to cart
      const sellingPrice = Number(product.sellingPrice || 0);
      const discountValue = Number(product.discountAmount || 0);
      const tax = Number(product.tax || 0);

      let actualDiscountPerUnit = 0;
      if (product.discountType === 'Percentage') {
        actualDiscountPerUnit = (sellingPrice * discountValue) / 100;
      } else {
        actualDiscountPerUnit = discountValue;
      }

      const available = Number(product.availableQuantity ?? product.quantity ?? 0);
      if (available <= 0) {
        toast.error('Out of stock');
        return prevItems;
      }
      const newItem = {
        ...product,
        availableQuantity: available,
        quantity: Math.min(1, available),
        totalPrice: sellingPrice,
        totalDiscount: actualDiscountPerUnit,
        totalTax: (sellingPrice * tax) / 100,
        // Ensure cart item keeps internal naming convention
        discountValue: discountValue
      };
      return [...prevItems, newItem];
    });
  };

  // NEW handleBagSelection function
  const handleBagSelection = (bagPrice, bagType) => {
    // 1. Create a unique ID for this specific type of bag
    const clickedBagId = `bag-${bagType.replace(/\s+/g, '-').toLowerCase()}-${bagPrice}`;

    // 2. Check if this specific bag already exists in the cart
    const existingBag = selectedItems.find(item => item._id === clickedBagId);

    if (existingBag) {
      // 3. IF IT EXISTS: Increment its quantity and price
      const updatedItems = selectedItems.map(item => {
        if (item._id === clickedBagId) {
          return {
            ...item,
            quantity: item.quantity + 1,
            // Recalculate totalPrice based on the new quantity
            totalPrice: item.sellingPrice * (item.quantity + 1),
          };
        }
        return item;
      });
      setSelectedItems(updatedItems);

    } else {
      // 4. IF IT DOESN'T EXIST: Add it as a new item
      const newBagItem = {
        _id: clickedBagId,
        productName: bagType,
        sellingPrice: bagPrice,
        quantity: 1,
        totalPrice: bagPrice,
        totalDiscount: 0,
        totalTax: 0,
        tax: 0,
        discountValue: 0,
        isBag: true, // Flag to identify bag items
        unit: 'piece'
      };
      setSelectedItems([...selectedItems, newBagItem]);
    }
  };

  const updateItemQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      // Remove item if quantity is 0 or negative
      setSelectedItems(selectedItems.filter(item => item._id !== itemId));
    } else {
      const updatedItems = selectedItems.map(item => {
        if (item._id === itemId) {
          const maxQty = Number(
            item.availableQuantity ??
            (products.find(p => String(p._id) === String(item._id))?.quantity) ??
            0
          );
          const safeQty = Math.min(newQuantity, maxQty);
          let actualDiscountPerUnit = 0;
          if (item.discountType === 'Percentage') {
            actualDiscountPerUnit = (item.sellingPrice * item.discountValue) / 100;
          } else {
            actualDiscountPerUnit = item.discountValue;
          }

          return {
            ...item,
            quantity: safeQty,
            totalPrice: safeQty * item.sellingPrice,
            totalTax: (item.tax * safeQty * item.sellingPrice) / 100,
            totalDiscount: safeQty * actualDiscountPerUnit
          };
        }
        return item;
      });
      setSelectedItems(updatedItems);
    }
  };

  const removeItem = (itemId) => {
    // Check if the item being removed is a bag
    // const itemToRemove = selectedItems.find(item => item._id === itemId);
    // if (itemToRemove && itemToRemove.isBag) {
    //   setBagCharge(0); // Reset bag charge when bag is removed
    // }
    setSelectedItems(selectedItems.filter(item => item._id !== itemId));
  };

  // Calculate totals whenever selectedItems changes
  useEffect(() => {
    // Exclude bag items from calculations since bagCharge is added separately
    const nonBagItems = selectedItems.filter(item => !item.isBag);
    const subtotal = nonBagItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const discount = nonBagItems.reduce((sum, item) => sum + item.totalDiscount, 0);
    const tax = nonBagItems.reduce((sum, item) => sum + calculateDiscountedTax(item), 0);
    const items = nonBagItems.length;
    const quantity = nonBagItems.reduce((sum, item) => sum + item.quantity, 0);

    setSubTotal(subtotal)
    setDiscount(discount)
    setTotalTax(tax);
    setTotalItems(items);
    setTotalQuantity(quantity);

    const calculatedTotal = (subtotal - discount) + tax + bagCharge;
    const pointsDeduction = Math.min(Number(appliedPoints) * 5, calculatedTotal);
    const adjustedTotal = calculatedTotal - pointsDeduction;
    setTotalAmount(adjustedTotal);
    const decimalPart = adjustedTotal - Math.floor(adjustedTotal);
    if (decimalPart <= 0.49) {
      setRoundedAmount(Math.floor(adjustedTotal));
    } else {
      setRoundedAmount(Math.ceil(adjustedTotal));
    }
  }, [selectedItems, bagCharge, appliedPoints]);

  const [amountReceived, setAmountReceived] = useState("");

  const changeToReturn = Math.max((Number(amountReceived) || 0) - roundedAmount, 0);
  const dueAmount = Math.max(roundedAmount - (Number(amountReceived) || 0), 0);

  const amountToCoin = Math.floor((roundedAmount / 10) / 5);

  //bill details up down arrow-----------------------------------------------------------------------------------------------------
  const [updown, setUpdown] = useState(false);
  const handleUpDown = (value) => {
    setUpdown(value)
  };

  //opt structure-----------------------------------------------------------------------------------------------------------------
  const otpRefs = [useRef(), useRef(), useRef(), useRef()];
  const [otp, setOtp] = useState(["", "", "", ""]);
  const handleOtpChange = (index, value) => {
    if (/^[0-9]?$/.test(value)) {
      const updatedOtp = [...otp];
      updatedOtp[index] = value;
      setOtp(updatedOtp);

      // Move to next input if value is entered and not the last input
      if (value && index < 3) {
        otpRefs[index + 1].current.focus();
      }
    }
  };

  const handleOtpKeyDown = (index, e) => {
    // Handle backspace navigation
    if (e.key === 'Backspace') {
      if (otp[index] === '' && index > 0) {
        // If current input is empty and backspace is pressed, move to previous input
        otpRefs[index - 1].current.focus();
      } else if (otp[index] !== '') {
        // If current input has value, clear it but stay in same input
        const updatedOtp = [...otp];
        updatedOtp[index] = '';
        setOtp(updatedOtp);
      }
    }
    // Handle arrow key navigation
    else if (e.key === 'ArrowLeft' && index > 0) {
      otpRefs[index - 1].current.focus();
    }
    else if (e.key === 'ArrowRight' && index < 3) {
      otpRefs[index + 1].current.focus();
    }
  };

  //customers selection--------------------------------------------------------------------------------------------------------------
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchCustomers = async () => {

    try {
      const res = await api.get('/api/customers');
      setCustomers(res.data);
    } catch (err) {
      setCustomers([]);
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchPosSales();
  }, []);

  // Customer search functionality
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === '') {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    // Filter customers based on search query
    const filtered = customers.filter(customer => {
      const searchTerm = query.toLowerCase();
      return (
        customer.name?.toLowerCase().includes(searchTerm) ||
        customer.email?.toLowerCase().includes(searchTerm) ||
        customer.phone?.toLowerCase().includes(searchTerm)
      );
    });

    setSearchResults(filtered);
    setShowDropdown(filtered.length > 0);
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setSearchQuery(customer.name || '');
    setShowDropdown(false);
    setPopup(false); // Close popup after selection
  };

  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  // Fetch sales transactions-------------------------------------------------------------------------------------------------
  const fetchPosSales = async (page = 1, searchQuery = '', statusFilter = '', paymentMethodFilter = '') => {
    try {
      setLoading(true);
      // console.log('🔍 fetchPosSales called with:', { page, searchQuery, statusFilter, paymentMethodFilter });

      // const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        page: page,
        limit: 10
      });

      if (searchQuery.trim()) {
        params.append('search', searchQuery);
      }

      if (statusFilter.trim()) {
        params.append('status', statusFilter);
      }

      if (paymentMethodFilter.trim()) {
        params.append('paymentMethod', paymentMethodFilter);
      }

      const apiUrl = `${BASE_URL}/api/pos-sales/transactions?${params}`;
      // console.log('🌐 API URL:', apiUrl);
      // console.log('📋 URL Params:', params.toString());

      const response = await api.get(apiUrl);

      // console.log('✅ API Response:', response.data);
      setPosSales(response.data.data);
      setTotalPages(response.data.pagination.totalPages);
      setTotalSales(response.data.pagination.totalSales);
      setCurrentPage(page);
    } catch (error) {
      // console.error('Error fetching POS sales:', error);
    } finally {
      setLoading(false);
    }
  };

  // Transaction search functionality
  const handleTransactionSearch = (query) => {
    setTransactionSearchQuery(query);
    const statusFilter = activeQuickFilter === 'all' ? categoryValue : activeQuickFilter;
    const paymentMethodFilter = socketValue;
    fetchPosSales(1, query, statusFilter, paymentMethodFilter);
  };

  // Create POS sale---------------------------------------------------------------------------------------------------------------------
  const createPosSale = async (paymentMethod, amountReceived = 0, changeReturned = 0) => {
    let saleData;
    try {
      if (!selectedCustomer || selectedItems.length === 0) {
        toast.error('Please select a customer and items before proceeding');
        return;
      }

      const productItems = selectedItems.filter(i => !i.isBag);
      if (productItems.length === 0) {
        toast.error('Add at least one product item before checkout');
        return;
      }

      // Ensure numeric values are numbers and map to correct property names
      saleData = {
        customerId: selectedCustomer._id,
        items: productItems.map(item => ({
          productId: item._id,
          quantity: Number(item.quantity),
          sellingPrice: Number(item.sellingPrice),
          totalPrice: Number(item.totalPrice),
          discountValue: Number(item.totalDiscount || 0), // Map totalDiscount to discountValue
          discountType: 'Fixed', // Default to Fixed
          tax: Number(item.totalTax || 0) // Map totalTax to tax
        })),
        paymentMethod,
        amountReceived: Number(amountReceived || 0),
        changeReturned: Number(changeReturned || 0),
        bagCharge: Number(bagCharge || 0),
        subtotal: Number(subTotal || 0),
        discount: Number(discount || 0),
        tax: Number(totalTax || 0),
        totalAmount: Number(roundedAmount || 0),
        pointsUsed: Number(appliedPoints || 0)
      };

      // console.log('Frontend sending sale data:', saleData);
      // console.log('Data types:', {
      //   customerId: typeof saleData.customerId,
      //   itemsLength: saleData.items.length,
      //   paymentMethod: typeof saleData.paymentMethod,
      //   subtotal: typeof saleData.subtotal,
      //   totalAmount: typeof saleData.totalAmount
      // });

      // const token = localStorage.getItem("token");
      const response = await api.post('/api/pos-sales/create', saleData);

      if (response.data.success) {
        // Clear cart and show payment success
        setSelectedItems([]);
        setSelectedCustomer(null);
        setBagCharge(0);
        setAmountReceived('');
        setSelectedSale(response.data.data);
        handlePaymentPopupChange();
        // Refresh transactions
        fetchPosSales(1, transactionSearchQuery);
        await refreshProducts();
      }
    } catch (error) {
      console.error('createPosSale error', {
        message: error.message,
        stack: error.stack,
        status: error.response?.status,
        url: error.config?.url,
        method: error.config?.method,
        requestData: error.config?.data,
        responseData: error.response?.data,
        saleData,
        customerId: selectedCustomer?._id,
        itemsCount: selectedItems?.length,
        paymentMethod,
        amountReceived,
        changeReturned,
        subtotal: subTotal,
        discount,
        tax: totalTax,
        totalAmount: roundedAmount,
        bagCharge,
        appliedPoints
      });
      const msg = error.response?.data?.message || error.message || 'Error creating sale';
      const details = error.response?.data?.details;
      if (details && typeof details === 'object') {
        const errorMessages = Object.entries(details)
          .map(([field, message]) => `${field}: ${message}`)
          .join('\n');
        toast.error(`${msg}\n${errorMessages}`);
      } else {
        toast.error(msg);
      }
    }
  };

  // Handle pagination--------------------------------------------------------------------------------------------------------------------
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      const statusFilter = activeQuickFilter === 'all' ? categoryValue : activeQuickFilter;
      fetchPosSales(newPage, transactionSearchQuery, statusFilter, socketValue);
    }
  };

  //set address-----------------------------------------------------------------------------------------------------------------------------
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [pinCode, setPinCode] = useState("");

  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  const [countryList, setCountryList] = useState([]);
  const [stateList, setStateList] = useState([]);
  const [cityList, setCityList] = useState([]);


  useEffect(() => {
    setCountryList(Country.getAllCountries());
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      setStateList(State.getStatesOfCountry(selectedCountry));
    }
  }, [selectedCountry]);

  useEffect(() => {
    if (selectedState) {
      setCityList(City.getCitiesOfState(selectedCountry, selectedState));
    }
  }, [selectedState]);

  //company details-----------------------------------------------------------------------------------------------------------------

  const [companyData, setCompanyData] = useState({
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
    ifsc: "",
    branch: "",
    upiId: "",
  });

  const fetchCompanyProfile = async () => {
    try {
      const res = await api.get("/api/company-bank/list");
      // console.log("Fetched company profile data:", res.data);
      const profile = res.data.data.find(bank => bank.isDefault);;
      if (profile) {
        setCompanyData({
          bankName: profile.bankName || "",
          accountHolderName: profile.accountHolderName || "",
          accountNumber: profile.accountNumber || "",
          ifsc: profile.ifsc || "",
          branch: profile.branch || "",
          upiId: profile.upiId || "", //company upi id
        });

      }
    } catch (error) {
      toast.error("No existing company bank details or error fetching it:", error);
    }
  };
  useEffect(() => {
    fetchCompanyProfile();
  }, []);

  const [companyDetails, setCompanyDetails] = useState({
    companyName: "",
    companyemail: "",
    companyphone: "",
    companyfax: "",
    companywebsite: "",
    companyaddress: "",
    companycountry: "",
    companystate: "",
    companycity: "",
    companypostalcode: "",
    gstin: "",
    cin: "",
    companydescription: "",
  });

  const fetchCompanyDetails = async () => {
    try {
      const res = await api.get('/api/companyprofile/get');
      // console.log("Fetched company profile data:", res.data);
      const profile = res.data.data;
      if (profile) {
        setCompanyDetails({
          companyName: profile.companyName || "",
          companyemail: profile.companyemail || "",
          companyphone: profile.companyphone || "",
          companyfax: profile.companyfax || "",
          companywebsite: profile.companywebsite || "",
          companyaddress: profile.companyaddress || "",
          companycountry: profile.companycountry || "",
          companystate: profile.companystate || "",
          companycity: profile.companycity || "",
          companypostalcode: profile.companypostalcode || "",
          gstin: profile.gstin || "",
          cin: profile.cin || "",
          companydescription: profile.companydescription || "",
        });

      }
    } catch (error) {
      toast.error("No existing company profile details or error fetching it:", error);
    }
  };
  useEffect(() => {
    fetchCompanyDetails();
  }, []);

  //upi qr code generation----------------------------------------------------------------------------------------------------------

  const [qrCodeUrl, setQrCodeUrl] = useState("");

  async function generatePaymentQRCode(paymentData) {
    try {
      const qrCodeString = await QRCode.toDataURL(JSON.stringify(paymentData));
      // You can then display this qrCodeString (Data URL) in an <img> tag or save it as an image.
      // console.log(qrCodeString);
    } catch (err) {
      // console.error(err);
    }
  }

  useEffect(() => {
    if (companyData?.upiId && roundedAmount > 0) {
      // Build UPI Payment String
      const upiString = `upi://pay?pa=${companyData.upiId}&pn=${encodeURIComponent(
        companyData.companyName
      )}&am=${roundedAmount}&cu=INR`;

      // Generate QR Code
      QRCode.toDataURL(upiString)
        .then((url) => {
          setQrCodeUrl(url);
        })
        .catch((err) => {
          // console.error("Error generating QR code:", err);
        });
    }
  }, [roundedAmount, companyData]);

  //invoice popup----------------------------------------------------------------------------------------------------------------------

  const [invoicepopup, setInvoicePopup] = useState(false);
  const InvoiceRef = useRef(null);

  const handleInvoicePopupChange = () => {
    setInvoicePopup(!invoicepopup);
  }
  const closeInvoice = () => {
    setInvoicePopup(false);
  };
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (InvoiceRef.current && !InvoiceRef.current.contains(event.target)) {
        closeInvoice();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    }
  }, []);


  const totalDiscountinvoice = selectedSale?.items?.reduce(
    (acc, item) => acc + (item.discount || 0),
    0
  );

  const totalTaxinvoice = selectedSale?.items?.reduce(
    (acc, item) => acc + (item.tax || 0),
    0
  );

  //print and download invoice----------------------------------------------------------------------------------------------------------------------

  const [isGenerating, setIsGenerating] = useState(false);

  // Download PDF function
  const handleDownloadPDF = async () => {
    if (isGenerating) return;

    // Ensure invoicepopup is open
    setInvoicePopup(true);

    // Wait for the DOM to update (small delay to ensure rendering)
    setTimeout(async () => {
      if (!InvoiceRef.current) {
        // console.error('InvoiceRef is null or undefined');
        toast.error('Cannot generate PDF: Invoice content is not available');
        setIsGenerating(false);
        return;
      }

      setIsGenerating(true);
      const element = InvoiceRef.current;
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 297],
      });

      try {
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: true,
        });
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 70;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;

        let position = 5;
        doc.addImage(imgData, 'PNG', 5, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - 10;
        while (heightLeft > 0) {
          doc.addPage();
          position = heightLeft - imgHeight + 5;
          doc.addImage(imgData, 'PNG', 5, position, imgWidth, imgHeight);
          heightLeft -= pageHeight - 10;
        }

        doc.save('invoice.pdf');
      } catch (error) {
        // console.error('Error generating PDF:', error);
        toast.error('Failed to generate PDF: ' + error.message);
      } finally {
        setIsGenerating(false);
        // Optionally close invoicepopup after generating
        setInvoicePopup(false);
      }
    }, 100); // Small delay to ensure DOM rendering
  };

  // Print Preview function
  const handleInvoicePrint = async () => {
    if (isGenerating) return;

    // Ensure invoicepopup is open
    setInvoicePopup(true);

    // Wait for the DOM to update
    setTimeout(async () => {
      if (!InvoiceRef.current) {
        // console.error('InvoiceRef is null or undefined');
        toast.error('Cannot print: Invoice content is not available');
        setIsGenerating(false);
        return;
      }

      setIsGenerating(true);
      try {
        const canvas = await html2canvas(InvoiceRef.current, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
        });
        const imgData = canvas.toDataURL('image/png');

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
        <html>
          <head>
            <title>Print Invoice</title>
            <style>
              body {
                margin: 5mm;
                padding: 0;
                font-family: Arial, sans-serif;
                font-size: 10px;
                color: #333;
              }
              .invoice-container {
                max-width: 70mm;
                margin: 0 auto;
                background-color: #fff;
                padding: 5mm;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 5px;
                margin-bottom: 5px;
              }
              th, td {
                padding: 3px;
                text-align: left;
                font-size: 10px;
              }
              th {
                border-bottom: 1px solid #E1E1E1;
              }
              .text-right {
                text-align: right;
              }
              .text-center {
                text-align: center;
              }
              .section-title {
                font-size: 14px;
                font-weight: 600;
                margin-top: 5px;
              }
              .border-bottom {
                border-bottom: 1px solid #E1E1E1;
              }
              @media print {
                @page {
                  size: A5;
                  margin: 5mm;
                }
                .invoice-container {
                  box-shadow: none;
                  max-width: 70mm;
                }
                body {
                  margin: 0;
                }
              }
            </style>
          </head>
          <body>
            <div class="invoice-container">
              <img src="${imgData}" style="width: 100%; height: auto;" />
            </div>
            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              };
            </script>
          </body>
        </html>
      `);
        printWindow.document.close();
      } catch (error) {
        // console.error('Error generating print preview:', error);
        toast.error('Failed to generate print preview: ' + error.message);
      } finally {
        setIsGenerating(false);
        // Optionally close invoicepopup after printing
        setInvoicePopup(false);
      }
    }, 100); // Small delay to ensure DOM rendering
  };

  //add customers---------------------------------------------------------------------------------------------------------------

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    status: true,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.get('/api/customers');
      alert("Customer saved successfully ✅");
      // Clear all form fields
      setForm({
        name: '',
        email: '',
        phone: '',
        status: true,
      });
      // Clear location fields
      setSelectedCountry('');
      setSelectedState('');
      setSelectedCity('');
      setPinCode('');
      // Close popup
      setAddCustomerPopup(false);
      fetchCustomers();
    } catch (err) {
      // console.error(err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  //date display
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    // Set up a timer to update every second
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);

    // Cleanup the interval on component unmount
    return () => clearInterval(timer);
  }, []);


  // 👇 new state for See More
  const [showAllCategories, setShowAllCategories] = useState(false);

  // By default first 5 categories
  const visibleCategories = showAllCategories
    ? categories
    : categories;

  //  const visibleCategories = Array.isArray(categories)
  // ? (showAllCategories ? categories : categories.slice(0, 5))
  // : [];

  //NEW--------------------------------------------------------------------------------------------------------

  const categorie = [
    { name: "Shirts", count: 12, image: Shirt },
    { name: "Cap", count: 3, image: Cap },
    { name: "Denim Shorts", count: 13, image: DenimShorts },
    { name: "Denim", count: 178, image: Jeans },
    { name: "Hoodies", count: 32, image: Clothes },
    { name: "Jersey", count: 45, image: Jersey },
    { name: "Night Suits", count: 25, image: Kimono },
    { name: "Saree", count: 469, image: Sari },
    { name: "Shoes", count: 76, image: Trainers },
    { name: "Party Wear (Womens)", count: 43, image: Dress },
    { name: "Shocks", count: 19, image: Shocks },
    { name: "Blouse", count: 34, image: WomensBlouse },
    { name: "Sweater (Men)", count: 65, image: Sweater },
    { name: "Undefined Category", count: 65, image: Jeans },
    { name: "Undefined Category", count: 65, image: Sari },
  ];

  const items = [
    { name: "Green hoody from H&M collection", price: '1200', qty: 'Qty - 43', image: Greenhoody },
    { name: "Two silk shirts ", price: '1200', qty: 'Qty - 43', image: Twoshirts },
    { name: "Three piece coat with pant", price: '1200', qty: 'Qty - 43', image: Threepiece },
    { name: "Full hoody", price: '1200', qty: 'Qty - 43', image: Fullhoody },
    { name: "White t shirt", price: '1200', qty: 'Qty - 43', image: Whitetshirt },
    { name: "Parashut hoody", price: '1200', qty: 'Qty - 43', image: Parashuthoody },
    { name: "Plane t shirt", price: '1200', qty: 'Qty - 43', image: Planetshirt },
    { name: "Saree like Lehanga", price: '1200', qty: 'Qty - 43', image: SareeL },
    { name: "Boy t shirt", price: '1200', qty: 'Qty - 43', image: Boytshirt },
    { name: "Saree Green", price: '1200', qty: 'Qty - 43', image: SareeG },
    { name: "Single Half Coat", price: '1200', qty: 'Qty - 43', image: Coat },
    { name: "Three piece", price: '1200', qty: 'Qty - 43', image: Threepiece },
    { name: "Full hoody", price: '1200', qty: 'Qty - 43', image: Fullhoody },
    { name: "Parashut hoody", price: '1200', qty: 'Qty - 43', image: Parashuthoody },
    { name: "Plane t shirt", price: '1200', qty: 'Qty - 43', image: Planetshirt },
  ]

  const cartItems = [
    { name: "Mouni Roy Blue Kashish Banarasi Saree", price: "₹54", qty: "Available Qty - 43", image: SareeL },
    { name: "Adidas Men Running Sneakers Dashcore", price: "₹54", qty: "Available Qty - 43", image: Shoen },
    { name: "Mouni Roy Blue Kashish Banarasi Saree", price: "₹54", qty: "Available Qty - 43", image: SareeL },
    { name: "Adidas Men Running Sneakers Dashcore", price: "₹54", qty: "Available Qty - 43", image: Shoen },
    { name: "Mouni Roy Blue Kashish Banarasi Saree", price: "₹54", qty: "Available Qty - 43", image: SareeL },
    { name: "Adidas Men Running Sneakers Dashcore", price: "₹54", qty: "Available Qty - 43", image: Shoen },
    { name: "Mouni Roy Blue Kashish Banarasi Saree", price: "₹54", qty: "Available Qty - 43", image: SareeL },
    { name: "Adidas Men Running Sneakers Dashcore", price: "₹54", qty: "Available Qty - 43", image: Shoen },
  ];

  // tax & gst settings
    const [taxSettings, setTaxSettings] = useState({
      enableGSTBilling: true,
      priceIncludeGST: true,
      defaultGSTRate: "18",
      autoRoundOff: "0"
    })
  
    // fetch tax setting
    useEffect(() => {
      const loadTaxSettings = async () => {
        try {
          const response = await api.get('/api/tax-gst-settings');
          if (response.data.success) {
            const data = response.data.data;
            setTaxSettings({
              enableGSTBilling: data.enableGSTBilling !== false,
              priceIncludeGST: data.priceIncludeGST !== false,
              defaultGSTRate: data.defaultGSTRate || "18",
              autoRoundOff: data.autoRoundOff || "0"
            })
          }
        } catch (error) {
          console.error("Error fetching tax settings:", error)
        }
      }
      loadTaxSettings();
    }, []);
  
  return ( //page code starts from here-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    <>
      <div>
        <div style={{ width: '100%', height: '100%', background: '#FAFAFA', }}>

          {/* Header */}
          {companyImages ? (
            <>
              <div
                style={{
                  width: "100%",
                  height: "67px",
                  paddingLeft: 20,
                  paddingRight: 20,
                  background: 'white',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: "270px",
                  objectFit: 'contain',
                  padding: '5px',
                }}>
                  <img
                    style={{ height: "100%" }}
                    src={isDarkMode ? companyImages?.companyDarkLogo : companyImages?.companyLogo}
                    alt="Company logo"
                  />
                </div>

                <div
                  style={{
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    gap: 12,
                    display: 'inline-flex',
                  }}
                >
                  <div
                    style={{
                      height: 41,
                      paddingLeft: 12,
                      paddingRight: 12,
                      paddingTop: 8,
                      paddingBottom: 8,
                      background: 'white',
                      borderRadius: 8,
                      outline: '1px #D7D7D7 solid',
                      outlineOffset: '-1px',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                    }}
                    onClick={() => { setScanning(true); startScanner(); }}
                    title="Open camera scanner"
                  >
                    <div
                      style={{
                        overflow: 'hidden',
                      }}
                    >
                      <CiBarcode className='fs-5 text-secondary' />
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      ref={fileInputRef}
                      onChange={handleFileInput}
                      style={{ display: 'none' }}
                    />
                  </div>
                  {scanning && (
                    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '90%', maxWidth: 720, background: '#000', borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
                        <video ref={videoRef} style={{ width: '100%', height: 420, objectFit: 'cover' }} playsInline muted />
                        <button onClick={stopScanner} style={{ position: 'absolute', top: 8, right: 8, zIndex: 10000 }} className="btn btn-danger">Close</button>
                      </div>
                    </div>
                  )}

                  <div
                    style={{
                      height: 41,
                      paddingLeft: 12,
                      paddingRight: 12,
                      paddingTop: 8,
                      paddingBottom: 8,
                      background: 'white',
                      borderRadius: 8,
                      outline: '1px #D7D7D7 solid',
                      outlineOffset: '-1px',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                    }}
                  >
                    <Link to='/pos' target='_blank'
                      style={{
                        overflow: 'hidden',
                        textDecoration: 'none',
                      }}
                    >
                      <FaPause className='fs-5' />
                    </Link>
                  </div>

                  <div
                    style={{
                      height: 41,
                      paddingLeft: 12,
                      paddingRight: 12,
                      paddingTop: 8,
                      paddingBottom: 8,
                      background: 'white',
                      borderRadius: 8,
                      outline: '1px #D7D7D7 solid',
                      outlineOffset: '-1px',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                    }}
                    onClick={handleTransactionPopupChange}
                  >
                    <div
                      style={{
                        overflow: 'hidden',
                      }}
                    >
                      <CgFileDocument className='fs-5 text-secondary' />
                    </div>
                  </div>

                  <div
                    style={{
                      height: 41,
                      paddingLeft: 12,
                      paddingRight: 12,
                      paddingTop: 8,
                      paddingBottom: 8,
                      background: 'white',
                      borderRadius: 8,
                      outline: '1px #D7D7D7 solid',
                      outlineOffset: '-1px',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        overflow: 'hidden',
                      }}
                    >
                      <SlCalculator className='fs-5 text-secondary' />
                    </div>
                  </div>

                  <div
                    style={{
                      height: 41,
                      paddingLeft: 12,
                      paddingRight: 12,
                      paddingTop: 8,
                      paddingBottom: 8,
                      background: 'white',
                      borderRadius: 8,
                      outline: '1px #D7D7D7 solid',
                      outlineOffset: '-1px',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: 8,
                      display: 'flex',
                      cursor: 'pointer',
                    }}
                  >
                    <Link
                      to="/dashboard"
                      style={{
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 4,
                        display: 'flex',
                        textDecoration: 'none',
                        color: 'inherit',
                      }}
                    >
                      <div
                        data-property-1="exit_to_app_18dp_1F1F1F_FILL0_wght400_GRAD0_opsz20 1"
                        style={{
                          width: 18,
                          height: 18,
                          display: 'flex',
                          gap: '8px',
                          overflow: 'hidden',
                        }}
                      >
                        <RiLogoutBoxRLine className='fs-5' />
                      </div>
                      <div
                        style={{
                          color: 'black',
                          fontSize: 16,
                          fontFamily: 'Inter',
                          fontWeight: '400',
                          wordWrap: 'break-word',
                        }}
                      >
                        Exit
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p>"No Company Logo Image"</p>)}

          {/* main pannel */}
          <div style={{ width: '100%', height: 'calc(100% - 67px)', display: 'flex', boxSizing: 'border-box', gap: '16px', backgroundColor: '#f3f3f3ff' }}>

            {/* left side pannel */}
            <div
              style={{
                height: 'calc(100vh - 70px)',
                width: "17%",
                paddingLeft: 24,
                paddingRight: 24,
                paddingTop: 16,
                paddingBottom: 16,
                top: 67,
                left: 0,
                background: '#ffffffff',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                alignItems: 'center',
                gap: 8,
                display: 'inline-flex',
              }}
            >
              <div
                style={{
                  width: "100%",
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  display: 'flex',
                }}
              >
                <div
                  style={{
                    alignSelf: 'stretch',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    alignItems: 'flex-start',
                    gap: 20,
                    display: 'flex',
                  }}
                >

                  {/* all products button */}
                  <div
                    style={{
                      alignSelf: 'stretch',
                      flexDirection: 'column',
                      justifyContent: 'flex-start',
                      alignItems: 'flex-start',
                      gap: 12,
                      display: 'flex',
                    }}
                  >
                    <div
                      style={{
                        color: 'black',
                        fontSize: 16,
                        fontFamily: 'Inter',
                        fontWeight: '400',
                        wordWrap: 'break-word',
                      }}
                    >
                      All
                    </div>
                    <div
                      data-property-1="Clicked"
                      style={{
                        alignSelf: "stretch",
                        paddingLeft: 16,
                        paddingRight: 16,
                        paddingTop: 8,
                        paddingBottom: 8,
                        background: "#eceaeaff",
                        borderRadius: 12,
                        outline: selectedCategory === null ? "1px #0084FF solid" : " ",
                        outlineOffset: "-1px",
                        justifyContent: "space-between",
                        alignItems: "center",
                        display: "inline-flex",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          justifyContent: "flex-start",
                          alignItems: "center",
                          gap: 8,
                          display: "flex",
                        }}
                        onClick={handleAllItemsClick}
                      >
                        <div style={{ width: 30, height: 30, position: "relative" }}>
                          <img
                            style={{ width: 30, height: 30, left: 0, top: 0, position: "absolute" }}
                            src={All}
                            alt="All Product Logo"
                          />
                        </div>
                        <div
                          style={{
                            color: selectedCategory === null ? "#0084FF" : "",
                            fontSize: 16,
                            fontFamily: "Inter",
                            fontWeight: "400",
                            wordWrap: "break-word",
                          }}
                        >
                          All Products
                        </div>
                      </div>
                      <div
                        style={{
                          width: 25,
                          height: 25,
                          padding: 8,
                          background: selectedCategory === null ? "#0084FF" : "#d1cfcfff",
                          borderRadius: 94,
                          justifyContent: "center",
                          alignItems: "center",
                          gap: 8,
                          display: "flex",
                        }}
                      >
                        <div
                          style={{
                            color: selectedCategory === null ? "white" : "#636363",
                            fontSize: 12,
                            fontFamily: "Inter",
                            fontWeight: "400",
                            wordWrap: "break-word",
                          }}
                        >
                          {allProducts.length}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* category */}
                  <div
                    style={{
                      alignSelf: 'stretch',
                      flexDirection: 'column',
                      justifyContent: 'flex-start',
                      alignItems: 'flex-start',
                      gap: 12,
                      display: 'flex',
                    }}
                  >
                    <div
                      style={{
                        color: 'black',
                        fontSize: 16,
                        fontFamily: 'Inter',
                        fontWeight: '400',
                        wordWrap: 'break-word',
                      }}
                    >
                      Category
                    </div>
                  </div>

                  {/* category list */}
                  <div
                    style={{
                      alignSelf: 'stretch',
                      flexDirection: 'column',
                      justifyContent: 'flex-start',
                      alignItems: 'flex-start',
                      gap: 12,
                      display: 'flex',
                      height: 'calc(100vh - 230px)',
                      overflowY: 'auto',
                      padding: '1px 5px',
                    }}
                  >
                    {categories.length === 0 ? (
                      <span style={{ fontSize: "13px", color: "#9ca3af" }}>No Category Available</span>
                    ) : (
                      <>
                        {visibleCategories.map((category, index) => (
                          <div

                            key={category._id}
                            data-property-1="Normal"
                            style={{
                              alignSelf: "stretch",
                              paddingLeft: 16,
                              paddingRight: 16,
                              paddingTop: 8,
                              paddingBottom: 8,
                              background: "#eceaeaff",
                              outline: selectedCategory && selectedCategory._id === category._id ? "1px #0084FF solid" : "",
                              borderRadius: 12,
                              justifyContent: "space-between",
                              alignItems: "center",
                              display: "inline-flex",
                              cursor: "pointer",
                            }}

                            onClick={() => handleCategoryClick(category)}
                          >
                            <div
                              style={{
                                justifyContent: "flex-start",
                                alignItems: "center",
                                gap: 4,
                                display: "flex",
                              }}
                            >
                              {/* <div style={{ width: 30, height: 30, position: "relative" }}>
                            <img
                              style={{ width: 30, height: 30, left: 0, top: 0, position: "absolute" }}
                              src={category.image}
                              alt=""
                            />
                          </div> */}
                              <div
                                style={{
                                  color: selectedCategory && selectedCategory._id === category._id ? "#0084FF" : "#636363",
                                  fontSize: 16,
                                  fontFamily: "Inter",
                                  fontWeight: "400",
                                  wordWrap: "break-word",
                                }}
                              >
                                {category.categoryName}
                              </div>
                            </div>
                            <div
                              style={{
                                width: 25,
                                height: 25,
                                padding: 8,
                                background: selectedCategory && selectedCategory._id === category._id ? "#0084FF" : "#d1cfcfff",
                                borderRadius: 94,
                                justifyContent: "center",
                                alignItems: "center",
                                gap: 8,
                                display: "flex",
                              }}
                            >
                              <div
                                style={{
                                  color: selectedCategory && selectedCategory._id === category._id ? "white" : "#636363",
                                  fontSize: 14,
                                  fontFamily: "Inter",
                                  fontWeight: "400",
                                  wordWrap: "break-word",
                                }}
                              >
                                {category.count}
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>

                </div>
              </div>
            </div>

            {/* center */}
            <div style={{
              width: '65%',
              height: 'calc(100vh - 67px)',
              overflowY: 'auto',
              paddingTop: 16,
              paddingBottom: 16,
              paddingLeft: 16,
              paddingRight: 16,
            }}>

              {/* banner */}
              <div
                style={{
                  width: "100%",
                  background: 'white',
                  borderRadius: 12,
                  objectFit: 'cover',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  cursor: "pointer",
                }}
              >
                <img src={Banner} alt="Banner" style={{ width: '100%', borderRadius: 12, }} />
              </div>

              {/* product search bar + sort & filter buttons */}
              <div
                style={{
                  width: "100%",
                  alignItems: 'center',
                  gap: 24,
                  marginTop: 16,
                  display: 'inline-flex',
                }}
              >
                <div
                  style={{
                    flex: '1 1 0%',
                    height: 40,
                    paddingLeft: 16,
                    paddingRight: 16,
                    background: 'white',
                    borderRadius: 8,
                    outline: '1px var(--White-Stroke, #EAEAEA) solid',
                    outlineOffset: '-1px',
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                    gap: 8,
                    display: 'flex',
                  }}
                >
                  <div
                    data-property-1="Search"
                    style={{
                      width: 18,
                      height: 18,
                      position: 'relative',
                      display: 'flex',
                      gap: '8px',
                    }}
                  >
                    <IoIosSearch />
                  </div>
                  <input type="text"
                    placeholder="Search Product"
                    style={{ width: '100%', border: 'none', outline: 'none' }}
                    value={productSearchQuery}
                    onChange={(e) => handleProductSearch(e.target.value)}
                  />
                </div>
                <div
                  style={{
                    height: 40,
                    paddingLeft: 10,
                    paddingRight: 10,
                    paddingTop: 11,
                    paddingBottom: 11,
                    background: 'var(--White-White-1, white)',
                    borderRadius: 8,
                    outline: '1px var(--White-Stroke, #EAEAEA) solid',
                    outlineOffset: '-1px',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 8,
                    display: 'flex',
                    cursor: "pointer",
                  }}
                >
                  <MdOutlineSort style={{ fontSize: '25px' }} />
                  <select
                    value={selectedSortMode === 'price' ? 'sortByPrice' : selectedSortMode === 'date' ? 'sortByDate' : 'sortByName'}
                    onChange={(e) => handleSortModeChange(e.target.value)}
                    style={{
                      color: '#515457',
                      fontSize: 14,
                      fontFamily: 'Inter',
                      fontWeight: '500',
                      wordWrap: 'break-word',
                      border: 'none',
                      outline: 'none',
                      background: 'none',
                      cursor: "pointer",
                      width: '85px',
                    }}
                  >
                    <option value="sortByName">Sort By</option>
                    <option value="sortByPrice">Price</option>
                    <option value="sortByDate">Date</option>
                  </select>
                </div>
                <div
                  style={{
                    height: 40,
                    paddingLeft: 10,
                    paddingRight: 10,
                    paddingTop: 11,
                    paddingBottom: 11,
                    background: 'var(--White-White-1, white)',
                    borderRadius: 8,
                    outline: lowHighSortActive === true ? "1px #0084FF solid" : "1px var(--White-Stroke, #EAEAEA) solid",
                    outlineOffset: '-1px',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 8,
                    display: 'flex',
                    cursor: "pointer",
                  }}
                  onClick={handleLowHighSortToggle}
                >
                  <CgSortAz style={{
                    fontSize: '30px',
                    color: lowHighSortActive === true ? "#0084FF" : "#515457",
                  }} />
                  <div
                    style={{
                      fontSize: 14,
                      fontFamily: 'Inter',
                      fontWeight: '500',
                      wordWrap: 'break-word',
                      color: lowHighSortActive === true ? "#0084FF" : "#515457",
                    }}
                  >
                    {selectedSortMode === 'date' ? 'Old - New' : 'Low - High'}
                  </div>
                </div>
              </div>

              {/* result status + product cards */}
              <div
                style={{
                  width: "100%",
                  marginTop: 10,
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  alignItems: 'flex-start',
                  gap: 24,
                  display: 'inline-flex',
                }}
              >
                {/* search number */}
                <div
                  style={{
                    width: "100%",
                    height: 17,
                    color: '#515457',
                    fontSize: 14,
                    fontFamily: 'Inter',
                    fontWeight: '500',
                    wordWrap: 'break-word',
                  }}
                >
                  (Showing 1 – {products.length} products of {allProducts.length} products)
                </div>

                {/* products cards */}
                <div
                  style={{
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                    gap: 23,
                    display: 'inline-flex',
                    flexWrap: 'wrap',
                    alignContent: 'center',
                  }}
                >
                  {products.length === 0 ? (
                    <span>No Product Available</span>
                  ) : (
                    products.map((product, index) => {
                      // Check if this product is in cart and get its quantity
                      const cartItem = selectedItems.find(item => item._id === product._id);
                      const cartQuantity = cartItem ? cartItem.quantity : 0;
                      return (
                        <>
                          <div
                            key={product._id}
                            id={`product-card-${product._id}`}
                            onClick={() => product.quantity > 0 && handleProductClick(product)}
                            style={{
                              width: "174px",
                              padding: 12,
                              background: "white",
                              borderRadius: 8,
                              outline: highlightedProductId === product._id ? "2px #0084FF solid" : "none",
                              flexDirection: "column",
                              justifyContent: "flex-start",
                              alignItems: "flex-start",
                              gap: 8,
                              display: "inline-flex",
                              border: '1px solid #DBDBDB',
                              cursor: "pointer",
                            }}
                          >
                            {product.images && product.images.length > 0 && product.images[0] ? (
                              <img
                                style={{
                                  alignSelf: "stretch",
                                  height: 140,
                                  background: "white",
                                  borderRadius: 8,
                                  border: "1px #DBDBDB solid",
                                }}
                                src={product.images[0].url || product.images[0]}
                                alt={product.productName || "Product"}
                              />
                            ) : (<>
                              <div
                                style={{
                                  alignSelf: "stretch",
                                  height: 140,
                                  background: "#eeededff",
                                  borderRadius: 8,
                                  border: "1px #DBDBDB solid",
                                  display: "flex",
                                  justifyContent: "center",
                                  alignItems: "center",
                                }}
                              ><span style={{fontSize:'42px', fontWeight:'700'}}>{product.productName.slice(0, 1).toUpperCase()}</span></div>
                            </>)}

                            <div
                              style={{
                                alignSelf: "stretch",
                                display: "flex",
                                flexDirection: 'column',
                              }}
                            >
                              <div
                                style={{
                                  width: "100%",
                                  overflow: "hidden",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  gap: 8,
                                }}
                              >
                                <div
                                  style={{
                                    width: 150,
                                    color: product.nameColor,
                                    fontSize: 14,
                                    fontFamily: "Inter",
                                    fontWeight: "500",
                                    wordWrap: "break-word",
                                  }}
                                >
                                  {product.productName.length > 19 ? product.productName.substring(0, 19) + '...' : product.productName}
                                </div>
                                <div>
                                  {cartQuantity > 0 && (
                                    <div
                                      style={{
                                        backgroundColor: "#1368EC",
                                        color: "white",
                                        borderRadius: "50%",
                                        width: "20px",
                                        height: "20px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "12px",
                                        fontWeight: "bold",
                                        zIndex: 1,
                                      }}
                                    >
                                      {cartQuantity}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div
                                style={{
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  gap: 8,
                                  display: "inline-flex",
                                  marginTop: '4px',
                                }}
                              >
                                <div
                                  style={{
                                    justifyContent: "center",
                                    alignItems: "center",
                                    gap: 4,
                                    display: "inline-flex",
                                  }}
                                >
                                  <div
                                    style={{
                                      color: "#888888",
                                      fontSize: 12,
                                      fontFamily: "Inter",
                                      fontWeight: "400",
                                      wordWrap: "break-word",
                                    }}
                                  >
                                    Qty - <span style={{
                                      color: product.quantity > 0 ? "black" : "red",
                                    }}>{product.quantity}</span>
                                  </div>
                                </div>
                                <div
                                  style={{
                                    color: product.priceColor,
                                    fontSize: 20,
                                    fontFamily: "Inter",
                                    fontWeight: "600",
                                    wordWrap: "break-word",
                                  }}
                                >
                                  {taxSettings.priceIncludeGST ? "₹" + (product.sellingPrice + (product.sellingPrice * product.tax / 100)) + "/-" : "₹" + product.sellingPrice + "/-"}
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      )
                    }))}
                </div>
              </div>

            </div>

            {/* right side panel */}
            <div
              style={{
                width: "18%",
                height: 'calc(100vh - 67px)',
                top: 8,
                marginRight: 16,
              }}
            >

              {/* customer details */}
              <div
                style={{
                  width: "100%",
                  padding: 16,
                  left: 0,
                  marginTop: "16px",
                  background: 'white',
                  borderRadius: 8,
                  outline: '1px #EAEAEA solid',
                  outlineOffset: '-1px',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  display: 'inline-flex',
                }}
              >
                <div
                  style={{
                    alignSelf: 'stretch',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    gap: 4,
                    display: 'flex',
                  }}
                >
                  <div
                    style={{
                      alignSelf: 'stretch',
                      flexDirection: 'column',
                      justifyContent: 'flex-start',
                      alignItems: 'flex-start',
                      gap: 4,
                      display: 'flex',
                      position: 'relative'
                    }}
                  >
                    <div style={{ alignSelf: 'stretch', display: 'flex', justifyContent: 'space-between', }}>
                      <div>
                        <span
                          style={{
                            color: 'var(--Black-Black, #0E101A)',
                            fontSize: 12,
                            fontFamily: 'Inter',
                            fontWeight: '400',
                            wordWrap: 'break-word',
                          }}
                        >
                          Customer Name
                        </span>
                        <span
                          style={{
                            color: 'var(--Danger, #D00003)',
                            fontSize: 12,
                            fontFamily: 'Inter',
                            fontWeight: '400',
                            wordWrap: 'break-word',
                          }}
                        >
                          *
                        </span>
                      </div>
                      {selectedCustomer && (
                        <>
                          <div style={{
                            cursor: "pointer",
                          }}
                            onClick={handleClearCustomer}
                          >
                            <RiDeleteBinLine />
                          </div>
                        </>
                      )}
                    </div>

                    {/*-----------------------when customer is added--------------------------*/}
                    {selectedCustomer ? (
                      <>
                        <div
                          style={{
                            alignSelf: 'stretch',
                            padding: 12,
                            background: '#FAFAFA',
                            borderRadius: 8,
                            outline: '1px var(--White-Stroke, #EAEAEA) solid',
                            outlineOffset: '-1px',
                            justifyContent: 'space-between',
                            // alignItems: 'center',
                            display: 'flex',
                            width: '100%',
                          }}
                        >
                          <div
                            style={{
                              flexDirection: 'column',
                              justifyContent: 'center',
                              alignItems: 'flex-start',
                              gap: 4,
                              display: 'inline-flex',
                            }}
                          >
                            <div
                              style={{
                                color: 'var(--Black-Black, #0E101A)',
                                fontSize: 14,
                                fontFamily: 'Inter',
                                fontWeight: '400',
                                wordWrap: 'break-word',
                              }}
                            >
                              {selectedCustomer.name}
                            </div>
                            <div
                              style={{
                                height: 17,
                                color: 'var(--Black-Disable, #A2A8B8)',
                                fontSize: 14,
                                fontFamily: 'Inter',
                                fontWeight: '500',
                                wordWrap: 'break-word',
                              }}
                            >
                              {selectedCustomer.phone || 'No Phone'}
                            </div>
                          </div>
                          {selectedCustomer.totalDueAmount === 0 && <div
                            style={{
                              color: 'var(--Danger, green)',
                              fontSize: 14,
                              fontFamily: 'Inter',
                              fontWeight: '400',
                              wordWrap: 'break-word',
                            }}
                          >
                            To Collect: ₹{selectedCustomer.balance.toFixed(2)}/-
                          </div>}
                          {selectedCustomer.totalDueAmount > 0 && <div
                            style={{
                              color: 'var(--Danger, #D00003)',
                              fontSize: 14,
                              fontFamily: 'Inter',
                              fontWeight: '400',
                              wordWrap: 'break-word',
                            }}
                          >
                            Due: ₹{selectedCustomer.totalDueAmount.toFixed(2)}/-
                          </div>}
                        </div>
                      </>
                    ) : (
                      <>
                        {/* <div
                          style={{
                            alignSelf: 'stretch',
                            padding: 12,
                            background: '#FAFAFA',
                            borderRadius: 8,
                            outline: '1px var(--White-Stroke, #EAEAEA) solid',
                            outlineOffset: '-1px',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            display: 'inline-flex',
                            cursor: "pointer",
                          }}
                        >
                          <div style={{
                            color: 'var(--Black-Black, #0E101A)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            gap: '10px',
                          }}
                            onClick={handlePopupChange}
                          >
                            <div>Add Customer</div>
                            <div style={{
                              borderRadius: '8px',
                              padding: '2px 8px',
                              border: '1px solid #515457',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              color: '#515457',
                            }}>
                              +
                            </div>
                          </div>
                        </div> */}
                        <div
                          style={{
                            alignSelf: 'stretch',
                            padding: 12,
                            background: '#FAFAFA',
                            borderRadius: 8,
                            outline: '1px var(--White-Stroke, #EAEAEA) solid',
                            outlineOffset: '-1px',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            display: 'inline-flex',
                          }}
                        >
                          <div style={{
                            color: 'var(--Black-Black, #0E101A)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                            gap: '0px',
                          }}>
                            <input
                              type="search"
                              placeholder="Enter Name/Phone No."
                              value={searchQuery}
                              onChange={handleSearchChange}
                              style={{
                                width: '100%',
                                border: 'none',
                                outline: 'none',
                                background: 'transparent',
                                fontSize: 14,
                                fontFamily: 'Inter',
                                fontWeight: '400',
                              }}
                            />
                            <div style={{
                              marginRight: '10px',
                              borderRadius: '8px',
                              padding: '2px 8px',
                              border: '1px solid #515457',
                              fontWeight: 'bold',
                              color: '#515457',
                              cursor: "pointer",
                            }}
                              // onClick={handleAddCustomerPopupChange}
                              onClick={() => setOpenAddModal(true)}
                            >
                              +
                            </div>
                          </div>
                        </div>
                        {showDropdown && searchResults.length > 0 && (
                          <div style={{
                            position: 'absolute',
                            top: '80px',
                            left: 0,
                            right: 0,
                            backgroundColor: 'white',
                            border: '1px solid #E1E1E1',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            maxHeight: '300px',
                            width: '100%',
                            overflowY: 'auto',
                            zIndex: 1000
                          }}>
                            {searchResults.map((customer) => (
                              <div
                                key={customer._id}
                                onClick={() => handleCustomerSelect(customer)}
                                style={{
                                  padding: '12px 16px',
                                  borderBottom: '1px solid #f0f0f0',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '4px'
                                }}
                              >
                                <div style={{ fontWeight: '600', color: '#333' }}>
                                  {customer.name || 'No Name'}
                                </div>
                                <div style={{ fontSize: '11px', color: '#666' }}>
                                  {customer.phone || 'No Phone'}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* No Results Message */}
                        {searchResults.length === 0 && searchQuery.length > 0 && (
                          <div style={{
                            position: 'absolute',
                            top: '80px',
                            left: 0,
                            right: 0,
                            backgroundColor: 'white',
                            border: '1px solid #E1E1E1',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            maxHeight: '300px',
                            width: '100%',
                            overflowY: 'auto',
                            padding: '12px 16px',
                            borderBottom: '1px solid #f0f0f0',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            zIndex: 1000
                          }}>
                            No customers found matching "{searchQuery}"
                          </div>
                        )}
                      </>)}

                  </div>

                  {/* customer coins and its details */}
                  {selectedCustomer && (
                    <>
                      <div
                        style={{ alignSelf: 'stretch', display: 'flex', justifyContent: 'space-between', alignItems: 'center', }}
                      >
                        <div style={{
                          justifyContent: 'flex-start',
                          alignItems: 'flex-end',
                          gap: 4,
                          display: 'inline-flex',
                        }}>
                          <div
                            style={{
                              color: '#1E1E1E',
                              fontSize: 11,
                              fontFamily: 'Inter',
                              fontWeight: '500',
                            }}
                          >
                            🪙
                          </div>
                          <div
                            style={{
                              color: 'var(--Black-Black, #0E101A)',
                              fontSize: 11,
                              fontFamily: 'Inter',
                              fontWeight: '400',
                              wordWrap: 'break-word',
                            }}
                          >
                            {selectedCustomer.availablePoints} points
                          </div>
                          {/* <div
                            style={{
                              color: 'var(--Danger, #D00003)',
                              fontSize: 11,
                              fontFamily: 'Inter',
                              fontWeight: '400',
                              wordWrap: 'break-word',
                            }}
                          >
                            (23 days to expire)
                          </div> */}
                        </div>
                        {selectedItems.length === 0 || selectedCustomer.availablePoints === 0 ? (
                          <button
                            style={{
                              padding: "2px 6px",
                              background: '#1f80ff7e',
                              border: '1px solid #1f80ff48',
                              color: 'white',
                              borderRadius: 4,
                              textDecoration: 'none',
                              fontSize: '14px',
                              display: 'flex',
                              gap: '8px',
                              alignItems: 'center',
                              cursor: "not-allowed",
                            }}>
                            Apply
                          </button>
                        ) : (
                          <button
                            onClick={() => setApplycoinpopup(true)}
                            style={{
                              padding: "2px 6px",
                              background: '#1F7FFF',
                              border: '1px solid #1F7FFF',
                              color: 'white',
                              borderRadius: 4,
                              textDecoration: 'none',
                              fontSize: '14px',
                              display: 'flex',
                              gap: '8px',
                              alignItems: 'center',
                              cursor: "pointer",
                            }}>
                            Apply
                          </button>)}

                        {applycoinpopup && (
                          <div
                            onClick={() => setApplycoinpopup(false)}
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
                            }}>
                            <div
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                backgroundColor: "white",
                                width: "auto",
                                padding: "20px",
                                borderRadius: "8px",
                                overflow: "auto",
                                display: "flex",
                                flexDirection: "column",
                                gap: "10px",
                              }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ fontSize: "14px", fontWeight: "500", color: '#0E101A' }}>Shopping Points</span>
                                <span style={{ fontSize: "13px", fontWeight: "500", }}>Available to redeem - 🪙
                                  <span style={{ color: '#1F7FFF' }}>{(selectedCustomer.availablePoints) < amountToCoin ? '0' : amountToCoin} points</span>
                                </span>
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', justifyContent: 'start', marginTop: '6px' }}>
                                <span style={{ fontSize: "14px", fontWeight: "500", color: '#0E101A' }}>Apply Points</span>
                                <div style={{ display: 'flex', flexDirection: 'row', gap: '4px' }}>
                                  <input
                                    type="radio"
                                    id='applypointsfull'
                                    checked={applyFull}
                                    onChange={() => {
                                      setApplyFull(true);
                                      const fullPoints = Math.floor(Number(amountToCoin) || 0);
                                      setPointsToApply(fullPoints);
                                    }}
                                  />
                                  <label for='applypointsfull' style={{ fontSize: '13px', fontWeight: '500' }}>Full</label>
                                </div>
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', alignItems: 'center' }}>
                                <span style={{ fontSize: "14px", fontWeight: "500", color: '#0E101A' }}>Enter Points:</span>
                                <div className='' style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '4px', width: '100px', border: '1px solid #565657ff', padding: '6px 4px', borderRadius: 4 }}>
                                  <input
                                    type="number"
                                    id='enterpoints'
                                    placeholder='0'
                                    max={Math.floor(Number(amountToCoin) || 0)}
                                    value={pointsToApply}
                                    onChange={(e) => {
                                      setApplyFull(false);
                                      const fullPoints = Math.floor(Number(amountToCoin) || 0);
                                      const raw = Math.floor(Math.max(0, Number(e.target.value) || 0));
                                      const clamped = Math.min(raw, fullPoints);
                                      setPointsToApply(clamped);
                                    }}
                                    style={{ width: '100%', border: 'none', outline: 'none' }}
                                  />
                                  <span>🪙</span>
                                </div>
                                <span>=</span>
                                <div className='' style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '4px', width: '100px', border: '1px solid #565657ff', padding: '6px 6px', borderRadius: 4 }}>
                                  <span style={{ width: '100%', border: 'none', outline: 'none', fontSize: '14px', fontWeight: '600', color: '#0E101A' }}>{pointsToApply * 5}</span>
                                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#1F7FFF' }}>₹</span>
                                </div>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'end', }}>
                                <div
                                  onClick={() => {
                                    const maxPoints = Math.floor(Number(amountToCoin) || 0);
                                    const requested = applyFull ? maxPoints : Math.floor(Number(pointsToApply) || 0);
                                    const clamped = Math.max(0, Math.min(requested, maxPoints));
                                    setAppliedPoints(clamped);
                                    setApplycoinpopup(false);
                                  }}
                                  style={{
                                    padding: '6px 15px',
                                    backgroundColor: '#1368EC',
                                    borderRadius: '8px',
                                    color: 'white',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <span>Apply</span>
                                </div>
                              </div>

                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                </div>
              </div>

              {/* cart items */}
              {selectedItems.length === 0 ? (
                <div
                  style={{
                    width: "100%",
                    height: 'auto',
                    paddingLeft: 24,
                    paddingRight: 24,
                    paddingTop: 16,
                    paddingBottom: 16,
                    marginTop: "16px",
                    background: 'white',
                    borderRadius: 8,
                    outline: '1px #EAEAEA solid',
                    outlineOffset: '-1px',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    display: 'inline-flex',
                  }}
                >
                  <div
                    style={{
                      justifyContent: 'center',
                      alignItems: 'center',
                      display: 'flex',
                      overflowY: 'auto',
                      backgroundColor: 'white',
                      width: '150px',
                      height: '150px',
                      marginTop: '50px',
                    }}
                  >
                    <img src={EmptyBag} alt="Empty Cart" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>

                  <span style={{ marginTop: '10px', marginBottom: '50px' }}>Your Cart is Empty!</span>

                </div>
              ) : (
                <>
                  <div
                    style={{
                      width: "100%",
                      maxHeight: '60vh',
                      paddingLeft: 16,
                      paddingRight: 16,
                      paddingTop: 16,
                      paddingBottom: 16,
                      marginTop: "16px",
                      background: 'white',
                      borderRadius: 8,
                      outline: '1px #EAEAEA solid',
                      outlineOffset: '-1px',
                      flexDirection: 'column',
                      // justifyContent: 'space-between',
                      alignItems: 'center',
                      display: 'inline-flex',
                    }}
                  >
                    <div
                      style={{
                        alignSelf: 'stretch',
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                        alignItems: 'flex-start',
                        display: 'flex',
                        overflowY: 'auto',
                        height: showPriceBreakup ? '16vh' : '37vh',
                        // backgroundColor: 'red',
                      }}
                    >
                      {selectedItems.map((item, index) => (
                        <>
                          <div
                            key={item._id}
                            style={{
                              alignSelf: "stretch",
                              padding: 6,
                              background: "#FAFAFA",
                              borderBottom: "1px #F2F2F2 solid",
                              justifyContent: "center",
                              alignItems: "center",
                              gap: 16,
                              display: "flex",
                            }}
                          >
                            {/* {item.images && item.images.length > 0 && item.images[0] ? (
                              <img
                                style={{ width: 40, height: 40, borderRadius: 8, cursor: 'pointer', }}
                                src={item.images[0].url || item.images[0]}
                                alt=""
                                onClick={() => handleProductDiscountClick(item)}
                              />) : null} */}

                            {item.isBag ? (
                              <div
                                style={{
                                  width: "100%",
                                  alignSelf: "stretch",
                                  display: 'flex',
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <div
                                  style={{
                                    justifyContent: "center",
                                    alignItems: "center",
                                    gap: 10,
                                    display: "flex",
                                    // cursor: 'pointer',
                                  }}
                                >
                                  <div
                                    style={{
                                      overflow: "hidden",
                                      justifyContent: "center",
                                      alignItems: "center",
                                      display: "flex",
                                      gap: '5px'
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: 'flex',
                                        justifyContent: "center",
                                        alignItems: "center",
                                        gap: 4,
                                      }}
                                    >
                                      <div
                                        style={{
                                          color: "#888888",
                                          fontSize: 14,
                                          fontFamily: "Inter",
                                          fontWeight: "400",
                                          wordWrap: "break-word",
                                        }}
                                      >
                                        {item.quantity}x
                                      </div>
                                    </div>
                                    <div
                                      style={{
                                        alignSelf: "stretch",
                                        color: "#515457",
                                        fontSize: 14,
                                        fontFamily: "Inter",
                                        fontWeight: "500",
                                        wordWrap: "break-word",
                                      }}
                                    >
                                      {/* {item.name.length > 19 ? item.name.substring(0, 19) + '...' : item.name} */}
                                      {item.productName}
                                    </div>
                                  </div>
                                </div>
                                <div
                                  style={{
                                    alignSelf: "stretch",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    display: "flex",
                                    gap: 2,
                                  }}
                                >
                                  <div
                                    style={{
                                      flexDirection: "column",
                                      justifyContent: "flex-start",
                                      alignItems: "flex-start",
                                      gap: 8,
                                      display: "inline-flex",
                                    }}
                                  >
                                    <div
                                      style={{
                                        color: "#515457",
                                        fontSize: 14,
                                        fontFamily: "Inter",
                                        fontWeight: "600",
                                        wordWrap: "break-word",
                                      }}
                                    >
                                      {item.sellingPrice.toFixed(2)}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => removeItem(item._id)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: '#dc3545',
                                      cursor: 'pointer',
                                      fontSize: '16px',
                                      padding: '2px 6px',
                                      borderRadius: '4px'
                                    }}
                                    title="Remove item"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div
                                  style={{
                                    width: "100%",
                                    alignSelf: "stretch",
                                    display: 'flex',
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                  }}
                                >
                                  <div
                                    style={{
                                      justifyContent: "center",
                                      alignItems: "center",
                                      gap: 10,
                                      display: "flex",
                                      cursor: 'pointer',
                                    }}
                                    onClick={() => handleProductDiscountClick(item)}
                                  >
                                    <div
                                      style={{
                                        overflow: "hidden",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        display: "flex",
                                        gap: '5px'
                                      }}
                                    >
                                      <div
                                        style={{
                                          display: 'flex',
                                          justifyContent: "center",
                                          alignItems: "center",
                                          gap: 4,
                                        }}
                                      >
                                        <div
                                          style={{
                                            color: "#888888",
                                            fontSize: 14,
                                            fontFamily: "Inter",
                                            fontWeight: "400",
                                            wordWrap: "break-word",
                                          }}
                                        >
                                          {item.quantity}x
                                        </div>
                                      </div>
                                      <div
                                        style={{
                                          alignSelf: "stretch",
                                          color: "#515457",
                                          fontSize: 14,
                                          fontFamily: "Inter",
                                          fontWeight: "500",
                                          wordWrap: "break-word",
                                        }}
                                      >
                                        {/* {item.name.length > 19 ? item.name.substring(0, 19) + '...' : item.name} */}
                                        {item.productName.length > 15 ? item.productName.slice(0, 15) + '...' : item.productName}
                                      </div>
                                    </div>
                                  </div>
                                  <div
                                    style={{
                                      alignSelf: "stretch",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      display: "flex",
                                      gap: 2,
                                    }}
                                  >
                                    <div
                                      style={{
                                        flexDirection: "column",
                                        justifyContent: "flex-start",
                                        alignItems: "flex-start",
                                        gap: 8,
                                        display: "inline-flex",
                                      }}
                                    >
                                      <div
                                        style={{
                                          color: "#515457",
                                          fontSize: 14,
                                          fontFamily: "Inter",
                                          fontWeight: "600",
                                          wordWrap: "break-word",
                                        }}
                                      >
                                        ₹{item.sellingPrice}
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => removeItem(item._id)}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#dc3545',
                                        cursor: 'pointer',
                                        fontSize: '16px',
                                        padding: '2px 6px',
                                        borderRadius: '4px'
                                      }}
                                      title="Remove item"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </>
                      ))}
                    </div>

                    <div
                      style={{
                        alignSelf: 'stretch',
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                        alignItems: 'flex-start',
                        gap: 16,
                        display: 'flex',
                        marginTop: '15px'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-around',
                        alignItems: 'center',
                        width: '100%',
                        gap: '16px',
                      }}>
                        <div style={{
                          borderRadius: '8px',
                          border: '1px solid #D9D9D9',
                          padding: '8px 16px',
                          cursor: 'pointer',
                          color: '#515457',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          gap: '4px',
                          width: '50%',
                        }}>
                          <CiDiscount1 style={{ fontSize: '30px' }} />
                          <div style={{ fontSize: '15px', display: 'flex', flexDirection: 'column', lineHeight: '14px', justifyContent: 'center', alignItems: 'center' }}>
                            <span>Apply</span>
                            <span>Coupon</span>
                          </div>
                        </div>
                        <div
                          onClick={handleBagPopupChange}
                          style={{
                            borderRadius: '8px',
                            border: bagCharge > 0 ? '1px solid #1F7FFF' : '1px solid #D9D9D9',
                            padding: '8px 16px',
                            cursor: 'pointer',
                            color: '#515457',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '4px',
                            width: '50%',
                          }}>
                          {/* <CiDiscount1 style={{ 
                            fontSize: '30px', 
                            // color: '#1F7FFF' 
                            }} /> */}
                          {/* <div style={{ fontSize: '15px', display: 'flex', flexDirection: 'column', lineHeight: '14px', justifyContent: 'center', alignItems: 'center' }}>
                            <span>Additional</span>
                            <span>Charges</span>
                            </div> */}
                          <IoMdAddCircle style={{
                            fontSize: '30px',
                            color: bagCharge > 0 ? '#1F7FFF' : '',
                          }} />
                          <div style={{ fontSize: '15px', display: 'flex', flexDirection: 'column', lineHeight: '14px', justifyContent: 'center', alignItems: 'center', color: bagCharge > 0 ? '#1F7FFF' : '', }}>
                            {bagCharge > 0 ? <span>Bag Added</span> : <span>Add Bag</span>}
                          </div>
                        </div>
                      </div>
                      <div style={{ alignSelf: 'stretch', height: 1, background: '#D9D9D9' }} />

                      {showPriceBreakup && (
                        <>
                          <div
                            style={{
                              alignSelf: 'stretch',
                              flexDirection: 'column',
                              justifyContent: 'flex-start',
                              alignItems: 'flex-start',
                              gap: 8,
                              display: 'flex',
                            }}
                          >
                            <div
                              style={{
                                alignSelf: 'stretch',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                display: 'inline-flex',
                              }}
                            >
                              <div
                                style={{
                                  color: '#656B71',
                                  fontSize: 14,
                                  fontFamily: 'Inter',
                                  fontWeight: '400',
                                  wordWrap: 'break-word',
                                }}
                              >
                                Sub Total
                              </div>
                              <div
                                style={{
                                  color: '#101010',
                                  fontSize: 14,
                                  fontFamily: 'Inter',
                                  fontWeight: '400',
                                  wordWrap: 'break-word',
                                }}
                              >
                                ₹{subTotal.toFixed(2)}
                              </div>
                            </div>
                            <div
                              style={{
                                alignSelf: 'stretch',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                display: 'inline-flex',
                              }}
                            >
                              <div
                                style={{
                                  color: '#656B71',
                                  fontSize: 14,
                                  fontFamily: 'Inter',
                                  fontWeight: '400',
                                  wordWrap: 'break-word',
                                }}
                              >
                                Discount
                              </div>
                              <div
                                style={{
                                  color: '#101010',
                                  fontSize: 14,
                                  fontFamily: 'Inter',
                                  fontWeight: '400',
                                  wordWrap: 'break-word',
                                }}
                              >
                                - ₹{discount.toFixed(2)}
                              </div>
                            </div>
                            <div
                              style={{
                                alignSelf: 'stretch',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                display: 'inline-flex',
                              }}
                            >
                              <div
                                style={{
                                  color: '#656B71',
                                  fontSize: 14,
                                  fontFamily: 'Inter',
                                  fontWeight: '400',
                                  wordWrap: 'break-word',
                                }}
                              >
                                Taxes
                              </div>
                              <div
                                style={{
                                  color: '#101010',
                                  fontSize: 14,
                                  fontFamily: 'Inter',
                                  fontWeight: '400',
                                  wordWrap: 'break-word',
                                }}
                              >
                                + ₹{(totalTax).toFixed(2)}
                              </div>
                            </div>

                            {bagCharge > 0 && (
                              <div
                                style={{
                                  alignSelf: 'stretch',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  display: 'inline-flex',
                                }}
                              >
                                <div
                                  style={{
                                    color: '#656B71',
                                    fontSize: 14,
                                    fontFamily: 'Inter',
                                    fontWeight: '400',
                                    wordWrap: 'break-word',
                                  }}
                                >
                                  Bag Charges
                                </div>
                                <div
                                  style={{
                                    color: '#101010',
                                    fontSize: 14,
                                    fontFamily: 'Inter',
                                    fontWeight: '400',
                                    wordWrap: 'break-word',
                                  }}
                                >
                                  + ₹{bagCharge}
                                </div>
                              </div>)}

                            {appliedPoints > 0 && (
                              <div
                                style={{
                                  alignSelf: 'stretch',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  display: 'inline-flex',
                                }}
                              >
                                <div
                                  style={{
                                    color: '#656B71',
                                    fontSize: 14,
                                    fontFamily: 'Inter',
                                    fontWeight: '400',
                                    wordWrap: 'break-word',
                                  }}
                                >
                                  Points Applied
                                </div>
                                <div
                                  style={{
                                    color: '#101010',
                                    fontSize: 14,
                                    fontFamily: 'Inter',
                                    fontWeight: '400',
                                    wordWrap: 'break-word',
                                  }}
                                >
                                  🪙{(pointsToApply)} = ₹{(pointsToApply) * 5}
                                </div>
                              </div>)}

                            <div
                              style={{
                                alignSelf: 'stretch',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                display: 'inline-flex',
                              }}
                            >
                              <div
                                style={{
                                  color: '#656B71',
                                  fontSize: 14,
                                  fontFamily: 'Inter',
                                  fontWeight: '400',
                                  wordWrap: 'break-word',
                                }}
                              >
                                Round Off
                              </div>
                              <div
                                style={{
                                  color: '#101010',
                                  fontSize: 14,
                                  fontFamily: 'Inter',
                                  fontWeight: '400',
                                  wordWrap: 'break-word',
                                }}
                              >
                                ₹{((roundedAmount) - ((subTotal - discount) + totalTax + bagCharge)).toFixed(2)}
                              </div>
                            </div>

                          </div>
                          <div style={{ alignSelf: 'stretch', height: 1, background: '#D9D9D9' }} />
                        </>
                      )}

                      {!showPriceBreakup && (<div style={{ display: 'flex', justifyContent: 'end', alignItems: 'center', width: '100%', cursor:'pointer' }}>
                        <span onClick={() => setShowPriceBreakup(true)} style={{ color: '#1368EC' }}>View Price Breakup</span>
                      </div>)}

                      {showPriceBreakup && (<div style={{ display: 'flex', justifyContent: 'end', alignItems: 'center', width: '100%', cursor:'pointer' }}>
                        <span onClick={() => setShowPriceBreakup(false)} style={{ color: '#1368EC' }}>Hide Price Breakup</span>
                      </div>)}

                      <div
                        style={{
                          alignSelf: 'stretch',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          display: 'inline-flex',
                        }}
                      >
                        <div
                          style={{
                            color: '#0C0C0C',
                            fontSize: 20,
                            fontFamily: 'Inter',
                            fontWeight: '500',
                            wordWrap: 'break-word',
                          }}
                        >
                          Total
                        </div>
                        <div
                          style={{
                            color: '#0C0C0C',
                            fontSize: 20,
                            fontFamily: 'Inter',
                            fontWeight: '500',
                            wordWrap: 'break-word',
                          }}
                        >
                          ₹{roundedAmount}
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Payment Methods button */}
                  {!proceedToPay && (
                    <button
                      onClick={() => setProceedToPay(true)}
                      disabled={!selectedCustomer}
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '10px 16px',
                        backgroundColor: selectedCustomer ? '#1368EC' : '#5991e6ff',
                        borderRadius: '8px',
                        color: 'white',
                        marginTop: '16px',
                        cursor: selectedCustomer ? 'pointer' : 'not-allowed',
                        border: '1px solid #1368EC',
                        width: '100%'
                      }}>
                      <span style={{ fontSize: '18px' }}>Proceed to Pay <MdKeyboardDoubleArrowRight /></span>
                    </button>)}

                  {proceedToPay && (<div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '10px 16px',
                        backgroundColor: selectedPaymentMethod === 'cash' ? '#1368EC' : 'white',
                        borderRadius: '8px',
                        color: selectedPaymentMethod === 'cash' ? 'white' : '#1368EC',
                        marginTop: '16px',
                        cursor: 'pointer',
                        border: '1px solid #E6E6E6',
                      }}
                      onClick={() => {
                        setSelectedPaymentMethod('cash');
                        handleCashPopupChange();
                      }}
                    >
                      <span>Cash</span>
                      <span>[F1]</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0px', width: '100%', gap: '5px', }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '10px 15px',
                          backgroundColor: selectedPaymentMethod === 'card' ? '#1368EC' : 'white',
                          borderRadius: '10px',
                          border: '1px solid #E6E6E6',
                          width: '100%',
                          color: selectedPaymentMethod === 'card' ? 'white' : '#1368EC',
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          setSelectedPaymentMethod('card');
                          handleCardPopupChange();
                        }}
                      >
                        <span>Card</span>
                        <span>[F2]</span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '10px 15px',
                          backgroundColor: selectedPaymentMethod === 'upi' ? '#1368EC' : 'white',
                          borderRadius: '10px',
                          border: '1px solid #E6E6E6',
                          width: '100%',
                          color: selectedPaymentMethod === 'upi' ? 'white' : '#1368EC',
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          setSelectedPaymentMethod('upi');
                          handleUpiPopupChange();
                        }}
                      >
                        <span>UPI</span>
                        <span>[F3]</span>
                      </div>
                    </div>
                  </div>)}
                </>
              )}

            </div>

          </div>

        </div>

        {/* ALL POPUPS */}

        {/* customers popup */}
        {popup && (
          <div style={{
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(199, 197, 197, 0.4)',
            backdropFilter: 'blur(1px)',
            display: 'flex',
            justifyContent: 'center',
            zIndex: '10',
            overflowY: 'auto',
          }}
          >
            <div ref={formRef} style={{ width: '760px', height: '500px', margin: 'auto', marginTop: '80px', marginBottom: '80px', padding: '10px 16px', overflowY: 'auto', borderRadius: '8px' }}>

              {/* Search Box */}
              <div style={{ position: 'relative', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #E1E1E1', borderRadius: '8px', backgroundColor: '#fff', padding: '6px 12px' }}>
                  <IoSearch style={{ fontSize: '20px', marginRight: '10px', color: '#C2C2C2' }} />
                  <input
                    type="text"
                    placeholder="Search by name, email, or phone number..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    style={{ width: '100%', padding: '8px', fontSize: '16px', border: 'none', outline: 'none', color: '#333' }}
                  />
                </div>

                {/* Search Results Dropdown */}
                {showDropdown && searchResults.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: '1px solid #E1E1E1',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    zIndex: 1000
                  }}>
                    {searchResults.map((customer) => (
                      <div
                        key={customer._id}
                        onClick={() => handleCustomerSelect(customer)}
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid #f0f0f0',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                      >
                        <div style={{ fontWeight: '600', color: '#333' }}>
                          {customer.name || 'No Name'}
                        </div>
                        <div style={{ fontSize: '14px', color: '#666' }}>
                          {customer.phone || 'No Phone'}
                          {customer.email && ` • ${customer.email}`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* No Results Message */}
                {showDropdown && searchResults.length === 0 && searchQuery.trim() !== '' && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: '1px solid #E1E1E1',
                    borderRadius: '8px',
                    padding: '16px',
                    textAlign: 'center',
                    color: '#666',
                    zIndex: 1000
                  }}>
                    No customers found matching "{searchQuery}"
                  </div>
                )}
              </div>

              {/* Add New Customer Button */}
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #1368EC', borderRadius: '8px', backgroundColor: '#f8f9ff', padding: '12px 16px', cursor: 'pointer', marginTop: '20px' }} onClick={handleAddCustomerPopupChange}>
                <GoPersonAdd style={{ fontSize: '24px', marginRight: '10px', color: '#1368EC' }} />
                <div style={{ fontSize: '16px', color: '#1368EC', fontWeight: '500' }}>
                  Add New Customer
                </div>
              </div>

              {/* Selected Customer Info (if any) */}
              {selectedCustomer && (
                <div style={{
                  marginTop: '20px',
                  padding: '16px',
                  backgroundColor: '#e8f5e8',
                  border: '1px solid #4caf50',
                  borderRadius: '8px'
                }}>
                  <div style={{ fontWeight: '600', color: '#2e7d32', marginBottom: '8px' }}>
                    Selected Customer Details:
                  </div>
                  <div style={{ color: '#333' }}>
                    <div>Name: <strong>{selectedCustomer.name && selectedCustomer.name}</strong></div>
                    <div>Phone: <strong>{selectedCustomer.phone && selectedCustomer.phone}</strong></div>
                    {selectedCustomer.email && <div>Email: {selectedCustomer.email}</div>}
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

        {/* cash details payment popup */}
        {cashpopup && (
          <>
            <div style={{
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
              <div ref={CashRef} style={{ width: '500px', padding: '10px 16px', overflowY: 'auto', backgroundColor: '#fff', border: '1px solid #E1E1E1', borderRadius: '8px' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E1E1E1', padding: '10px 0px' }}>
                  <span>Cash: <span style={{ color: 'black' }}>₹{roundedAmount}</span></span>

                  <div style={{ position: 'relative', top: '-5px', right: '-2px' }}>
                    <span style={{ backgroundColor: 'red', color: 'white', padding: '5px 11px', borderRadius: '50%', cursor: 'pointer', fontSize: '15px' }} onClick={closeCash}>x</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0px', width: '100%', gap: '15px', marginTop: '5px', }}>
                  <div style={{ width: '100%' }}>
                    <span>Amount Received</span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 15px', backgroundColor: 'white', borderRadius: '10px', border: '1px solid #E6E6E6', width: '100%', marginTop: '5px' }}>
                      <input type="text" placeholder="₹00.00" style={{ border: 'none', outline: 'none', width: '100%' }} value={amountReceived} onChange={(e) => setAmountReceived(e.target.value)} />
                    </div>
                  </div>
                  <div style={{ width: '100%' }}>
                    <span>Change to return</span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 15px', backgroundColor: 'white', borderRadius: '10px', border: '1px solid #E6E6E6', width: '100%', marginTop: '5px' }}>
                      <span>₹{changeToReturn}</span>
                    </div>
                  </div>
                </div>

                {dueAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0px', width: '100%', gap: '15px', marginTop: '5px', }}>
                    <div style={{ width: '100%' }}>
                      <span style={{ color: '#dc3545', fontWeight: '600' }}>Due Amount</span>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 15px', backgroundColor: '#fff5f5', borderRadius: '10px', border: '1px solid #dc3545', width: '100%', marginTop: '5px' }}>
                        <span style={{ color: '#dc3545', fontWeight: '600' }}>₹{dueAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', marginBottom: '8px' }}>
                  <div></div>
                  <div
                    style={{
                      padding: '6px 15px',
                      backgroundColor: '#1368EC',
                      borderRadius: '8px',
                      color: 'white',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      if (amountReceived && Number(amountReceived) > 0) {
                        createPosSale('Cash', Number(amountReceived), changeToReturn);
                        setCashPopup(false);
                      } else {
                        alert('Please enter a valid amount received');
                      }
                    }}
                  >
                    <span>Record Payment</span>
                  </div>
                </div>

              </div>
            </div>
          </>
        )}

        {/* add card popup */}
        {cardpopup && (
          <>
            <div style={{
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
              <div ref={CardRef} style={{ width: '500px', padding: '10px 16px', overflowY: 'auto', backgroundColor: '#fff', border: '1px solid #E1E1E1', borderRadius: '8px' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E1E1E1', padding: '10px 0px' }}>
                  <span>Enter Card details</span>

                  <div style={{ position: 'relative', top: '-5px', right: '-2px' }}>
                    <span style={{ backgroundColor: 'red', color: 'white', padding: '5px 11px', borderRadius: '50%', cursor: 'pointer', fontSize: '15px' }} onClick={closeCard}>x</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0px', width: '100%', gap: '15px', marginTop: '5px', }}>
                  <div style={{ width: '100%' }}>
                    <span>Card Number</span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 15px', backgroundColor: '#F9FAFB', borderRadius: '10px', border: '1px solid #E6E6E6', width: '100%', marginTop: '5px' }}>
                      <input
                        type="text"
                        placeholder='1234567890123456'
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        maxLength={16}
                        style={{ border: 'none', outline: 'none', width: '100%', backgroundColor: '#F9FAFB' }}
                        required
                      />
                    </div>
                    {cardNumber && cardNumber.length !== 16 && (
                      <div style={{ fontSize: '12px', color: 'red', marginTop: '2px' }}>
                        Card number must be exactly 16 digits
                      </div>
                    )}
                  </div>
                  <div style={{ width: '100%' }}>
                    <span>Name on Card</span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 15px', backgroundColor: '#F9FAFB', borderRadius: '10px', border: '1px solid #E6E6E6', width: '100%', marginTop: '5px' }}>
                      <input
                        type="text"
                        placeholder='Enter Card Holder Name'
                        value={cardHolderName}
                        onChange={handleCardHolderNameChange}
                        style={{ border: 'none', outline: 'none', width: '100%', backgroundColor: '#F9FAFB' }}
                        required
                      />
                    </div>
                    {cardHolderName && !/^[a-zA-Z\s]+$/.test(cardHolderName) && (
                      <div style={{ fontSize: '12px', color: 'red', marginTop: '2px' }}>
                        Name should contain only letters and spaces
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0px', width: '50%', gap: '15px', marginTop: '2px', }}>
                  <div style={{ width: '100%' }}>
                    <span>Valid till</span>
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 15px', backgroundColor: '#F9FAFB', borderRadius: '10px', border: '1px solid #E6E6E6', width: '100%', marginTop: '5px' }}>
                      <input
                        type="text"
                        placeholder='MM/YY'
                        value={validTill}
                        onChange={handleValidTillChange}
                        maxLength={5}
                        style={{ border: 'none', outline: 'none', width: '100%', backgroundColor: '#F9FAFB' }}
                        required
                      />
                    </div>
                    {validTill && validTill.length > 0 && validTill.length < 5 && (
                      <div style={{ fontSize: '12px', color: 'red', marginTop: '2px' }}>
                        Format: MM/YY (e.g., 12/25)
                      </div>
                    )}
                  </div>
                  <div style={{ width: '100%' }}>
                    <span>CVV</span>
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 15px', backgroundColor: '#F9FAFB', borderRadius: '10px', border: '1px solid #E6E6E6', width: '100%', marginTop: '5px' }}>
                      <input
                        type="text"
                        placeholder='123'
                        value={cvv}
                        onChange={handleCvvChange}
                        maxLength={3}
                        style={{ border: 'none', outline: 'none', width: '100%', backgroundColor: '#F9FAFB' }}
                        required
                      />
                    </div>
                    {cvv && cvv.length !== 3 && (
                      <div style={{ fontSize: '12px', color: 'red', marginTop: '2px' }}>
                        CVV must be exactly 3 digits
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', marginBottom: '8px' }}>
                  <div></div>
                  <div style={{ padding: '3px 10px', backgroundColor: 'white', border: '2px solid #E6E6E6', borderRadius: '8px', color: '#676767' }}>
                    <span>Send OTP</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '8px' }}>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        type="text"
                        maxLength="1"
                        value={digit}
                        ref={otpRefs[idx]}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        placeholder='0'
                        style={{ color: '#C2C2C2', width: '60px', height: '60px', textAlign: 'center', borderRadius: '8px', padding: '8px', backgroundColor: '#F5F5F5', outline: 'none', border: 'none', fontSize: '50px' }}
                      />
                    ))}
                  </div>
                  <div style={{ marginTop: '10px', fontSize: '14px' }}>
                    <span>Have not received the OTP? </span>
                    <span style={{ color: '#1368EC' }}>Send again</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', marginBottom: '8px' }}>
                  <div></div>
                  <div
                    style={{
                      padding: '3px 10px',
                      backgroundColor: '#1368EC',
                      border: '2px solid #E6E6E6',
                      borderRadius: '8px',
                      color: 'white',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      createPosSale('Card');
                      setCardPopup(false);
                    }}
                  >
                    <span>Proceed to Pay</span>
                  </div>
                </div>

              </div>
            </div>
          </>
        )}

        {/* add bag popup */}
        {bagpopup && (
          <>
            <div style={{
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
              <div ref={BagRef} style={{ width: 'auto', height: '365px', padding: '10px 16px', overflowY: 'auto', backgroundColor: '#F2F6F9', border: '1px solid #E1E1E1', borderRadius: '8px' }}>

                <div style={{ display: 'flex', justifyContent: bags.length > 0 ? 'space-between' : 'end', padding: '10px 0px', alignItems: 'center' }}>
                  {bags.length > 0 && (
                    <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-start' }}>
                      <div
                        onClick={handleAddBagPopupChange}
                        style={{
                          borderRadius: '8px',
                          border: '1px dashed #1F7FFF',
                          backgroundColor: '#fff',
                          padding: '8px 16px',
                          cursor: 'pointer',
                          color: '#515457',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          gap: '4px',
                          width: '180px',
                        }}>
                        <IoMdAddCircle style={{
                          fontSize: '20px',
                          color: '#1F7FFF',
                        }} />
                        <div style={{ fontSize: '15px', display: 'flex', flexDirection: 'column', lineHeight: '14px', justifyContent: 'center', alignItems: 'center', color: '#1F7FFF', }}>
                          <span>Add New Bag</span>
                        </div>
                      </div>
                      <div
                        onClick={isDeleteMode ? handleDeleteSelectedBags : handleToggleDeleteMode}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          color: isDeleteMode ? 'white' : '#515457',
                          backgroundColor: isDeleteMode ? 'red' : 'transparent',
                          borderRadius: '8px',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          gap: '4px',
                        }}>
                        {isDeleteMode ? (
                          <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                            Delete {selectedBagsToDelete.length}
                          </span>
                        ) : (
                          <img src={deletebtn} alt="" style={{ width: '20px' }} />
                        )}
                      </div>
                      {isDeleteMode && (
                        <div
                          onClick={handleToggleDeleteMode}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            color: '#515457',
                            border: '1px solid #ccc',
                            borderRadius: '8px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <span style={{ fontSize: '14px' }}>Cancel</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ position: 'relative', top: '-5px', right: '-2px' }}>
                    <span style={{ backgroundColor: 'red', color: 'white', padding: '5px 11px', borderRadius: '50%', cursor: 'pointer', fontSize: '15px' }} onClick={closeBag}>x</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '40px', padding: '30px 30px 40px 30px', minWidth: '680px', maxWidth: 'auto', minHeight: '280px', maxHeight: 'auto' }}>

                  {bags.map((bag) => (
                    <div
                      key={bag._id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        cursor: 'pointer',
                        padding: '10px',
                        borderRadius: '8px',
                        transition: '0.2s',
                        backgroundColor: '#fff',
                        width: '180px', // Match Add Button width
                        position: 'relative'
                      }}
                      onClick={() => isDeleteMode ? handleSelectBagToDelete(bag._id) : handleBagSelection(bag.price, bag.name)}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      {isDeleteMode && (
                        <div style={{
                          position: 'absolute',
                          top: '15px',
                          right: '15px',
                          zIndex: 10
                        }}>
                          <input
                            type="checkbox"
                            checked={selectedBagsToDelete.includes(bag._id)}
                            onChange={() => { }} // handled by parent div click
                            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                          />
                        </div>
                      )}
                      <div style={{ width: '150px', height: '150px', border: '1px solid #d4d4d4ff', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '8px', overflow: 'hidden' }}>
                        <img
                          src={bag.image || BagSmall}
                          alt={bag.name}
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          onError={(e) => { e.target.src = BagSmall }}
                        />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', gap: '10px', width: '100%' }}>
                        <span style={{ fontSize: '15px', color: '#797777ff', fontWeight: '500' }}>{bag.name}</span>
                        <span style={{ fontSize: '16px', color: '#5f5e5eff', fontWeight: '700' }}>₹{bag.price}</span>
                      </div>
                    </div>
                  ))}

                  {bags.length === 0 && (<div
                    onClick={handleAddBagPopupChange}
                    style={{
                      borderRadius: '8px',
                      border: '1px dashed #1F7FFF',
                      backgroundColor: '#fff',
                      padding: '18px 16px',
                      cursor: 'pointer',
                      color: '#515457',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '4px',
                      width: '180px',
                    }}>
                    <IoMdAddCircle style={{
                      fontSize: '30px',
                      color: '#1F7FFF',
                    }} />
                    <div style={{ fontSize: '15px', display: 'flex', flexDirection: 'column', lineHeight: '14px', justifyContent: 'center', alignItems: 'center', color: '#1F7FFF', }}>
                      <span>Add New Bag</span>
                    </div>
                  </div>)}

                </div>

              </div>
            </div>
          </>
        )}

        {addbagpopup && (
          <>
            <div style={{
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
              <div ref={addBagRef} style={{ width: 'auto', height: 'auto', padding: '10px 16px', overflowY: 'auto', backgroundColor: '#F2F6F9', border: '1px solid #E1E1E1', borderRadius: '8px' }}>

                <div style={{ display: 'flex', justifyContent: 'end', padding: '10px 0px' }}>
                  {/* <span style={{fontSize:'20px'}}>Select Bag Type</span> */}

                  <div style={{ position: 'relative', top: '-5px', right: '-2px' }}>
                    <span style={{ backgroundColor: 'red', color: 'white', padding: '5px 11px', borderRadius: '50%', cursor: 'pointer', fontSize: '15px' }} onClick={closeAddBagForm}>x</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '40px', padding: '0px 30px 20px 30px', width: '440px', height: 'auto' }}>

                  <form onSubmit={handleSaveBag}>
                    {/* bag name */}
                    <div className="add-category-form d-flex gap-3 pt-3 pb-3" style={{ width: '400px' }}>
                      <div className="d-flex flex-column gap-1 w-100">
                        <label
                          htmlFor=""
                          style={{
                            color: "black",
                            fontFamily: "Inter",
                            fontSize: "13px",
                          }}
                        >
                          Enter Bag Name <span style={{ color: "red" }}>*</span>
                        </label>
                        <input
                          className="border-hover"
                          type="text"
                          placeholder="Enter Name"
                          value={newBagName}
                          onChange={(e) => setNewBagName(e.target.value)}
                          style={{
                            border: "1px solid #dfddddff",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            outline: "none",
                          }}
                        />
                        {errors.expenseTitle && (
                          <small style={{ color: "red", fontSize: "12px" }}>
                            {errors.expenseTitle}
                          </small>
                        )}
                      </div>
                    </div>

                    <div className="add-category-form d-flex gap-3 pb-3" style={{ width: '400px' }}>
                      {/* Expense Amount */}
                      <div className="d-flex flex-column gap-1 w-100">
                        <label
                          htmlFor=""
                          style={{
                            color: "black",
                            fontFamily: "Inter",
                            fontSize: "13px",
                          }}
                        >
                          Enter Amount <span style={{ color: "red" }}>*</span>
                        </label>
                        <input
                          type="number"
                          className="border-hover"
                          placeholder="Enter Amount"
                          value={newBagPrice}
                          onChange={(e) => setNewBagPrice(e.target.value)}
                          name=""
                          id=""
                          style={{
                            border: "1px solid #dfddddff",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            fontFamily: "Inter",
                            color: "grey",
                            outline: "none",
                          }}
                        />
                        {errors.amount && (
                          <small style={{ color: "red", fontSize: "12px" }}>
                            {errors.amount}
                          </small>
                        )}
                      </div>

                    </div>

                    {/* Upload */}
                    <div className="add-category-form d-flex gap-3 pb-3">
                      <div>
                        <div
                          style={{
                            width: "150px",
                            height: "150px",
                            border: "2px dashed #d1d5db",
                            backgroundColor: '#fff',
                            borderRadius: "8px",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            cursor: "pointer",
                            flexDirection: "column",
                            fontSize: "12px",
                            color: "#9ca3af",
                            position: 'relative',
                            objectFit: "cover",
                          }}
                          onClick={() => fileSelectRef.current && fileSelectRef.current.click()}
                        >
                          <span role="img" aria-label="upload" >
                            {files.length > 0 ? files.map((f, i) => (
                              f.type === "application/pdf" ? (
                                <div key={i} style={{
                                  width: "120px", height: "120px",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  border: "1px solid #ddd", borderRadius: "6px", marginRight: "10px",
                                  backgroundColor: "#f9f9f9", fontSize: "12px", fontWeight: "500"
                                }}>
                                  📄 {f.name}
                                </div>
                              ) : (
                                <div key={i} style={{
                                  width: "120px", height: "120px",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  backgroundColor: "#f9f9f9", fontSize: "12px", fontWeight: "500"
                                }}>
                                  <img
                                    key={i}
                                    src={URL.createObjectURL(f)}
                                    alt="preview"
                                    style={{ width: "100%", height: "100%", objectFit: 'contain', borderRadius: "6px", }}
                                  />
                                </div>
                              )
                            )) : (
                              <>
                                <div
                                  style={{
                                    width: "26px",
                                    height: "26px",
                                    borderRadius: "999px",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    fontSize: "18px",
                                  }}
                                >
                                  <RiImageAddFill />
                                </div>
                              </>
                            )}
                          </span>

                          <input
                            id="receipt-upload"
                            type="file"
                            accept="image/png, image/jpeg, application/pdf"
                            multiple
                            style={{ display: "none" }}
                            onChange={handleFileChange}
                            ref={fileSelectRef}
                          />

                        </div>

                        {errors.receipt && (
                          <small style={{ color: "red", fontSize: "12px" }}>
                            {errors.receipt}
                          </small>
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="button-hover"
                      style={{
                        backgroundColor: "rgb(31, 127, 255)",
                        fontFamily: "Inter",
                        border: "none",
                        borderRadius: "8px",
                        padding: "4px 8px",
                        color: "white",
                      }}
                    >
                      Save
                    </button>
                  </form>

                </div>

              </div>
            </div>
          </>
        )}

        {/* upi payment popup */}
        {upipopup && (
          <>
            <div style={{
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
              <div ref={UpiRef} style={{ width: '400px', padding: '10px 16px', overflowY: 'auto', backgroundColor: '#fff', border: '1px solid #E1E1E1', borderRadius: '8px' }}>

                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px 0px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div>
                      <img src={Upi} alt="UPI" style={{ width: '200px', marginTop: '10px' }} />
                    </div>
                    <div style={{ width: '108%', marginTop: '10px', background: 'linear-gradient(to right, #E3EDFF, #FFFFFF)', marginLeft: '-24px', marginRight: '-24px', padding: '10px 16px', }}>
                      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', }}>
                        <span style={{ fontSize: '20px', fontWeight: '600' }}>{companyDetails.companyName}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '600', marginBottom: '20px', marginTop: '10px', color: '#1368EC' }}>
                      ₹{roundedAmount}.00
                    </div>
                    <div style={{ margin: 'auto', width: '50%', }}>
                      <div style={{ padding: '0px', border: '2px dashed #ccc', borderRadius: '8px', marginBottom: '20px' }}>
                        <img src={qrCodeUrl} alt="QR Code" style={{ width: '100%', height: '100%' }} />
                      </div>
                    </div>
                    <div
                      style={{
                        padding: '12px 24px',
                        backgroundColor: '#1368EC',
                        color: 'white',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'inline-block'
                      }}
                      onClick={() => {
                        createPosSale('UPI', Number(roundedAmount), changeToReturn);
                        setUpiPopup(false);
                      }}
                    >
                      Complete
                    </div>
                    <div>
                      <img src={Banks} alt="UPI" style={{ width: '350px', marginTop: '20px' }} />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </>
        )}

        {/* transaction details popup */}
        {transactionpopup && (
          <>
            <div style={{
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
              <div ref={TransactionRef} style={{ width: '70vw', height: 'auto', padding: '10px 16px', overflowY: 'auto', backgroundColor: '#fff', border: '1px solid #E1E1E1', borderRadius: '8px', position: 'relative' }}>

                <div style={{ border: '1px solid #E1E1E1', padding: '5px 0px', borderRadius: '8px', alignItems: 'center', marginTop: '5px' }} >

                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '5px 20px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      {searchdrop ? (
                        <>
                          <div style={{ border: 'none', marginLeft: '10px', alignItems: 'center', display: 'flex', width: '600px' }}>
                            <IoIosSearch style={{ fontSize: '25px' }} />
                            <input
                              type='text'
                              placeholder='Search by invoice ID, customer name, phone, or item name...'
                              value={transactionSearchQuery}
                              onChange={(e) => handleTransactionSearch(e.target.value)}
                              style={{ border: 'none', outline: 'none', fontSize: '20px', width: '100%', color: '#333' }}
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                            <div
                              style={{
                                backgroundColor: activeQuickFilter === 'all' ? '#1368EC' : '#ccc',
                                color: activeQuickFilter === 'all' ? 'white' : 'black',
                                padding: '5px 8px',
                                borderRadius: '6px',
                                cursor: 'pointer'
                              }}
                              onClick={() => handleQuickFilter('all')}
                            >
                              All
                            </div>
                            <div
                              style={{
                                backgroundColor: activeQuickFilter === 'paid' ? '#1368EC' : 'transparent',
                                color: activeQuickFilter === 'paid' ? 'white' : 'black',
                                padding: '5px 8px',
                                borderRadius: '6px',
                                cursor: 'pointer'
                              }}
                              onClick={() => handleQuickFilter('paid')}
                            >
                              Paid
                            </div>
                            <div
                              style={{
                                backgroundColor: activeQuickFilter === 'due' ? '#1368EC' : 'transparent',
                                color: activeQuickFilter === 'due' ? 'white' : 'black',
                                padding: '5px 8px',
                                borderRadius: '6px',
                                cursor: 'pointer'
                              }}
                              onClick={() => handleQuickFilter('due')}
                            >
                              Due
                            </div>
                            <div
                              style={{
                                color: 'black',
                                padding: '5px 8px',
                                cursor: 'pointer',
                                backgroundColor: '#f0f0f0',
                                borderRadius: '4px'
                              }}
                              onClick={() => {
                                const statusFilter = activeQuickFilter === 'all' ? categoryValue : activeQuickFilter;
                                fetchPosSales(currentPage, transactionSearchQuery, statusFilter, socketValue);
                              }}
                              title="Refresh"
                            >
                              ↻
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      {searchdrop ? (
                        <></>) : (<>
                          <div style={{ color: 'black', padding: '3px 8px', borderRadius: '6px', border: '2px solid #ccc', display: 'flex', gap: '10px', alignItems: 'center', cursor: 'pointer' }} value={searchdrop} onClick={handleSearchDropChange}>
                            <IoSearch />
                            <CgSortAz style={{ fontSize: '25px' }} />
                          </div>
                        </>)}
                      <div style={{ color: 'black', padding: '7px 8px', borderRadius: '6px', border: '2px solid #ccc', display: 'flex', gap: '10px', alignItems: 'center', cursor: 'pointer' }} onClick={handleClear}><TbArrowsSort /></div>
                      <div style={{}}>
                        <span style={{ backgroundColor: 'red', color: 'white', padding: '3px 11px', borderRadius: '50%', cursor: 'pointer', fontSize: '20px' }} onClick={handlePopupClose}>x</span>
                      </div>
                    </div>
                  </div>

                  {searchdrop ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 10px', }}>

                        <div style={{ marginTop: "4px", display: 'flex', gap: '10px' }}>
                          <div style={{ border: '2px solid #ccc', padding: '1px 5px 0px 8px', alignItems: 'center', display: 'flex', borderRadius: '6px', backgroundColor: '#f6f6f6' }}>
                            <div style={{ outline: 'none', border: 'none', color: '#555252' }}> Filter <CgSortAz style={{ fontSize: '30px' }} /></div>
                          </div>

                          <div
                            style={{ border: categoryValue ? '2px dashed #1368EC' : '2px dashed #ccc', padding: '0px 10px 0px 8px', alignItems: 'center', display: 'flex', borderRadius: '6px' }}>
                            <select
                              className=""
                              style={{ outline: 'none', border: 'none', color: categoryValue ? '#1368EC' : '#555252' }}
                              value={categoryValue}
                              onChange={handleCategoryChange}
                            >
                              <option value="" style={{ color: '#555252' }}>--Status--</option>
                              <option value="paid" style={{ color: '#555252' }}>Paid</option>
                              <option value="due" style={{ color: '#555252' }}>Due</option>
                            </select>
                          </div>

                          <div
                            style={{ border: socketValue ? '2px dashed #1368EC' : '2px dashed #ccc', padding: '0px 10px 0px 8px', alignItems: 'center', display: 'flex', borderRadius: '6px' }}>
                            <select
                              className=""
                              style={{ outline: 'none', border: 'none', color: socketValue ? '#1368EC' : '#555252' }}
                              value={socketValue}
                              onChange={handleSocketChange}
                            >
                              <option value="" style={{ color: '#555252' }}>--Payment Method--</option>
                              <option value="cash" style={{ color: '#555252' }}>Cash</option>
                              <option value="upi" style={{ color: '#555252' }}>UPI</option>
                              <option value="card" style={{ color: '#555252' }}>Card</option>
                            </select>
                          </div>

                          {/* <div
                          style={{ border: warehouseValue ? '2px dashed #1368EC' : '2px dashed #ccc', padding: '0px 10px 0px 8px', alignItems: 'center', display: 'flex', borderRadius: '6px' }}
                          value={warehouseValue}
                          onChange={handleWarehouseChange}>
                          <select className="" style={{ outline: 'none', border: 'none', color: warehouseValue ? '#1368EC' : '#555252' }}>
                            <option value="" style={{ color: '#555252' }}>Warehouse</option>
                            <option value="wh1" style={{ color: '#555252' }}>Warehouse 1</option>
                          </select>
                        </div> */}

                          {/* <div
                          style={{ border: exprationValue ? '2px dashed #1368EC' : '2px dashed #ccc', padding: '0px 10px 0px 3px', alignItems: 'center', display: 'flex', borderRadius: '6px' }}
                          value={exprationValue}
                          onChange={handleExprationChange}>
                          <select className="" style={{ outline: 'none', border: 'none', color: exprationValue ? '#1368EC' : '#555252' }}>
                            <option value="" style={{ color: '#555252' }}>Expiration</option>
                            <option value="e1" style={{ color: '#555252' }}>Expiration 1</option>
                          </select>
                        </div> */}
                          <div
                            style={{ color: 'black', padding: '2px 8px', borderRadius: '6px', border: '2px solid #ccc', display: 'flex', alignItems: 'center', cursor: 'pointer', backgroundColor: '#f6f6f6' }}
                            onClick={handleClear}
                          >
                            <span>Clear</span>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (<></>)}

                </div>

                <div style={{ border: '1px solid #ccc', marginTop: '10px', borderRadius: '8px', height: '60vh', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: '#E6E6E6' }}>
                      <tr style={{ color: "#676767", }}>
                        <th style={{ padding: '8px', borderTopLeftRadius: '8px' }}>Invoice ID</th>
                        <th>Customer</th>
                        <th>Sold Items</th>
                        <th>Date & Time</th>
                        <th>Total Amount</th>
                        <th>Points Used</th>
                        <th>Due Amount</th>
                        <th>Payment Method</th>
                        <th style={{ borderTopRightRadius: '8px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
                            Loading...
                          </td>
                        </tr>
                      ) : posSales.length === 0 ? (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
                            No transactions found
                          </td>
                        </tr>
                      ) : (
                        posSales.map((sale) => (
                          <tr key={sale._id} style={{ borderBottom: '1px solid #E6E6E6' }}>
                            <td style={{ padding: '8px', position: 'relative', width: '140px' }}>
                              <div style={{ fontSize: '12px', fontWeight: '600', color: '#1368EC', top: '7px', position: 'absolute', }}>
                                {sale.invoiceNumber || 'N/A'}
                              </div>
                            </td>
                            <td style={{ padding: '8px', position: 'relative', }}>
                              <div style={{ top: '5px', position: 'absolute', }}>
                                <div style={{ fontWeight: '600' }}>{sale.customer?.name || 'N/A'}</div>
                                <div style={{ fontSize: '12px', color: '#666' }}>{sale.customer?.phone || 'N/A'}</div>
                              </div>
                            </td>
                            <td style={{ padding: '8px', }}>
                              <div style={{ fontSize: '12px' }}>
                                {sale.items?.map((item, index) => (
                                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    {item.images && item.images.length > 0 ? (
                                      <img
                                        src={item.images[0]}
                                        alt={item.productName}
                                        style={{
                                          width: '30px',
                                          height: '30px',
                                          objectFit: 'cover',
                                          borderRadius: '4px',
                                          border: '1px solid #ddd'
                                        }}
                                      />
                                    ) : null}
                                    <div>
                                      <div style={{ fontWeight: '500' }}>{item.productName || 'N/A'}</div>
                                      <div style={{ fontSize: '11px', color: '#666' }}>
                                        Qty: {item.quantity} × ₹{item.unitPrice?.toFixed(2) || '0.00'}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td style={{ position: 'relative', }}>
                              <div style={{ top: '5px', position: 'absolute', }}>
                                {new Date(sale.saleDate).toLocaleDateString('en-IN')}
                                <br />
                                <span style={{ fontSize: '12px', color: '#666' }}>
                                  {new Date(sale.saleDate).toLocaleTimeString('en-IN')}
                                </span>
                              </div>
                            </td>
                            <td style={{ position: 'relative', }}>
                              <div style={{ top: '5px', position: 'absolute', }}>
                                ₹{sale.totals?.totalAmount?.toFixed(2) || '0.00'}
                              </div>
                            </td>
                            <td style={{ position: 'relative', }}>
                              <div style={{ top: '5px', position: 'absolute', }}>
                                🪙 {sale.pointsUsed || '0'} = ₹{sale.pointsUsed * 5 || '0.00'}
                              </div>
                            </td>
                            <td style={{ position: 'relative', }}>
                              <div style={{ top: '5px', position: 'absolute', }}>
                                {sale.paymentDetails?.dueAmount > 0 ? (
                                  <span style={{ color: '#dc3545', fontWeight: '600' }}>
                                    ₹{sale.paymentDetails.dueAmount.toFixed(2)}
                                  </span>
                                ) : (
                                  <span style={{ color: '#28a745' }}>₹0.00</span>
                                )}
                              </div>
                            </td>
                            <td style={{ position: 'relative', }}>
                              <div style={{ top: '5px', position: 'absolute', }}>
                                {sale.paymentDetails?.paymentMethod || 'N/A'}
                              </div>
                            </td>
                            <td style={{ position: 'relative', }}>
                              <div style={{ top: '7px', position: 'absolute', }}>
                                <span style={{
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  backgroundColor: sale.status === 'Paid' ? '#d4edda' :
                                    sale.status === 'Due' ? '#fff3cd' : '#f8d7da',
                                  color: sale.status === 'Paid' ? '#155724' :
                                    sale.status === 'Due' ? '#856404' : '#721c24',
                                  fontSize: '12px'
                                }}>
                                  {sale.status}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'end', marginTop: '10px', padding: '0px 10px', gap: '10px', }}>
                  <div
                    style={{
                      padding: "6px 12px",
                      borderRadius: "5px",
                      border: "1px solid #E6E6E6",
                      backgroundColor: "#FFFFFF",
                      color: "#333",
                      boxShadow: "0px 0px 5px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    10 per page
                  </div>
                  <div
                    style={{
                      padding: "6px 12px",
                      borderRadius: "5px",
                      border: "1px solid #E6E6E6",
                      backgroundColor: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      gap: "15px",
                      color: "#333",
                      boxShadow: "0px 0px 5px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    <span>{((currentPage - 1) * 10) + 1} - {Math.min(currentPage * 10, totalSales)} of {totalSales}</span>
                    <span style={{ color: '#ccc' }}>|</span>
                    <IoIosArrowBack
                      style={{
                        color: currentPage > 1 ? '#333' : '#ccc',
                        cursor: currentPage > 1 ? "pointer" : "not-allowed"
                      }}
                      onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                    />
                    <IoIosArrowForward
                      style={{
                        color: currentPage < totalPages ? '#333' : '#ccc',
                        cursor: currentPage < totalPages ? "pointer" : "not-allowed"
                      }}
                      onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                    />
                  </div>
                </div>

              </div>
            </div>
          </>
        )}

        {/* add customer popup */}
        {addcustomerpopup && (
          <>
            <div style={{
              position: 'fixed',
              top: '0',
              left: '0',
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(199, 197, 197, 0.4)',
              backdropFilter: 'blur(1px)',
              display: 'flex',
              justifyContent: 'center',
              zIndex: '10',
              overflowY: 'auto',
              alignItems: 'center',
            }}
            >
              <div ref={AddCustomerRef} style={{ width: '70vw', height: 'auto', padding: '10px 16px', overflowY: 'auto', backgroundColor: '#fff', border: '1px solid #E1E1E1', borderRadius: '8px', position: 'relative', }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E1E1E1', padding: '10px 0px' }}>
                  <span>Add Customers details</span>
                </div>

                <form onSubmit={handleSubmit}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0px', width: '100%', gap: '15px', marginTop: '5px', }}>
                    <div style={{ width: '100%' }}>
                      <div>Customer Number <span style={{ color: 'red' }}>*</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 15px', backgroundColor: '#F9FAFB', borderRadius: '10px', border: '1px solid #E6E6E6', width: '100%', marginTop: '5px' }}>
                        <input type="text" placeholder='Enter Customer Name' style={{ border: 'none', outline: 'none', width: '100%', backgroundColor: '#F9FAFB' }} name="name" value={form.name} onChange={handleInputChange} required />
                      </div>
                    </div>
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
                      <div style={{ width: '100%' }}>
                        <div>Mobile Number <span style={{ color: 'red' }}>*</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 15px', backgroundColor: '#F9FAFB', borderRadius: '10px', border: '1px solid #E6E6E6', width: '100%', marginTop: '5px' }}>
                          <input
                            type="number"
                            placeholder='Enter Mobile Number'
                            style={{ border: 'none', outline: 'none', width: '100%', backgroundColor: '#F9FAFB' }}
                            name="phone"
                            value={form.phone}
                            onChange={(e) => {
                              // allow only digits and limit to 10
                              const value = e.target.value.replace(/\D/g, "");
                              if (value.length <= 10) {
                                handleInputChange(e);
                              }
                            }}
                            maxLength={10}
                            required
                          />
                        </div>
                      </div>
                      <div style={{ width: '100%' }}>
                        <div>Email Id</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 15px', backgroundColor: '#F9FAFB', borderRadius: '10px', border: '1px solid #E6E6E6', width: '100%', marginTop: '5px' }}>
                          <input type="email" placeholder='Enter Email Id' style={{ border: 'none', outline: 'none', width: '100%', backgroundColor: '#F9FAFB' }} name="email" value={form.email} onChange={handleInputChange} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* address */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0px', width: '100%', gap: '15px', marginTop: '5px', }}>
                    <div style={{ width: '100%' }}>
                      <div>Address</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 15px', backgroundColor: '#F9FAFB', borderRadius: '10px', border: '1px solid #E6E6E6', width: '100%', marginTop: '5px' }}>
                        <textarea type="text" placeholder='Enter Customer Address...' style={{ border: 'none', outline: 'none', width: '100%', backgroundColor: '#F9FAFB' }} ></textarea>
                      </div>
                    </div>
                  </div>

                  {/* select country , state, pin */}
                  <div style={{ display: "flex", gap: "16px", marginBottom: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <label
                        style={{
                          color: "#262626",
                          fontWeight: "400",
                          fontSize: "16px",
                          marginBottom: "8px",
                          display: "block",
                        }}
                      >
                        Country
                      </label>
                      <select
                        value={selectedCountry}
                        onChange={(e) => {
                          // setCountry(e.target.value)
                          const value = e.target.value;
                          setSelectedCountry(value);
                          setFormData((prev) => ({
                            ...prev,
                            companycountry: value,
                            companystate: "",
                            companycity: "",
                          }));

                          setSelectedState(""), setSelectedCity("");
                        }}
                        //
                        style={{
                          width: "100%",
                          padding: "12px",
                          borderRadius: "8px",
                          border: "1px solid #D1D5DB",
                          backgroundColor: "#F9FAFB",
                          color: "#6B7280",
                          fontSize: "14px",
                        }}
                      >
                        <option value="">Select Country</option>
                        {countryList.map((country) => (
                          <option key={country.isoCode} value={country.isoCode}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {/* {console.log("statelist",stateList)} */}
                    <div style={{ flex: 1 }}>
                      <label
                        style={{
                          color: "#262626",
                          fontWeight: "400",
                          fontSize: "16px",
                          marginBottom: "8px",
                          display: "block",
                        }}
                      >
                        State
                      </label>
                      <select
                        value={selectedState}
                        onChange={(e) => {
                          const value = e.target.value;
                          setSelectedState(value);
                          setFormData((prev) => ({
                            ...prev,
                            companystate: value,
                            companycity: "",
                          }));
                          setSelectedCity("");
                        }}
                        disabled={!selectedCountry}
                        style={{
                          width: "100%",
                          padding: "12px",
                          borderRadius: "8px",
                          border: "1px solid #D1D5DB",
                          backgroundColor: "#F9FAFB",
                          color: "#6B7280",
                          fontSize: "14px",
                        }}
                      >
                        <option value="">Select State</option>

                        {stateList.map((state) => (
                          <option key={state.isoCode} value={state.isoCode}>
                            {state.name}
                          </option>
                        ))}
                        {/* <option value="California">California</option>
              <option value="Maharashtra">Maharashtra</option> */}
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label
                        style={{
                          color: "#262626",
                          fontWeight: "400",
                          fontSize: "16px",
                          marginBottom: "8px",
                          display: "block",
                        }}
                      >
                        City
                      </label>
                      <select
                        // value={city}
                        // onChange={(e) => setCity(e.target.value)}
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "12px",
                          borderRadius: "8px",
                          border: "1px solid #D1D5DB",
                          backgroundColor: "#F9FAFB",
                          color: "#6B7280",
                          fontSize: "14px",
                        }}
                      >
                        <option value="">Select City</option>
                        {/* <option value="Los Angeles">Los Angeles</option>
              <option value="Mumbai">Mumbai</option> */}
                        {cityList.map((city) => (
                          <option key={city.name} value={city.name}>
                            {city.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label
                        style={{
                          color: "#262626",
                          fontWeight: "400",
                          fontSize: "16px",
                          marginBottom: "8px",
                          display: "block",
                        }}
                      >
                        Pin Code
                      </label>

                      <input
                        value={pinCode}
                        onChange={(e) => setPinCode(e.target.value)}
                        type="number"
                        placeholder='Eg: 123456'
                        maxLength="6"
                        style={{
                          width: "100%",
                          padding: "12px",
                          borderRadius: "8px",
                          border: "1px solid #D1D5DB",
                          backgroundColor: "#F9FAFB",
                          color: "#6B7280",
                          fontSize: "14px",
                          outline: "none",
                        }}
                      />
                    </div>
                  </div>

                  {/* buttons */}
                  <div style={{ display: 'flex', justifyContent: 'end', padding: '10px 0px', width: '100%', gap: '15px', marginTop: '5px', }}>
                    <button
                      type="button"
                      onClick={() => {
                        // Clear all form fields
                        setForm({
                          name: '',
                          email: '',
                          phone: '',
                          status: true,
                        });
                        // Clear location fields
                        setSelectedCountry('');
                        setSelectedState('');
                        setSelectedCity('');
                        setPinCode('');
                        // Close popup
                        setAddCustomerPopup(false);
                      }}
                      style={{ padding: '3px 10px', backgroundColor: '#6B7280', border: '2px solid #E6E6E6', borderRadius: '8px', color: 'white', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button type="submit" disabled={loading} style={{ padding: '3px 10px', backgroundColor: '#1368EC', border: '2px solid #E6E6E6', borderRadius: '8px', color: 'white', cursor: 'pointer' }}>{loading ? 'Saving...' : 'Save'}</button>
                  </div>
                </form>

              </div>
            </div>
          </>
        )}

        {/* product discount change popup */}
        {discountpopup && (
          <>
            <div style={{
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
              <div ref={DiscountRef} style={{ width: '700px', padding: '10px 16px', overflowY: 'auto', backgroundColor: '#fff', border: '1px solid #E1E1E1', borderRadius: '8px' }}>

                {/* selected item image, name, sku, quantity available, mrp */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E1E1E1', padding: '10px 0px', }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        backgroundColor: 'white',
                        width: '80px',
                        height: '80px',
                        alignItems: 'center',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '2px solid #E6E6E6',
                      }}
                    >
                      {selectedItemForDiscount.images &&
                        selectedItemForDiscount.images.length > 0 &&
                        selectedItemForDiscount.images[0] ? (
                        <img
                          src={selectedItemForDiscount.images[0].url || selectedItemForDiscount.images[0]}
                          alt={selectedItemForDiscount.productName}
                          style={{
                            height: '100%',
                            width: '100%',
                            objectFit: 'contain',
                            maxWidth: '100%',
                            maxHeight: '100%',
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        style={{
                          display:
                            selectedItemForDiscount.images &&
                              selectedItemForDiscount.images.length > 0 &&
                              selectedItemForDiscount.images[0]
                              ? 'none'
                              : 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ccc',
                          fontSize: '24px',
                        }}
                      >
                        <span style={{ fontSize: '10px' }}>No Image</span>
                      </div>
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ marginBottom: '5px' }}>
                        <span style={{ color: 'black', fontWeight: '600', fontSize: '20px' }}>{selectedItemForDiscount?.productName || 'N/A'}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '15px', justifyContent: 'space-around', alignItems: 'center' }}>
                        <div style={{ marginBottom: '5px' }}>
                          <span style={{ color: '#676767' }}>Qty Available: </span>
                          <span>
                            {(() => {
                              // Fallback to products array
                              const product = products.find(p => p._id === selectedItemForDiscount._id);
                              return product ? product.quantity : 'N/A';
                            })()}
                          </span>
                          <span>
                            {(() => {
                              // Fallback to products array
                              const product = products.find(p => p._id === selectedItemForDiscount._id);
                              return product ? product.unit : 'N/A';
                            })()}
                          </span>
                        </div>
                        <div style={{ marginBottom: '5px' }}>
                          <span style={{ color: '#676767' }}>Rate: </span>
                          <span>₹{selectedItemForDiscount.sellingPrice} /-</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ position: 'relative', top: '-5px', right: '-2px' }}>
                    <span style={{ backgroundColor: 'red', color: 'white', padding: '5px 11px', borderRadius: '50%', cursor: 'pointer', fontSize: '15px' }} onClick={closeDiscount}>x</span>
                  </div>

                </div>

                {/* quantity */}
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', gap: '50px', marginTop: '15px' }}>
                  <div style={{ width: '50%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '25px', fontWeight: '500' }}>Quantity</span>
                  </div>
                  <div style={{ width: '25%', display: 'flex', justifyContent: 'center', padding: '10px 0px', gap: '15px', marginTop: '2px', alignItems: 'center' }}>
                  </div>
                  <div style={{ width: '25%', display: 'flex', justifyContent: 'center', padding: '10px 0px', gap: '15px', marginTop: '2px', alignItems: 'center' }}>
                    <button
                      style={{
                        borderRadius: '8px', border: discountQuantity <= 1 ? '1px solid #E6E6E6' : '1px solid #E6E6E6', backgroundColor: discountQuantity <= 1 ? 'white' : '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5px 12px',
                        cursor: discountQuantity <= 1 ? 'not-allowed' : 'pointer',
                      }}
                      onClick={() => handleQuantityChange(discountQuantity - 1)}
                      disabled={discountQuantity <= 1}
                    >
                      -
                    </button>

                    <div><span>{discountQuantity}</span></div>

                    <button
                      style={{
                        borderRadius: '8px', border: '1px solid #E6E6E6', backgroundColor: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5px 12px',
                        cursor: discountQuantity >= (selectedItemForDiscount.availableQuantity || 0) ? 'not-allowed' : 'pointer',
                      }}
                      onClick={() => handleQuantityChange(discountQuantity + 1)}
                      disabled={discountQuantity >= (selectedItemForDiscount.availableQuantity || 0)}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* discount */}
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ width: '50%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '25px', fontWeight: '500' }}>Discount</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0px', width: '50%', gap: '15px', marginTop: '2px', alignItems: 'center' }}>
                    <div style={{ width: '100%', borderRadius: '8px', border: '1px solid #E6E6E6', backgroundColor: '#F9FAFB', display: 'flex', alignItems: 'center', }}>
                      <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 15px', backgroundColor: 'white', borderRadius: '10px', borderRight: '1px solid #E6E6E6', width: '70%' }}>
                        <input
                          type="number"
                          placeholder="00.00"
                          value={discountPercentage}
                          onChange={(e) => handleDiscountPercentageChange(e.target.value)}
                          style={{ border: 'none', outline: 'none', width: '100%', backgroundColor: 'white' }}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', width: '30%', justifyContent: 'center', }}>
                        <span>%</span>
                      </div>
                    </div>

                    <div><span>or</span></div>

                    <div style={{ width: '100%', borderRadius: '8px', border: '1px solid #E6E6E6', backgroundColor: '#F9FAFB', display: 'flex', alignItems: 'center', }}>
                      <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 15px', backgroundColor: 'white', borderRadius: '10px', borderRight: '1px solid #E6E6E6', width: '70%' }}>
                        <input
                          type="number"
                          placeholder="00.00"
                          value={discountFixed}
                          onChange={(e) => handleDiscountFixedChange(e.target.value)}
                          style={{ border: 'none', outline: 'none', width: '100%', backgroundColor: 'white' }}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', width: '30%', justifyContent: 'center', }}>
                        <span>₹</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', marginBottom: '8px' }}>
                  <div></div>
                  <div
                    style={{ padding: '3px 10px', backgroundColor: '#1368EC', border: '2px solid #E6E6E6', borderRadius: '8px', color: 'white', cursor: 'pointer' }}
                    onClick={applyDiscountChanges}
                  >
                    <span>Apply</span>
                  </div>
                </div>

              </div>
            </div>
          </>
        )}

        {/* paymentpopup */}
        {paymentpopup && (
          <>
            <div style={{
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
              <div ref={PaymentRef} style={{ width: '400px', padding: '10px 16px', overflowY: 'auto', backgroundColor: '#fff', border: '1px solid #E1E1E1', borderRadius: '8px', position: 'absolute', top: '100px', bottom: '150px' }}>

                <div style={{ display: 'flex', justifyContent: 'center', borderBottom: '1px solid #E1E1E1', padding: '10px 0px', alignContent: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <img src={PaymentDone} alt="product" style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '8px' }} />
                    <span>Payment Successful</span>
                  </div>
                </div>

                {/* invoice & payment mode */}
                <div style={{ width: '100%' }}>
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                    <span>Invoice no.</span>
                    <span>{selectedSale?.invoiceNumber || 'N/A'}</span>
                  </div>
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                    <span>Payment Mode</span>
                    <span>{selectedSale?.paymentDetails?.paymentMethod || 'N/A'}</span>
                  </div>
                </div>

                {/* Products summery */}
                <div style={{ width: '108%', marginTop: '20px', background: 'linear-gradient(to right, #E3EDFF, #FFFFFF)', marginLeft: '-16px', marginRight: '-16px', padding: '10px 16px', }}>
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                    <span style={{ fontSize: '20px', fontWeight: '600' }}>Payment Summary</span>
                  </div>
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                    <span>Total Amount</span>
                    <span>₹{selectedSale?.totals?.totalAmount || '0.00'}</span>
                  </div>
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                    <span>Amount Received</span>
                    <span>₹{selectedSale?.paymentDetails?.amountReceived?.toFixed(2) || '0.00'}</span>
                  </div>
                  {selectedSale?.paymentDetails?.changeReturned > 0 && (
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                      <span>Amount Returned</span>
                      <span>₹{selectedSale?.paymentDetails?.changeReturned?.toFixed(2) || '0.00'}</span>
                    </div>
                  )}
                  {(selectedSale?.totals?.totalAmount) - (selectedSale?.paymentDetails?.amountReceived?.toFixed(2)) > 0 && (
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                      <span>Amount Due</span>
                      <span>₹{(selectedSale?.totals?.totalAmount) - (selectedSale?.paymentDetails?.amountReceived?.toFixed(2))}</span>
                    </div>
                  )}
                  {/* {selectedSale?.paymentDetails?.bagCharge > 0 && (
                <div style={{width:'100%',display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'2px'}}>
                  <span>Bag Charge</span>
                  <span>₹{selectedSale?.paymentDetails?.bagCharge?.toFixed(2) || '0.00'}</span>
                </div>
              )} */}
                </div>

                {/* customer details */}
                <div style={{ width: '100%', marginTop: '20px' }}>
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                    <span style={{ fontSize: '20px', fontWeight: '600' }}>Customer</span>
                  </div>
                  <div style={{ width: '100%', display: 'flex', alignItems: 'center', marginTop: '10px', gap: '5px' }}>
                    <span>Name:</span>
                    <span style={{ fontWeight: '600' }}>{selectedSale?.customer?.name || 'N/A'}</span>
                  </div>
                  <div style={{ width: '100%', display: 'flex', alignItems: 'center', marginTop: '2px', gap: '5px' }}>
                    <span style={{ color: '#676767' }}>Phone:</span>
                    <span style={{ fontWeight: '600' }}>{selectedSale?.customer?.phone || 'N/A'}</span>
                  </div>
                  {/* {selectedSale?.customer?.email && (
                <div style={{width:'100%',display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'2px'}}>
                  <span style={{color:'#676767'}}>Email:</span>
                  <span style={{fontWeight:'600'}}>{selectedSale?.customer?.email}</span>
                </div>
              )} */}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', marginBottom: '8px', gap: '20px' }}>
                  <div
                    style={{
                      padding: '3px 10px',
                      backgroundColor: isGenerating ? '#ccc' : '#E3F3FF',
                      border: '2px solid #BBE1FF',
                      borderRadius: '8px',
                      color: isGenerating ? '#666' : '#1368EC',
                      display: 'flex',
                      gap: '5px',
                      alignItems: 'center',
                      cursor: isGenerating ? 'not-allowed' : 'pointer',
                    }}
                    onClick={isGenerating ? null : () => {
                      setInvoicePopup(true); // Open invoice popup
                      setTimeout(() => handleInvoicePrint(), 100); // Delay to ensure DOM rendering
                    }}
                  >
                    <span><MdPrint /></span>
                    <span>{isGenerating ? 'Generating...' : 'Print'}</span>
                  </div>
                  <div
                    style={{
                      padding: '3px 10px',
                      backgroundColor: isGenerating ? '#ccc' : '#1368EC',
                      border: '2px solid #E6E6E6',
                      borderRadius: '8px',
                      color: 'white',
                      display: 'flex',
                      gap: '5px',
                      alignItems: 'center',
                      cursor: isGenerating ? 'not-allowed' : 'pointer',
                    }}
                    onClick={isGenerating ? null : () => {
                      setInvoicePopup(true); // Open invoice popup
                      setTimeout(() => handleDownloadPDF(), 100); // Delay to ensure DOM rendering
                    }}
                  >
                    <span><AiOutlineDownload /></span>
                    <span>{isGenerating ? 'Generating...' : 'Download'}</span>
                  </div>
                </div>

                {/* create new invoice */}
                <div style={{ width: '108%', marginTop: '20px', marginLeft: '-16px', marginRight: '-16px', padding: '15px 16px', borderTop: '1px solid #E1E1E1', display: 'flex', justifyContent: 'center' }}>
                  <div
                    style={{
                      padding: '3px 10px',
                      backgroundColor: '#E3F3FF',
                      border: '2px solid #BBE1FF',
                      borderRadius: '8px',
                      color: '#1368EC',
                      display: 'flex',
                      gap: '5px',
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      setPaymentPopup(false);
                      setSelectedSale(null);
                      setSelectedItems([]);
                      setSelectedCustomer(null);
                      setBagCharge(0);
                      setAmountReceived('');
                      setSearchQuery('');
                      setSearchResults([]);
                      setShowDropdown(false);
                      setSubTotal(0);
                      setTotalAmount(0);
                      setRoundedAmount(0);
                      setTotalTax(0);
                      setTotalItems(0);
                      setTotalQuantity(0);
                      setDiscount(0);
                      setCashPopup(false);
                      setCardPopup(false);
                      setUpiPopup(false);
                      fetchPosSales();
                      setSelectedCategory(null);
                      setProducts(allProducts);
                      setUpdown(false);
                      setSearchDrop(false);
                      setCategoryValue('');
                      setSocketValue('');
                      setWarehouseValue('');
                      setExprationValue('');
                      setOtp(['', '', '', '']);
                      setCountry('');
                      setState('');
                      setCity('');
                      setPinCode('');
                      setSelectedCountry('');
                      setSelectedState('');
                      setSelectedCity('');
                      if (formRef.current) {
                        formRef.current.reset();
                      }
                      const initialTabs = allProducts.reduce((acc, product) => {
                        acc[product._id] = "general";
                        return acc;
                      }, {});
                      setActiveTabs(initialTabs);
                      setSearchQuery('');
                      setSearchResults([]);
                      setShowDropdown(false);
                      setPopup(false);
                      setAddCustomerPopup(false);
                      setDiscountPopup(false);
                      setTransactionPopup(false);
                      setSelectedSale(null);
                      setCurrentPage(1);
                      setTotalPages(1);
                      setTotalSales(0);
                      setLoading(false);
                      setPosSales([]);
                      setAmountReceived('');
                      setSearchQuery('');
                      setSearchResults([]);
                      setShowDropdown(false);
                      setPopup(false);
                      setAddCustomerPopup(false);
                      setDiscountPopup(false);
                      setTransactionPopup(false);
                      setSelectedSale(null);
                      setCurrentPage(1);
                      setTotalPages(1);
                      setTotalSales(0);
                      setLoading(false);
                      setPosSales([]);
                      setAmountReceived('');
                      window.location.reload();
                    }}
                  >
                    <span><IoMdAdd /></span>
                    <span>Create New Invoice</span>
                  </div>
                </div>

              </div>
            </div>
          </>
        )}

        {/* paymentpopup */}
        {invoicepopup && (
          <>
            <div style={{
              position: 'fixed',
              top: '0',
              left: '0',
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(199, 197, 197, 0.4)',
              backdropFilter: 'blur(1px)',
              display: 'flex',
              justifyContent: 'center',
              zIndex: '10',
              overflowY: 'auto',
              alignItems: 'center',
            }}
            >
              <div ref={InvoiceRef} style={{ width: '450px', padding: '10px 16px', overflowY: 'auto', backgroundColor: '#fff', border: '1px solid #E1E1E1', borderRadius: '8px', fontSize: '13px' }}>

                <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0px', alignContent: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                    <span>{companyData.companyName}</span>
                    <span>{companyData.companyaddress}</span>
                    <span>Phone - {companyData.companyphone}</span>
                    <span>{companyData.companyemail}</span>
                    <span>GST No. - {companyData.gstin}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0px', alignContent: 'center', borderBottom: '1px solid #E1E1E1' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                    <span>Tax Invoice</span>
                    <span>Customer Copy</span>
                    <span>TAKEAWAY</span>
                  </div>
                </div>

                {/* invoice & payment mode */}
                <div style={{ width: '100%', borderBottom: '1px solid #E1E1E1', paddingBottom: '10px', marginTop: '10px' }}>
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', }}>
                    <span>Invoice - {selectedSale?.invoiceNumber || 'N/A'}</span>
                    <span>{selectedSale?.saleDate || 'N/A'}</span>
                  </div>
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                    <span>Payment Mode - {selectedSale?.paymentDetails?.paymentMethod || 'N/A'}</span>
                    <span>Status - {selectedSale?.status || 'N/A'}</span>
                  </div>
                </div>

                <div style={{ width: '100%', marginTop: '10px', padding: '10px 16px', borderBottom: '1px solid #E1E1E1', }}>
                  <table style={{ width: '100%', marginTop: '10px', borderCollapse: 'collapse', marginBottom: '10px' }}>
                    <thead>
                      <tr>
                        <th style={{ borderBottom: '1px solid #E1E1E1', textAlign: 'left', paddingBottom: '5px' }}>Name</th>
                        <th style={{ borderBottom: '1px solid #E1E1E1', textAlign: 'left', paddingBottom: '5px' }}>Quantity</th>
                        <th style={{ borderBottom: '1px solid #E1E1E1', textAlign: 'left', paddingBottom: '5px' }}>Price / unit</th>
                        <th style={{ borderBottom: '1px solid #E1E1E1', textAlign: 'right', paddingBottom: '5px' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSale?.items?.map((item, index) => (
                        <tr key={index} style={{}}>
                          <td style={{ textAlign: 'left' }}>{item.productName}</td>
                          <td style={{ textAlign: 'left' }}>{item.quantity} {item.unit}</td>
                          <td style={{ textAlign: 'left' }}>₹{item.unitPrice}</td>
                          <td style={{ textAlign: 'right' }}>₹{item.totalPrice?.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Products summery */}
                <div style={{ width: '100%', marginTop: '10px', padding: '10px 16px', }}>
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                    <span style={{ fontSize: '20px', fontWeight: '600' }}>Payment Summary</span>
                  </div>
                  {selectedSale?.paymentDetails?.bagCharge > 0 && (
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                      <span>Bag Charge</span>
                      <span>₹{selectedSale?.paymentDetails?.bagCharge?.toFixed(2) || '0.00'}</span>
                    </div>
                  )}
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                    <span>Total Discount</span>
                    <span>₹{totalDiscountinvoice.toFixed(2)}</span>
                  </div>
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                    <span>Total Tax</span>
                    <span>₹{totalTaxinvoice.toFixed(2)}</span>
                  </div>
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                    <span>Total Amount</span>
                    <span>₹{selectedSale?.totals?.totalAmount || '0.00'}</span>
                  </div>
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                    <span>Amount Received</span>
                    <span>₹{selectedSale?.paymentDetails?.amountReceived?.toFixed(2) || '0.00'}</span>
                  </div>
                  {selectedSale?.paymentDetails?.changeReturned > 0 && (
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                      <span>Amount Returned</span>
                      <span>₹{selectedSale?.paymentDetails?.changeReturned?.toFixed(2) || '0.00'}</span>
                    </div>
                  )}
                  {(selectedSale?.totals?.totalAmount) - (selectedSale?.paymentDetails?.amountReceived?.toFixed(2)) > 0 && (
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                      <span>Amount Due</span>
                      <span>₹{(selectedSale?.totals?.totalAmount) - (selectedSale?.paymentDetails?.amountReceived?.toFixed(2))}</span>
                    </div>
                  )}
                </div>

                {/* customer details */}
                <div style={{ width: '100%', marginTop: '10px', borderBottom: '1px solid #E1E1E1', padding: '10px 16px', marginBottom: '0px' }}>
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                    <span style={{ fontSize: '20px', fontWeight: '600' }}>Customer Details</span>
                  </div>
                  <div style={{ width: '100%', display: 'flex', alignItems: 'center', marginTop: '10px', gap: '5px', justifyContent: 'space-between' }}>
                    <span>Name:</span>
                    <span style={{ fontWeight: '600' }}>{selectedSale?.customer?.name || 'N/A'}</span>
                  </div>
                  <div style={{ width: '100%', display: 'flex', alignItems: 'center', marginTop: '2px', gap: '5px', marginBottom: '20px', justifyContent: 'space-between' }}>
                    <span>Phone:</span>
                    <span style={{ fontWeight: '600' }}>{selectedSale?.customer?.phone || 'N/A'}</span>
                  </div>
                </div>


                <div style={{ display: 'flex', justifyContent: 'center', borderBottom: '1px solid #E1E1E1', padding: '10px 0px', alignContent: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                    <span>Thank You for Visiting {companyData.companyName}</span>
                    <span>Have a Nice Day</span>
                  </div>
                </div>

              </div>
            </div>
          </>
        )}

        {/* Add Customer Modal */}
        {openAddModal && (
          <div
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
            onClick={() => setOpenAddModal(false)}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <AddCustomers
                onClose={() => {
                  setOpenAddModal(false);
                  fetchCustomers();
                }}
              />
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default Pos
