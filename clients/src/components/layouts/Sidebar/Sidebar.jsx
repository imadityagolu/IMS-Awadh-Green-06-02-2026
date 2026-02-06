import React, { useState, useEffect, useRef, useMemo } from 'react';
import { setThemeColor, restoreThemeColor } from '../../../utils/setThemeColor';
import PerfectScrollbar from 'react-perfect-scrollbar';
import 'react-perfect-scrollbar/dist/css/styles.css';
import { getMenuData } from "./MenuData.jsx";
// import { horizontalSidebarMenu } from "./horizontalSidebarData.jsx";
import { Link } from 'react-router-dom';
import { useSidebar } from "../../../Context/sidetoggle/SidebarContext";
import axios from 'axios';
import BASE_URL from '../../../pages/config/config.js';
import Logo from "../../../assets/img/logo/munclogotm.png";
import IconLogo from "../../../assets/img/logo/MuncSmall.svg";
import { TbBell, TbCirclePlus, TbCommand, TbDeviceLaptop, TbDotsVertical, TbFileText, TbLanguage, TbLogout, TbMail, TbMaximize, TbSearch, TbSettings, TbUserCircle } from 'react-icons/tb';
import { AiOutlineMenuFold, AiOutlineDown, AiOutlineLeft, AiOutlineRight, AiOutlineUp } from 'react-icons/ai';
import { NavLink, useLocation } from "react-router-dom";
import { IoIosArrowForward } from 'react-icons/io';
import { useAuth } from '../../auth/AuthContext.jsx';
import { useTranslation } from "react-i18next";
import api from "../../../pages/config/axiosInstance.js"


// Main Sidebar Menu Data
const mainSidebarMenu = [
	{
		header: 'Main',
		items: [
			{
				type: 'submenu',
				icon: 'ti ti-layout-grid fs-16 me-2',
				title: 'Dashboard',
				links: [
					{ title: 'Admin Dashboard', link: '/home', active: true },
					{ title: 'Admin Dashboard 2', link: 'admin-dashboard.html' },
					{ title: 'Sales Dashboard', link: 'sales-dashboard.html' },
				],
			},
			{
				type: 'submenu',
				icon: 'ti ti-user-edit fs-16 me-2',
				title: 'Super Admin',
				links: [
					{ title: 'Dashboard', link: 'dashboard.html' },
					{ title: 'Companies', link: 'companies.html' },
					{ title: 'Subscriptions', link: 'subscription.html' },
					{ title: 'Packages', link: 'packages.html' },
					{ title: 'Domain', link: 'domain.html' },
					{ title: 'Purchase Transaction', link: 'purchase-transaction.html' },
				],
			},
			// ...add more submenus/items as needed
		],
	},
	{
		header: 'Main',
		items: [
			{
				type: 'submenu',
				icon: 'ti ti-layout-grid fs-16 me-2',
				title: 'Dashboard',
				links: [
					{ title: 'Admin Dashboard', link: '/home', active: true },
					{ title: 'Admin Dashboard 2', link: 'admin-dashboard.html' },
					{ title: 'Sales Dashboard', link: 'sales-dashboard.html' },
				],
			},
			{
				type: 'submenu',
				icon: 'ti ti-user-edit fs-16 me-2',
				title: 'Super Admin',
				links: [
					{ title: 'Dashboard', link: 'dashboard.html' },
					{ title: 'Companies', link: 'companies.html' },
					{ title: 'Subscriptions', link: 'subscription.html' },
					{ title: 'Packages', link: 'packages.html' },
					{ title: 'Domain', link: 'domain.html' },
					{ title: 'Purchase Transaction', link: 'purchase-transaction.html' },
				],
			},
			// ...add more submenus/items as needed
		],
	},
	// ...add more headers/sections as needed
];

