import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import "../../../styles/login.css";
import { MdOutlineEmail } from "react-icons/md";
import { FaRegEyeSlash, FaRegEye } from "react-icons/fa";
import MuncLogo from "../../../assets/img/logo/munclogotm.png";
import { Link } from 'react-router-dom';
import axios from 'axios';
import BASE_URL from '../../../pages/config/config';
import { toast } from 'react-toastify';
import api from "../../../pages/config/axiosInstance";
import Cookies from "js-cookie";
import { useAuth } from "../AuthContext"




const Login = () => {
  const location = useLocation();
  const inactiveMessage = location.state?.inactive;
  const { setUser } = useAuth();


  useEffect(() => {
    if (inactiveMessage) {
      toast.error("You are set Inactive by admin. Please first contact him")
    }
  }, [inactiveMessage]);

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  // state for two factor authentication
  const [otpStep, setOtpStep] = useState(false)
  const [otp, setOtp] = useState("")
  const [emailForOtp, setEmailForOtp] = useState("")
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };


  // for device management
  const logDeviceSession = (userId) => {
    // const token = localStorage.getItem("token"); // <-- Add this line
    // const token = Cookies.get("token");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          api.post("/api/auth/log-device", {
            userId,
            latitude,
            longitude,
          }, {
             skipAuthInterceptor: true,
          })
            .then((res) => console.log("Device logged:", res.data))
            .catch((err) => console.error("Device log failed:", err.response?.data || err.message));
        },
        (error) => {
          console.error("Geolocation error:", error)
        }
      )
    } else {
      console.warn("Geolocation not supported")
    }
  }



  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;   // prevent multiple submits
    setLoading(true);

    try {

      //ste 2: Proceed with normal login
      // let deviceId = localStorage.getItem("deviceId");
      let deviceId = Cookies.get("deviceId")
      if (!deviceId) {
        deviceId = crypto.randomUUID();
        // localStorage.setItem("deviceId", deviceId);
        Cookies.set("deviceId", deviceId, { expires: 365, path: "/" })
      }
      const deviceInfo = navigator.userAgent;

      const res = await api.post("/api/auth/login", {
        email: formData.email,
        password: formData.password,
        deviceId,
        deviceInfo
      }, { withCredentials: true, skipAuthInterceptor: true, });
      let normalizedUser = null;

      if (res?.data?.user) {
        const user = res.data.user;
        normalizedUser = {
          ...user,
          _id: user._id || user.id,
        }
      }
      // step 3: for two factor
      if (res.data.twoFactor === true) {

        // Set cookies for frontend
        Cookies.set("otpPending", "true", {
          expires: new Date(Date.now() + 5 * 60 * 1000),
          path: "/"
        });
        Cookies.set("otpEmail", formData.email, { // IMPORTANT
          expires: new Date(Date.now() + 5 * 60 * 1000),
          path: "/"
        });
        // Navigate with state
        navigate("/otp", {
          replace: true,
          state: {
            email: formData.email,
            fromLogin: true,
            timestamp: Date.now()
          }
        });
        return;
      }

      // step 4: Normal login success
      // const userId = res.data?.user?._id || res.data?.user?.id;
      // localStorage.setItem("userId", normalizedUser._id)

      try {
        const me = await api.get("/api/auth/me", { withCredentials: true, skipAuthInterceptor: true });
        const hydrated = me?.data?.user || normalizedUser;
        if (hydrated) {
          setUser(hydrated);
          try {
            // localStorage.setItem("user", JSON.stringify(hydrated));
            Cookies.set("userId", hydrated._id || hydrated.id, { expires: 7, path: "/" });
            if (hydrated.email) {
              Cookies.set("userEmail", hydrated.email, { expires: 7, path: "/" });
            }
            if (hydrated.name) {
              Cookies.set("userName", hydrated.name, { expires: 7, path: "/" });
            }
          } catch (e) { void e; }
          try {
            window.__authGraceUntil = Date.now() + 3000;
          } catch (e) { void e; }
        }
      } catch (e) { void e; }

      setTimeout(() => {
        logDeviceSession(normalizedUser._id);
      }, 500);

      toast.success("Login Successful!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Login Error:", error);
      //reset loading here if login fails
      setLoading(false);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        alert("Something went wrong. Try again.");
      }
    }
  };


  return (
    <div className="main-wrapper">
      <div className="account-content">
        <div className="login-wrapper bg-img">
          <div className="login-content authent-content">
            <form onSubmit={handleSubmit}>
              <div className="login-userset">
                <div className="login-logo logo-normal">
                  <img src={MuncLogo} alt="img" />
                </div>

                <div className="login-userheading">
                  <h3>Sign In</h3>
                  <h4 className="fs-16">Access the munches panel using your email and passcode.</h4>
                </div>

                {/* Email */}
                <div className="mb-3">
                  <label className="form-label">Email <span className="text-danger"> *</span></label>
                  <div className="input-group">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="form-control border-end-0"
                      placeholder='Enter your email'
                      required
                    />
                    <span className="input-group-text border-start-0">
                      <MdOutlineEmail />
                    </span>
                  </div>
                </div>

                {/* Password */}
                <div className="mb-3">
                  <label className="form-label">Password <span className="text-danger"> *</span></label>
                  <div className="pass-group input-group">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="pass-input form-control border-end-0"
                      required
                      placeholder='Enter your password'
                    />
                    <span
                      className="input-group-text border-start-0 cursor-pointer"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? <FaRegEye /> : <FaRegEyeSlash />}
                    </span>
                  </div>
                </div>

                <div className="form-login authentication-check">
                  <div className="row">
                    <div className="col-12 d-flex align-items-center justify-content-between">
                      <div className="custom-control custom-checkbox">
                        <label className="checkboxs ps-4 mb-0 pb-0 line-height-1 fs-16 text-gray-6">
                          <input type="checkbox" className="form-control" />
                          <span className="checkmarks" />Remember me
                        </label>
                      </div>
                      <div className="text-end">
                        <Link to="/forgot-password" className="text-orange fs-16 fw-medium">Forgot Password?</Link>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="form-login">
                  <button type="submit" className="btn btn-primary w-100" disabled={loading}>{loading ? "Signing..." : "Sign In"}</button>
                </div>
                <div className="my-4 d-flex justify-content-center align-items-center copyright-text">
                  <p>Copyright © 2025 Kasper Infotech Pvt. Ltd.</p>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login;