// Horizontal Sidebar Menu Data
// const horizontalSidebarMenu = [
// 	{
// 		title: 'Main Menu',
// 		icon: 'ti ti-layout-grid fs-16 me-2',
// 		links: [
// 			{ title: 'Admin Dashboard', link: '/home', active: true },
// 			{ title: 'Admin Dashboard 2', link: 'admin-dashboard.html' },
// 			{ title: 'Sales Dashboard', link: 'sales-dashboard.html' },
// 		],
// 	},
// 	// ...add more horizontal menu sections
// ];

// Two Col Sidebar Tabs Data
const twoColSidebarTabs = [
	{ icon: 'ti ti-smart-home', target: '#dashboard', title: 'Dashboard' },
	{ icon: 'ti ti-user-star', target: '#super-admin', title: 'Super Admin' },
	{ icon: 'ti ti-layout-grid-add', target: '#application', title: 'Apps' },
	{ icon: 'ti ti-layout-board-split', target: '#layout', title: 'Layout' },
	{ icon: 'ti ti-table-plus', target: '#inventory', title: 'Inventory' },
	{ icon: 'ti ti-stack-3', target: '#stock', title: 'Stock' },
	{ icon: 'ti ti-device-laptop', target: '#sales', title: 'Sales' },
	{ icon: 'ti ti-shopping-cart-dollar', target: '#finance', title: 'Finance' },
	{ icon: 'ti ti-cash', target: '#hrm', title: 'Hrm' },
	{ icon: 'ti ti-license', target: '#reports', title: 'Reports' },
	{ icon: 'ti ti-page-break', target: '#pages', title: 'Pages' },
	{ icon: 'ti ti-lock-check', target: '#settings', title: 'Settings' },
	{ icon: 'ti ti-ux-circle', target: '#ui-elements', title: 'UI Elements' },
	{ icon: 'ti ti-vector-triangle', target: '#extras', title: 'Extras' },
];



const Sidebar = () => {
	const { user, setUser} = useAuth();
	 const { t } = useTranslation();
//   const [sidebarOpen, setSidebarOpen] = useState(false); // For mobile sidebar
//   const [miniSidebar, setMiniSidebar] = useState(false); // For mini sidebar
//   const [hovered, setHovered] = useState(false); // For mini sidebar hover
  const [themeColor, setThemeColor] = useState(localStorage.getItem('color') || 'info');
  const sidebarRef = useRef(null);
  const menuData = useMemo(() => getMenuData(user, t), [user, t]);
	// const { openMenus, toggleMenu, mobileOpen, handleMobileToggle, handleLinkClick } = useSidebar();
	const {
  openMenus,
  toggleMenu,
  mobileOpen,
  sidebarOpen, setSidebarOpen,
  miniSidebar, setMiniSidebar,
  hovered, setHovered,
  handleMobileToggle,
  handleLinkClick,
} = useSidebar();
  const [companyImages, setCompanyImages] = useState(null)
  const [isDarkMode, setIsDarkMode] = useState(false)

	
	const location = useLocation();

const isPathActive = (path) => {
  if (!path) return false;
  // exact match OR prefix match for nested routes
  return location.pathname === path || location.pathname.startsWith(path + "/");
	};
	
	

	// Handle submenu open/close
	// const toggleMenu = (idx, iidx) => {
	// 	setOpenMenus((prev) => ({
	// 		...prev,
	// 		[`${idx}-${iidx}`]: !prev[`${idx}-${iidx}`],
	// 	}));
	// };

	// Handle mobile sidebar toggle
	const handleMobileSidebar = (e) => {
		e.preventDefault();
		setSidebarOpen((prev) => !prev);
	};

	// Handle overlay click
	const handleOverlayClick = () => {
		setSidebarOpen(false);
		setMiniSidebar(false);
	};

	// Handle mini sidebar toggle
	const handleMiniSidebar = (e) => {
		e.preventDefault();
		setMiniSidebar((prev) => !prev);
	};

  // Add/remove classes to body/html for sidebar state
  useEffect(() => {
	const html = document.documentElement;
	if (sidebarOpen) {
	  html.classList.add('menu-opened');
	} else {
	  html.classList.remove('menu-opened');
	}
	if (miniSidebar) {
	  document.body.classList.add('mini-sidebar');
	} else {
	  document.body.classList.remove('mini-sidebar');
	}
	// Clean up on unmount
	return () => {
	  html.classList.remove('menu-opened');
	  document.body.classList.remove('mini-sidebar');
	};
  }, [sidebarOpen, miniSidebar]);

  // Listen for theme color changes and update state/UI
  useEffect(() => {
	const handleStorage = () => {
	  const color = localStorage.getItem('color') || 'info';
	  setThemeColor(color);
	  document.documentElement.setAttribute('data-color', color);
	  // If custom color is set, apply it
	  restoreThemeColor();
	};
	window.addEventListener('storage', handleStorage);
	// Also update on mount
	handleStorage();
	return () => window.removeEventListener('storage', handleStorage);
  }, []);

	// Mini sidebar hover logic (matches script.js)
	useEffect(() => {
		if (!miniSidebar) return;
		const handleMouseOver = (e) => {
			if (document.body.classList.contains('mini-sidebar') && document.getElementById('toggle_btn').offsetParent !== null) {
				const sidebar = sidebarRef.current;
				if (sidebar && (sidebar.contains(e.target) || (document.querySelector('.header-left') && document.querySelector('.header-left').contains(e.target)))) {
					setHovered(true);
					document.body.classList.add('expand-menu');
				} else {
					setHovered(false);
					document.body.classList.remove('expand-menu');
				}
			}
		};
		document.addEventListener('mouseover', handleMouseOver);
		return () => document.removeEventListener('mouseover', handleMouseOver);
	}, [miniSidebar]);

	// Optionally, sticky sidebar logic can be added here with useEffect

	// user profile
	// const [user, setUser] = useState(null);
	// const userObj = JSON.parse(localStorage.getItem("user"));
	const userId = user?.id || user?._id; // or userObj?._id based on your schema
	// const token = localStorage.getItem("token");

 useEffect(() => {
	// if (!userId || !token) return;
	if (!userId) return;

	const fetchUser = async () => {
	  try {
		const res = await api.get(`/api/user/userdata/${userId}`, {
		  withCredentials:true,
		});
		setUser(res.data);
	  } catch (err) {

		// console.log("Full URL:", `${BASE_URL}/api/user/userdata/${userId}`);

		console.error("Profile fetch failed:", err);
	  }
	};

	fetchUser();
  }, [userId]);

  // fetch company details
    useEffect(() => {
      const fetchCompanyDetails = async () => {
        try {
          const res = await api.get("/api/companyprofile/get")
          if (res.status === 200) {
            setCompanyImages(res.data.data)
            // console.log("res.data", res.data.data)
          }
        } catch (error) {
          toast.error("Unable to find company details", {
            position: 'top-center'
          })
        }
      }
      fetchCompanyDetails();
    }, []);

	return (
		<>
			{/* Sidebar Overlay for mobile */}
			{sidebarOpen && (
				<div className="sidebar-overlay opened" onClick={handleOverlayClick}></div>
			)}
			{/* Main Sidebar */}
			

			<div
				className={`sidebar${mobileOpen ? ' slide-nav' : ''}${miniSidebar ? ' mini-sidebar' : ''}${hovered ? ' expand-menu' : ''} ${themeColor}`}


				id="sidebar"
				ref={sidebarRef}
				data-color={themeColor}
			>
				{/* Logo and Profile */}
				<div className="sidebar-logo active" >
					{/* <a href="/dashboard" className="logo logo-normal" style={{ padding: '0 10px', height: '40px', width: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
						 <img src={isDarkMode ? companyImages?.companyDarkLogo : companyImages?.companyLogo} className="compact-logo" alt="Logo" style={{height: "65px"}}/>
					</a> */}
					<Link to="/home" className="logo logo-normal" style={{width:'65px', height:'65px', objectFit:'cover'}}>
						<img src={isDarkMode ? companyImages?.companyDarkLogo : companyImages?.companyLogo} alt="Logo" />
					</Link>

					<Link href="/dashboard" className="logo-small" style={{width:'40px', height:'40px', objectFit:'cover'}}>
						<img src={companyImages?.companyIcon} class="compact-logo" alt="Compact Footer Logo" />
					</Link>
					<a
						id="toggle_btn"
						href="#"
						onClick={handleMiniSidebar}
						title="Toggle Mini Sidebar"
					>
						<AiOutlineMenuFold />
					</a>
					{/* Mobile menu button */}
					<a
						id="mobile_btn"
						href="#"
						className="mobile_btn d-md-none d-block"
						onClick={handleMobileSidebar}
						title="Open Sidebar"
						style={{ position: 'absolute', left: 0, top: 0, zIndex: 1001 }}
					>
						<AiOutlineMenuFold />
					</a>
				</div>

				<div className="modern-profile p-3 pb-0">
					{user ? (<div className="text-center rounded bg-light p-3 mb-4 user-profile">
						<div className="avatar avatar-lg online mb-3">

							{user.profileImage &&
								user.profileImage.length > 0 ? (
								<img
									src={user.profileImage[0].url}
									alt="Profile"
									className="img-fluid rounded-circle"
								/>
							) : (
								<div
									className="bg-secondary text-white  d-flex justify-content-center align-items-center"
									style={{ width: "40px", height: "40px" }}
								>
									{user.firstName?.charAt(0)}
									{user.lastName?.charAt(0)}
								</div>
							)}
						</div>
						<h6 className="fs-14 fw-bold mb-1">{user.firstName} {user.lastName}</h6>
						<p className="fs-12 mb-0">{user.role?.roleName}</p>
					</div>) : (<p>Loading user profile...</p>)}

					<div className="sidebar-nav mb-3">
						<ul
							className="nav nav-tabs nav-tabs-solid nav-tabs-rounded nav-justified bg-transparent"
							role="tablist"
						>
							<li className="nav-item">
								<a className="nav-link active border-0" href="#">
									Menu
								</a>
							</li>
							<li className="nav-item">
								<a className="nav-link border-0" href="chat.html">
									Chats
								</a>
							</li>
							<li className="nav-item">
								<a className="nav-link border-0" href="email.html">
									Inbox
								</a>
							</li>
						</ul>
					</div>
				</div>


				<div className="sidebar-header p-3 pb-0 pt-2">
					{user ? (<div className="text-center rounded bg-light p-2 mb-4 sidebar-profile d-flex align-items-center">
						<div className="avatar avatar-md onlin">

							{user.profileImage &&
								user.profileImage.length > 0 ? (
								<img
									src={user.profileImage[0].url}
									alt="Profile"
									className="img-fluid rounded-circle"
								/>
							) : (
								<div
									className="bg-secondary text-white  d-flex justify-content-center align-items-center"
									style={{ width: "40px", height: "40px" }}
								>
									{user.firstName?.charAt(0)}
									{user.lastName?.charAt(0)}
								</div>
							)}
						</div>
						<div className="text-start sidebar-profile-info ms-2">
							<h6 className="fs-14 fw-bold mb-1">{user.firstName} {user.lastName}</h6>
							<p className="fs-12">{user.role?.roleName}</p>
						</div>
					</div>) : (<p>Loading user profile...</p>
					)}

					<div className="d-flex align-items-center justify-content-between menu-item mb-3">
						<div>
							<a href="/home" className="btn btn-sm btn-icon bg-light">
								<i className="ti ti-layout-grid-remove"></i>
							</a>
						</div>
						<div>
							<a href="chat.html" className="btn btn-sm btn-icon bg-light">
								<i className="ti ti-brand-hipchat"></i>
							</a>
						</div>
						<div>
							<a
								href="email.html"
								className="btn btn-sm btn-icon bg-light position-relative"
							>
								<TbFileText />
							</a>
						</div>
						<div className="notification-item">
							<a
								href="activities.html"
								className="btn btn-sm btn-icon bg-light position-relative"
							>
								<TbMail />
								<span className="notification-status-dot"></span>
							</a>
						</div>
						<div className="me-0">
							<a href="general-settings.html" className="btn btn-sm btn-icon bg-light">
								<TbSettings />
							</a>
						</div>
					</div>
				</div>



				<div className="sidebar-inner slimscroll">
					<div id="sidebar-menu" className="sidebar-menu">
						<ul>
							{menuData.map((section, idx) => (
								<li key={idx} className="submenu-open">
									{section.section && <h6 className="submenu-hdr">{section.section}</h6>}
									<ul>
										{section.items.map((item, iidx) => {
											// If item has subItems, determine if any child is active
											if (item.subItems) {
												const anyChildActive = item.subItems.some((sub) => {
													if (sub.nested) {
														return sub.nested.some((n) => isPathActive(n.path));
													}
													return isPathActive(sub.path);
												});
												const isOpen = !!openMenus[item.key] || anyChildActive;
												return (
													<li
														className={`submenu ${openMenus[item.key] ? "open" : ""}`}
														key={iidx}
													>
														<a
															href="#"
															className={`subdrop ${openMenus[item.key] ? "active" : ""} ${anyChildActive ? "active" : ""}`}
															onClick={(e) => {
																e.preventDefault();
																toggleMenu(item.key);
															}}
														>
															{item.icon}
															<span>{item.title}</span>
															{isOpen ? (
																<AiOutlineRight
																	className={`menu-arrow ${isOpen ? "rotated" : ""}`}
																/>

															) : (
																<AiOutlineUp className="menu-arrow" />
															)}
														</a>

														<ul
															style={{
																display: openMenus[item.key] || anyChildActive ? "block" : "none",
															}}
														>
															{item.subItems.map((sub, subIdx) =>
																sub.nested ? (
																	<li
																		key={subIdx}
																		className={`submenu submenu-two ${openMenus[sub.nestedKey] ? "open" : ""}`}
																	>
																		<a
																			href="#"
																			onClick={(e) => {
																				e.preventDefault();
																				toggleMenu(sub.nestedKey);
																			}}
																			className={openMenus[sub.nestedKey] ? "active" : ""}
																		>
																			{sub.label}
																			<span className={`menu-arrow inside-submenu ${openMenus[sub.nestedKey] ? "rotated" : ""}`}></span>
																		</a>

																		<ul style={{ display: openMenus[sub.nestedKey] ? "block" : "none" }}>
																			{sub.nested.map((n, nIdx) => (
																				<li key={nIdx}>
																					<NavLink
																						to={n.path}
																						onClick={handleLinkClick}
																						className={({ isActive }) => (isActive ? "active" : "")}
																					>
																						{n.label}
																					</NavLink>
																				</li>
																			))}
																		</ul>
																	</li>
																) : (
																	<li key={subIdx}>
																		<NavLink
																			to={sub.path}
																			onClick={handleLinkClick}
																			className={({ isActive }) => (isActive ? "active" : "")}
																		>
																			{sub.label}
																		</NavLink>
																	</li>
																)
															)}
														</ul>
													</li>
												);
											}

											// Single-level item (no subItems)
											return (
												<li key={iidx}>
													<NavLink
														to={item.path}
														onClick={handleLinkClick}
														className={({ isActive }) => (isActive ? "active" : "")}
													>
														{item.icon}
														<span>{item.label}</span>
													</NavLink>
												</li>
											);
										})}
									</ul>
								</li>
							))}
						</ul>
					</div>
				</div>

			</div>
		</>
	);
};

export default Sidebar;
